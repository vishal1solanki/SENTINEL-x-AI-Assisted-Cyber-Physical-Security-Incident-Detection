import os
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict
import bcrypt
import jwt
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.models import User, AuditLog
from ..schemas.schemas import TokenData

JWT_SECRET = os.getenv("JWT_SECRET", "sentinel-x-super-secret-jwt-key-change-in-production-min32bytes")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenData(user_id=user_id, email=email, role=role)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        # In demo mode, if no authorization header is provided, provide a default demo analyst
        if os.getenv("DEMO_MODE", "true").lower() == "true":
            demo_user = db.query(User).filter(User.role == "SOC_ANALYST").first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token_data = decode_access_token(token)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role}'. Required: {allowed_roles}"
            )
        return current_user
    return role_checker

# --- In-Memory Rate Limiter ---
class RateLimiter:
    def __init__(self, requests_per_minute: int = 120):
        self.rpm = requests_per_minute
        self.requests: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - 60.0
        if client_ip not in self.requests:
            self.requests[client_ip] = [now]
            return True
        # Filter old timestamps
        self.requests[client_ip] = [t for t in self.requests[client_ip] if t > window_start]
        if len(self.requests[client_ip]) >= self.rpm:
            return False
        self.requests[client_ip].append(now)
        return True

global_rate_limiter = RateLimiter(requests_per_minute=200)
auth_rate_limiter = RateLimiter(requests_per_minute=20)  # stricter for login/auth

# --- Audit Logging Helper ---
def log_audit_action(
    db: Session,
    action: str,
    target_type: str,
    target_id: str,
    details: dict,
    user_id: Optional[str] = None
):
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")
