# SENTINEL-X Database & Seeding

The platform utilizes SQLAlchemy 2.0 ORM with SQLite for out-of-the-box local operation, while maintaining full PostgreSQL compatibility.

## Entity Relational Model (12 Entities)
1. **User**: `id`, `name`, `email`, `password_hash`, `role` (`ADMIN`, `SOC_ANALYST`, `VIEWER`), `created_at`
2. **Room**: `id`, `name`, `description`, `security_level`, `created_at`
3. **Device**: `id`, `name`, `device_type`, `room_id`, `status`, `trust_score`, `last_seen`, `firmware_version`, `created_at`
4. **Sensor**: `id`, `device_id`, `sensor_type`, `status`, `trust_score`, `last_event`, `created_at`
5. **Event**: `id`, `timestamp`, `event_type`, `source_device_id`, `sensor_id`, `room_id`, `severity`, `status`, `metadata_json`, `correlation_id`, `trust_impact`
6. **Incident**: `id`, `title`, `incident_type`, `severity`, `risk_level`, `status`, `room_id`, `started_at`, `resolved_at`, `summary`, `ai_analysis`, `confidence`
7. **IncidentEvent**: `id`, `incident_id`, `event_id`
8. **SensorTrustHistory**: `id`, `sensor_id`, `old_score`, `new_score`, `reason`, `timestamp`
9. **BlindSpot**: `id`, `room_id`, `category`, `severity`, `description`, `detected_at`, `resolved_at`, `status`
10. **ResponseAction**: `id`, `incident_id`, `device_id`, `action_type`, `status`, `reason`, `timestamp`
11. **AttackScenario**: `id`, `name`, `description`, `events`, `created_at`
12. **AuditLog**: `id`, `user_id`, `action`, `target_type`, `target_id`, `details`, `timestamp`

## Running Seeding Script Manually
```bash
python database/seed.py
```

## Demo User Credentials
- **Admin**: `admin@sentinel.local` / `Admin@SentinelX2026!`
- **SOC Analyst**: `analyst@sentinel.local` / `Analyst@SentinelX2026!`
- **Viewer**: `viewer@sentinel.local` / `Viewer@SentinelX2026!`
