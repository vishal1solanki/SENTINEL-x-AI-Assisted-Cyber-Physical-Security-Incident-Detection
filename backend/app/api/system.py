import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database.session import get_db
from ..schemas.schemas import SystemHealthResponse

router = APIRouter(tags=["System Health"])

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "SENTINEL-X Backend",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/api/system/status", response_model=SystemHealthResponse)
def get_system_status(db: Session = Depends(get_db)):
    # 1. Test database query
    db_status = "ONLINE"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "DEGRADED"

    # 2. Check AI status
    ai_provider = os.getenv("AI_PROVIDER", "openai")
    ai_key = os.getenv("AI_API_KEY", "").strip()
    if ai_key:
        ai_status = f"Cloud AI ({ai_provider}) Active"
    else:
        ai_status = "Demo AI Investigator Active (Rule-Based Fallback)"

    return SystemHealthResponse(
        backend="ONLINE",
        database=db_status,
        n8n="ONLINE",
        ai_provider=ai_provider,
        ai_status=ai_status,
        websocket="ONLINE",
        simulator="ONLINE",
        wokwi="READY",
        timestamp=datetime.now(timezone.utc)
    )

@router.post("/api/system/test-telegram")
async def test_telegram():
    from ..services.telegram_service import TelegramNotifier
    sent = await TelegramNotifier.notify_test()
    if sent:
        return {"status": "SUCCESS", "message": "Alert notification dispatched to @VIsahhal_bot successfully!"}
    else:
        return {"status": "ERROR", "message": "Failed to send to Telegram. Check token & chat ID."}

