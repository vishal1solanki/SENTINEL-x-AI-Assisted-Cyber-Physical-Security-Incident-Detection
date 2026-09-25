import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .database.session import Base, engine, SessionLocal
from .websocket.connection_manager import ws_manager
from .api import (
    auth_router, rooms_router, devices_router, sensors_router,
    events_router, incidents_router, trust_router, blind_spots_router,
    simulator_router, responses_router, reports_router, system_router
)

# Custom Security Headers Middleware ("so this couldnt be hack")
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' * data: blob:;"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    Base.metadata.create_all(bind=engine)
    # Auto-seed if database is new
    from .database.seed import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"[STARTUP] Seeding check: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="SENTINEL-X Cyber-Physical Security API",
    description=(
        "AI-Assisted Cyber-Physical Security Incident Detection, Investigation, "
        "Sensor Trust, and Simulated Response Platform."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Apply Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(system_router)
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(devices_router)
app.include_router(sensors_router)
app.include_router(events_router)
app.include_router(incidents_router)
app.include_router(trust_router)
app.include_router(blind_spots_router)
app.include_router(simulator_router)
app.include_router(responses_router)
app.include_router(reports_router)

# WebSocket Endpoint for Real-time Event Streaming
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive heartbeat & client message handling
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
