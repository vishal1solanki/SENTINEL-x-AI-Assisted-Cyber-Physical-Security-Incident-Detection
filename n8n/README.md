# SENTINEL-X n8n Automation & Orchestration

This directory contains the importable n8n automation workflow for SENTINEL-X.

## Workflow Overview
1. **Webhook Ingestion**: Receives physical security events from IoT gateways or edge hardware on `/webhook/sentinel-event`.
2. **Validate & Normalize Telemetry**: Checks required fields, normalizes payload structure, and adds UTC timestamp.
3. **Forward Event to Backend API**: Posts normalized event to `POST /api/events`.
4. **IF Suspicious Severity**: Filters for `HIGH` or `CRITICAL` severity events.
5. **Query Sensor Trust Engine**: Queries `GET /api/trust` to evaluate reliability of attached perimeter sensors.
6. **Synthesize Security Advisory**: Formulates structured advisory and determines if sensor telemetry inconsistency warrants isolation.
7. **Trigger Simulated Quarantine**: Automatically triggers safe simulated device quarantine via `POST /api/responses/simulate`.
8. **Send Telegram Mobile Alert**: Automatically dispatches rich HTML alerts to your Telegram Bot on mobile with the threat summary, affected room, sensor trust score, and executed countermeasure.

## How to Add Your Own Telegram Bot (Mobile Alerts)

### Step 1: Create a Telegram Bot via BotFather
1. Open the Telegram app on your phone or desktop.
2. Search for `@BotFather` (verified blue checkmark).
3. Send the command:
   ```text
   /newbot
   ```
4. Enter a friendly display name (e.g. `Sentinel-X SOC Alert Bot`).
5. Enter a unique username ending in `bot` (e.g. `sentinel_x_cybersecurity demonstration_alert_bot`).
6. BotFather will reply with your **HTTP API Token**, which looks like:
   ```text
   7182938495:AAHxyz_Abc12345Def67890GhI
   ```
   > ⚠️ **Keep this token safe!** Do not share it publicly.

### Step 2: Get Your Telegram Chat ID
You need to know where the bot should deliver messages (your personal chat or a group chat):

#### Method A: Using `@userinfobot` (Fastest)
1. In Telegram, search for `@userinfobot`.
2. Click **Start** or send `/start`.
3. It immediately replies with your numeric **Id** (e.g. `987654321`). This is your `TELEGRAM_CHAT_ID`.

#### Method B: Browser / API Method
1. Open your newly created bot in Telegram and click **Start** (or send `/start`).
2. Open this URL in your web browser (substitute your real bot token):
   ```text
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Look for `"chat":{"id":987654321,...}` in the JSON response.

---

### Step 3: Configure Your Credentials

You have two simple ways to connect your bot:

#### Option 1: Via Environment Variables (Recommended)
Edit `sentinel-x/.env`:
```env
TELEGRAM_BOT_TOKEN=7182938495:AAHxyz_Abc12345Def67890GhI
TELEGRAM_CHAT_ID=987654321
```
Then restart the n8n container or Docker Compose:
```bash
docker compose up -d --build n8n
```
The workflow will automatically pull `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from the environment.

#### Option 2: Directly inside n8n UI
1. Open `http://localhost:5678` in your browser.
2. Open the imported **SENTINEL-X Cyber-Physical Security Orchestration Pipeline** workflow.
3. Double-click the **Send Telegram Mobile Alert** node.
4. Replace `YOUR_TELEGRAM_BOT_TOKEN` in the URL:
   ```text
   https://api.telegram.org/bot7182938495:AAHxyz_Abc12345Def67890GhI/sendMessage
   ```
5. In the **Body Parameters**, change `chat_id` to your numeric ID:
   ```json
   "chat_id": "987654321"
   ```
6. Click **Save** in the top right.

---

## How to Import into n8n

### Option A: Using Docker (Recommended)
1. Start the n8n container included in `docker-compose.yml`:
   ```bash
   docker compose up -d n8n
   ```
2. Open your web browser to `http://localhost:5678`.
3. In the left navigation menu, click **Workflows** -> **Import from File...** (or click the three dots `...` in the top right and select **Import from File**).
4. Select `sentinel-x/n8n/sentinel-x-workflow.json`.
5. Click **Activate Workflow** in the top-right corner.

### Option B: Testing the Telegram Notification & Webhook
You can test the entire pipeline (including the Telegram alert to your phone) by sending a simulated high-severity security event:

```bash
curl -X POST http://localhost:5678/webhook/sentinel-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "RFID_UNAUTHORIZED",
    "source_device_id": "RFID-GATE-01",
    "room_id": "ROOM-SERVER-A",
    "severity": "HIGH",
    "metadata": {"simulated": true, "notes": "Unauthorized badge scan after hours"}
  }'
```

Within 1-2 seconds, your phone will receive a Telegram message:
```text
🚨 [SENTINEL-X] CYBER-PHYSICAL SECURITY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Threat: CRITICAL TELEMETRY ALERT: RFID_UNAUTHORIZED
📍 Location: ROOM-SERVER-A
📟 Device: RFID-GATE-01
⚠️ Severity: CRITICAL
📉 Sensor Trust: 85%
🛡️ Automated Action: SIMULATED_QUARANTINE_ISOLATION
⏱️ Time: 2026-09-21T10:15:00.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sent automatically via SENTINEL-X n8n SOAR Pipeline
```

---

### Step 4: Quick Bot Sanity Test (Optional)
Before running through n8n, you can verify your bot token and chat ID directly via terminal/PowerShell:

**cURL / bash:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -d "chat_id=<YOUR_CHAT_ID>" \
  -d "text=🔔 Sentinel-X Bot Verification Successful!"
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" -Method Post -Body @{
    chat_id = "<YOUR_CHAT_ID>"
    text = "🔔 Sentinel-X Bot Verification Successful!"
}
```
