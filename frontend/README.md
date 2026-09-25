# SENTINEL-X Web SOC Dashboard

Professional Security Operations Center (SOC) web application built with React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, and Recharts.

## Key Features
- **Real-Time Telemetry Stream**: WebSocket event bus providing sub-second updates without manual page refreshes.
- **Incident Investigation Dossier**: Interactive graph tracking sequential attack telemetry (RFID -> Door -> Motion -> Cyber).
- **Sensor Trust Breakdown**: Live visualization of sensor reliability (0-100%) and transparent deduction audit logs.
- **Security Blind Spot Analysis**: 4-pillar coverage breakdown per perimeter room.
- **Attack Simulator & Replay**: Step-by-step playback with speed controls (1x, 2x) and instant cybersecurity demonstration scenario loading.
- **Simulated Quarantine Controls**: Software isolation of suspect nodes with automated fallback activation and restoration.
- **Printable Incident Reports**: Forensic reporting with timeline, sensor trust delta, and AI analysis.

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Production Build
```bash
npm run build
```
The optimized production bundle will be generated in `dist/`.
