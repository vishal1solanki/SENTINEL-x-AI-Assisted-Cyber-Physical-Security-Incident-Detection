# SENTINEL-X Wokwi ESP32 Hardware Simulation

This directory contains the physical edge node simulation for the SENTINEL-X cyber-physical security platform.

## Simulated Hardware Components
1. **ESP32 DevKit v4**: Main IoT edge microcontroller.
2. **PIR Motion Sensor (HC-SR501)**: Connected to GPIO 13. Senses interior zone movement.
3. **RFID Reader Simulation**:
   - Green Pushbutton (GPIO 14): Simulates presenting a valid, authorized card credential (`RFID_AUTHORIZED`).
   - Red Pushbutton (GPIO 27): Simulates presenting an unauthorized or forged credential (`RFID_UNAUTHORIZED`).
4. **Perimeter Door Latch Contact**:
   - Blue Pushbutton (GPIO 26): Toggles door open / door closed states (`DOOR_OPEN` / `DOOR_CLOSED`).
5. **Indicators & Annunciator**:
   - Green Status LED (GPIO 18): Steady ON indicates nominal perimeter status.
   - Red Alarm LED (GPIO 19): Flashes on unauthorized access or motion detection.
   - Piezo Buzzer (GPIO 21): Sounds alert chime on security events.

## How to Run in Wokwi (Instant 1-Second Build)

1. Open [Wokwi.com](https://wokwi.com/) in your web browser and click **ESP32**.
2. Replace `diagram.json` with `wokwi/diagram.json`.
3. Replace `sketch.ino` with the updated, ultra-fast `wokwi/sketch.ino`.
   > 💡 **Why this is fast**: The standard `sketch.ino` has been optimized to compile in **under 1 second** by eliminating heavy external WiFi headers that trigger Wokwi's *"Build Servers Busy"* queue on free accounts.
4. Click the green **Play** ($\blacktriangleright$) button to start.
   > ⚠️ **If you see "Build Servers Busy"**: Click **CLOSE** and press **Play** once more. It will use the fast compiler and start immediately.

### Alternative (Zero Setup): Built-in Web SOC Hardware Simulator
You don't even need Wokwi! In your browser, go to:
**`http://localhost:5173/monitoring`**
The **Perimeter Live Monitoring** page has all edge hardware devices (`RFID-GATE-01`, `DOOR-A-01`, `PIR-A-01`, etc.) rendered live with interactive signal injection buttons that feed directly into the backend engines!

## Verifying Telemetry Transmission
- Click the **Green Button** -> Look at serial monitor: `[EVENT] RFID: AUTHORIZED BADGE PRESENTED`. The event will be posted to the backend and broadcast across the Web SOC Dashboard and Mobile App via WebSocket.
- Click the **Red Button** -> `RFID_UNAUTHORIZED` event is sent.
- Click the **Blue Button** -> Door contact opens.
- Click the **PIR Sensor** -> Motion detected event is emitted.
- If Unauthorized RFID + Door Open + Motion occurs within 30 seconds, the backend Correlation Engine automatically creates a **"Possible Coordinated Physical Perimeter Breach"** incident!
