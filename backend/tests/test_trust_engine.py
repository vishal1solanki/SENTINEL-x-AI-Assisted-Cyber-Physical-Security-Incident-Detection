from app.engines.trust_engine import TrustEngine
from app.models.models import Sensor, SensorTrustHistory

def test_trust_engine_deduction_and_recovery(db_session):
    sensor = db_session.query(Sensor).filter(Sensor.id == "SENSOR-PIR-A-01").first()
    assert sensor is not None
    initial_score = sensor.trust_score

    # Apply deduction
    TrustEngine.apply_deduction("SENSOR-PIR-A-01", 20.0, "Test Telemetry Anomaly", db_session)
    db_session.refresh(sensor)
    assert sensor.trust_score == initial_score - 20.0

    # Verify history recorded
    history = db_session.query(SensorTrustHistory).filter(SensorTrustHistory.sensor_id == "SENSOR-PIR-A-01").order_by(SensorTrustHistory.timestamp.desc()).first()
    assert history is not None
    assert history.reason == "Test Telemetry Anomaly"
    assert history.new_score == initial_score - 20.0

    # Apply recovery
    TrustEngine.apply_recovery("SENSOR-PIR-A-01", 5.0, "Test Normal Behavior", db_session)
    db_session.refresh(sensor)
    assert sensor.trust_score == initial_score - 15.0
