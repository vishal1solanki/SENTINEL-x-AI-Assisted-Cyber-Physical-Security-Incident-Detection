from typing import Dict, Any
from datetime import datetime

class ReportService:
    """
    Generates structured print-ready HTML and JSON incident reports.
    """

    @classmethod
    def generate_html_report(cls, report_data: Dict[str, Any]) -> str:
        inc = report_data.get("incident", {})
        events = report_data.get("events", [])
        ai = inc.get("ai_analysis", {}) or {}
        sensors = report_data.get("sensors", [])
        blind_spots = report_data.get("blind_spots", [])
        actions = report_data.get("response_actions", [])

        timeline_html = "".join([
            f"""
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #2d3748; font-family: monospace; color: #a0aec0;">{e.get('timestamp', '')}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #2d3748; font-weight: bold; color: #63b3ed;">{e.get('event_type', '')}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #2d3748; color: #cbd5e0;">{e.get('source_device_id', '')}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #2d3748;">
                    <span style="padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: {'#e53e3e' if e.get('severity') in ('CRITICAL', 'HIGH') else '#dd6b20' if e.get('severity') == 'MEDIUM' else '#319795'}; color: white;">
                        {e.get('severity', 'INFO')}
                    </span>
                </td>
            </tr>
            """ for e in events
        ])

        evidence_html = "".join([
            f"<li style='margin-bottom: 6px; color: #e2e8f0;'>{item}</li>"
            for item in ai.get("evidence", ["Multi-sensor sequential telemetry correlation."])
        ])

        sensor_concerns_html = "".join([
            f"<li style='margin-bottom: 6px; color: #feb2b2;'>{item}</li>"
            for item in ai.get("sensor_concerns", ["All primary sensors functioning within baseline parameters."])
        ])

        actions_html = "".join([
            f"""
            <div style="background: #1a202c; border: 1px solid #4a5568; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; color: #e2e8f0;">
                    <span>Action: {a.get('action_type')}</span>
                    <span style="color: #68d391;">{a.get('status')}</span>
                </div>
                <div style="color: #a0aec0; font-size: 13px; margin-top: 4px;">Target Device: {a.get('device_id')} | Reason: {a.get('reason')}</div>
                <div style="color: #718096; font-size: 11px; margin-top: 4px;">Executed at: {a.get('timestamp')}</div>
            </div>
            """ for a in actions
        ]) or "<p style='color: #a0aec0;'>No automated response actions executed yet.</p>"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SENTINEL-X Incident Report - {inc.get('id', 'INC-UNKNOWN')}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d1117;
            color: #c9d1d9;
            margin: 0;
            padding: 40px;
            line-height: 1.5;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }}
        .header {{
            border-bottom: 2px solid #30363d;
            padding-bottom: 20px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-critical {{ background: #da3633; color: white; }}
        .badge-high {{ background: #d29922; color: black; }}
        .badge-medium {{ background: #1f6feb; color: white; }}
        .section {{
            margin-bottom: 28px;
        }}
        h2 {{
            color: #58a6ff;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #21262d;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }}
        th {{
            text-align: left;
            padding: 8px 12px;
            background: #21262d;
            color: #8b949e;
            font-size: 11px;
            text-transform: uppercase;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }}
        .card {{
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 16px;
        }}
        @media print {{
            body {{ background: white; color: black; padding: 0; }}
            .container {{ border: none; box-shadow: none; width: 100%; max-width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="margin: 0; font-size: 24px; color: #f0f6fc;">SENTINEL-X INCIDENT REPORT</h1>
                <p style="margin: 4px 0 0 0; color: #8b949e; font-size: 13px;">AI-Assisted Cyber-Physical Security Incident & Sensor Trust Audit</p>
            </div>
            <div style="text-align: right;">
                <span class="badge badge-critical">{inc.get('severity', 'HIGH')}</span>
                <div style="color: #8b949e; font-size: 12px; margin-top: 6px;">ID: {inc.get('id')}</div>
            </div>
        </div>

        <div class="section">
            <h2>Incident Overview</h2>
            <div class="grid">
                <div class="card">
                    <div style="color: #8b949e; font-size: 12px;">Title</div>
                    <div style="font-size: 15px; font-weight: 600; color: #f0f6fc; margin-top: 2px;">{inc.get('title')}</div>
                    
                    <div style="color: #8b949e; font-size: 12px; margin-top: 10px;">Perimeter Room</div>
                    <div style="color: #f0f6fc;">{inc.get('room_id')}</div>

                    <div style="color: #8b949e; font-size: 12px; margin-top: 10px;">Detection Time</div>
                    <div style="color: #f0f6fc;">{inc.get('started_at')}</div>
                </div>
                <div class="card">
                    <div style="color: #8b949e; font-size: 12px;">Assessed Risk Level</div>
                    <div style="font-size: 15px; font-weight: 600; color: #f85149; margin-top: 2px;">{inc.get('risk_level')}</div>

                    <div style="color: #8b949e; font-size: 12px; margin-top: 10px;">Correlation Confidence</div>
                    <div style="color: #f0f6fc;">{(inc.get('confidence', 0.85)*100):.0f}%</div>

                    <div style="color: #8b949e; font-size: 12px; margin-top: 10px;">Lifecycle Status</div>
                    <div style="color: #f0f6fc; font-weight: bold;">{inc.get('status')}</div>
                </div>
            </div>
            <div class="card" style="margin-top: 12px;">
                <div style="color: #8b949e; font-size: 12px;">Executive Summary</div>
                <div style="color: #e6edf3; margin-top: 4px;">{inc.get('summary')}</div>
            </div>
        </div>

        <div class="section">
            <h2>AI Investigator Findings & Telemetry Trust Assessment</h2>
            <div class="card">
                <div style="font-weight: 600; color: #58a6ff; margin-bottom: 8px;">Key Corroborating Evidence:</div>
                <ul style="margin: 0; padding-left: 20px;">
                    {evidence_html}
                </ul>

                <div style="font-weight: 600; color: #f85149; margin-top: 16px; margin-bottom: 8px;">Sensor Trust & Integrity Concerns:</div>
                <ul style="margin: 0; padding-left: 20px;">
                    {sensor_concerns_html}
                </ul>

                <div style="font-weight: 600; color: #7ee787; margin-top: 16px; margin-bottom: 4px;">Reasoning Synthesis:</div>
                <div style="color: #c9d1d9; font-size: 13px;">{ai.get('reasoning_summary', 'Coordinated cyber and physical signals analyzed.')}</div>
            </div>
        </div>

        <div class="section">
            <h2>Correlated Telemetry Event Timeline</h2>
            <div class="card" style="padding: 0; overflow: hidden;">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Event Type</th>
                            <th>Source Device</th>
                            <th>Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {timeline_html}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <h2>Adaptive Response & Simulated Quarantine Log</h2>
            {actions_html}
        </div>

        <div style="border-top: 1px solid #30363d; padding-top: 16px; font-size: 11px; color: #8b949e; display: flex; justify-content: space-between;">
            <span>SENTINEL-X Cyber-Physical Defense System</span>
            <span>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</span>
        </div>
    </div>
</body>
</html>"""
