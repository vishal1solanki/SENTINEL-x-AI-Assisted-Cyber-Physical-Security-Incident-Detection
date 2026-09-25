# SENTINEL-X Mobile Incident Response App

React Native + Expo application built for on-the-go SOC analysts and field incident responders.

## Features
- **Field Command Dashboard**: View live perimeter status, critical active incidents, and average sensor trust score.
- **Incident Alerts & Triage**: Inspect correlated incident dossiers, view timeline, and trigger the AI Investigator.
- **Sensor Trust Matrix**: Audit live sensor scores and identify degraded or compromised hardware.
- **Simulated Device Quarantine & Restoration**: Isolate compromised nodes or restore recovered sensors directly from the mobile app.
- **One-Tap Demo Controls**: Trigger the 13-step Enterprise Security Demonstration Scenario and reset baseline with a single button.

## Setup & Running Locally

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Expo Development Server
```bash
# In Windows PowerShell:
npx.cmd expo start
# OR:
npm start

# In Git Bash / Command Prompt / Linux / macOS:
npx expo start
```

### 3. Open on Device or Emulator
- **Physical Device**: Install the **Expo Go** app on iOS or Android, then scan the QR code displayed in your terminal.
- **Web Browser**: Press `w` in the terminal to launch the web preview.
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator**: Press `i` in the terminal.

### 4. Configure Backend URL
In the app, navigate to the **CONFIG** tab to set your backend IP address (e.g. `http://192.168.1.X:8000` for physical devices on the same Wi-Fi, or `http://localhost:8000` for web/emulators).
