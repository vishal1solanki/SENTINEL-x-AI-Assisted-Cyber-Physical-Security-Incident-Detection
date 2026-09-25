from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.models import User
from ..schemas.schemas import UserLogin, Token, UserResponse
from ..services.security import verify_password, create_access_token, get_current_user, auth_rate_limiter, log_audit_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    if not auth_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait 60 seconds."
        )

    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        log_audit_action(
            db=db,
            action="LOGIN_FAILED",
            target_type="USER",
            target_id=credentials.email,
            details={"ip": client_ip}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

    log_audit_action(
        db=db,
        action="LOGIN_SUCCESS",
        target_type="USER",
        target_id=user.id,
        details={"ip": client_ip, "role": user.role},
        user_id=user.id
    )

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        name=user.name
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
