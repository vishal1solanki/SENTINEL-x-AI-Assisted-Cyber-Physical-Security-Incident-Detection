import pytest
from app.simulator.scenario_runner import ScenarioRunner
from app.models.models import Device, Sensor, Incident

@pytest.mark.asyncio
async def test_demo_load_and_reset(db_session):
    # Run 13-step security attack scenario
    res = await ScenarioRunner.load_full_scenario(db_session)
    assert res["status"] == "SUCCESS"
    assert res["steps_executed"] > 0

    # Verify incident was created
    incidents = db_session.query(Incident).all()
    assert len(incidents) > 0

    # Now reset demo
    reset_res = await ScenarioRunner.reset_demo(db_session)
    assert reset_res["status"] == "SUCCESS"

    # Verify devices are online and sensors trust reset to 100
    devices = db_session.query(Device).all()
    for d in devices:
        assert d.status == "ONLINE"
    sensors = db_session.query(Sensor).all()
    for s in sensors:
        assert s.trust_score == 100.0
