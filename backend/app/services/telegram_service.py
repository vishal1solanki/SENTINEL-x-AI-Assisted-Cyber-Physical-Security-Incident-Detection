import os
import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

async def forward_to_n8n(event_dict: Dict[str, Any]) -> bool:
    """
    Best-effort asynchronous event dispatch to n8n webhook.
    Enables live execution of Sentinel-X n8n orchestration pipelines.
    """
    webhook_url = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/sentinel-event").strip()
    if not webhook_url:
        return False

    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            res = await client.post(webhook_url, json=event_dict)
            if res.status_code in (200, 201):
                logger.info(f"Event {event_dict.get('id', 'N/A')} forwarded to n8n workflow.")
                return True
            else:
                logger.debug(f"n8n webhook response {res.status_code}: {res.text}")
                return False
    except Exception as e:
        logger.debug(f"n8n webhook offline or unreachable: {e}")
        return False

class TelegramNotifier:
    @classmethod
    def get_credentials(cls):
        token = os.getenv("TELEGRAM_BOT_TOKEN", "8950664692:AAGQrU8qYDztonRz6-HBV6fpnYI9M_mGxwo").strip()
        chat_id = os.getenv("TELEGRAM_CHAT_ID", "5288037578").strip()
        return token, chat_id

    @classmethod
    async def send_message(cls, text: str, parse_mode: str = "HTML") -> bool:
        token, chat_id = cls.get_credentials()
        if not token or not chat_id:
            logger.info("Telegram notification skipped: credentials not set.")
            return False

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    logger.info(f"Telegram alert delivered to chat {chat_id}")
                    return True
                else:
                    logger.warning(f"Telegram API response {res.status_code}: {res.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")
            return False

    @classmethod
    async def notify_incident(cls, incident: Dict[str, Any], trigger_event: Optional[Dict[str, Any]] = None):
        title = incident.get("title", "Physical Security Breach")
        inc_id = incident.get("id", "INC-ALERT")
        severity = incident.get("severity", "HIGH")
        room_id = incident.get("room_id", "ROOM-SERVER-A")
        summary = incident.get("summary", "Anomalous cyber-physical telemetry detected.")
        confidence = int(incident.get("confidence", 0.92) * 100)
        source = trigger_event.get("source_device_id", "PERIMETER-GATE") if trigger_event else "PERIMETER-GATE"
        ev_type = trigger_event.get("event_type", "ANOMALY") if trigger_event else "ANOMALY"

        msg = (
            f"🚨 <b>[SENTINEL-X] CYBER-PHYSICAL INCIDENT DETECTED</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🎯 <b>Incident:</b> {title}\n"
            f"🆔 <b>Tracking ID:</b> <code>{inc_id}</code>\n"
            f"📍 <b>Facility / Room:</b> <code>{room_id}</code>\n"
            f"⚡ <b>Trigger Event:</b> <code>{ev_type}</code> ({source})\n"
            f"⚠️ <b>Severity:</b> <b>{severity}</b>\n"
            f"📊 <b>Confidence Score:</b> {confidence}%\n"
            f"📝 <b>Analysis:</b> {summary}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🛡️ <i>Autonomous SOC Detection Pipeline Active</i>"
        )
        return await cls.send_message(msg)

    @classmethod
    async def notify_quarantine(cls, device_id: str, reason: str, user_email: Optional[str] = None):
        msg = (
            f"🛡️ <b>[SENTINEL-X] SOAR QUARANTINE EXECUTED</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📟 <b>Compromised Device:</b> <code>{device_id}</code>\n"
            f"🔒 <b>Action Taken:</b> ISOLATED / QUARANTINED\n"
            f"📋 <b>Policy Violation:</b> {reason}\n"
            f"👤 <b>Triggered By:</b> {user_email or 'Autonomous Trust Degradation SOAR'}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"⚠️ <i>Hardware telemetry isolated from network to prevent lateral compromise.</i>"
        )
        return await cls.send_message(msg)

    @classmethod
    async def notify_trust_drop(cls, sensor_id: str, old_score: float, new_score: float, reason: str):
        msg = (
            f"📉 <b>[SENTINEL-X] SENSOR TRUST DEGRADATION</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📡 <b>Sensor ID:</b> <code>{sensor_id}</code>\n"
            f"⚠️ <b>Trust Level:</b> {old_score:.1f}% ➔ <b>{new_score:.1f}%</b> (UNTRUSTED)\n"
            f"🔍 <b>Anomaly:</b> {reason}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🛡️ <i>Telemetry marked untrusted; cross-validation fallback engaged.</i>"
        )
        return await cls.send_message(msg)

    @classmethod
    async def notify_test(cls):
        msg = (
            f"🔔 <b>[SENTINEL-X] TELEGRAM INTEGRATION VERIFIED</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"✅ <b>Status:</b> Live & Connected\n"
            f"🤖 <b>Bot:</b> Sentinel-X (@VIsahhal_bot)\n"
            f"📱 <b>Channel:</b> Direct Operator Dispatch\n"
            f"🛡️ <b>System:</b> Cyber-Physical SOC Monitoring\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"<i>You will receive real-time alerts whenever critical cyber-physical incidents, sensor anomalies, or SOAR quarantines execute!</i>"
        )
        return await cls.send_message(msg)

