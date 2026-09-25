from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from ..database.session import get_db
from ..models.models import User
from ..schemas.schemas import AttackSimulationRequest
from ..simulator.scenario_runner import ScenarioRunner
from ..simulator.scenarios import SCENARIOS, TEST_1_AUTHORIZED, TEST_2_CLONED_RFID, TEST_3_STOLEN_RFID
from ..services.security import get_current_user, require_role, log_audit_action

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])

@router.get("/scenarios")
def list_scenarios():
    return {
        "TEST_1_AUTHORIZED": TEST_1_AUTHORIZED,
        "TEST_2_CLONED_RFID": TEST_2_CLONED_RFID,
        "TEST_3_STOLEN_RFID": TEST_3_STOLEN_RFID
    }

@router.post("/test/{test_id}")
async def run_test_flow_endpoint(
    test_id: str,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Executes one of the 3 core security test flows:
    - 1: TEST 1 (Authorized RFID + Authorized Iris)
    - 2: TEST 2 (Cloned RFID)
    - 3: TEST 3 (Valid RFID + Wrong Iris / Stolen Credential)
    """
    try:
        result = await ScenarioRunner.run_test_flow(test_id, db)
        log_audit_action(
            db=db,
            action="RUN_TEST_FLOW",
            target_type="TEST_FLOW",
            target_id=test_id,
            details={"test_name": result.get("name")},
            user_id=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test flow execution failed: {e}")

@router.post("/attack")
async def trigger_attack(
    request: AttackSimulationRequest,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    try:
        results = await ScenarioRunner.trigger_scenario(
            scenario_key=request.scenario_type,
            room_id=request.room_id or "ROOM-SERVER-A",
            speed=request.speed or 1.0,
            db=db
        )
        log_audit_action(
            db=db,
            action="TRIGGER_SIMULATED_ATTACK",
            target_type="SCENARIO",
            target_id=request.scenario_type,
            details={"room_id": request.room_id, "speed": request.speed},
            user_id=current_user.id
        )
        return {
            "status": "SUCCESS",
            "scenario": request.scenario_type,
            "steps_executed": len(results)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/replay")
async def replay_step(
    step_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    try:
        result = await ScenarioRunner.run_scenario_step(step_data, db)
        return {
            "status": "SUCCESS",
            "message": "Replay step executed successfully",
            "incident_id": result.get("incident").id if result.get("incident") else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Replay step execution failed: {e}")

@router.post("/demo")
async def load_demo(
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    result = await ScenarioRunner.load_full_scenario(db)
    log_audit_action(
        db=db,
        action="LOAD_ATTACK_SCENARIO",
        target_type="DEMO",
        target_id="TEST_3_STOLEN_RFID",
        details={},
        user_id=current_user.id
    )
    return result

@router.post("/phase/{phase_id}")
async def trigger_phase(
    phase_id: str,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    # Find matching step across scenarios
    matched_step = None
    all_steps = TEST_1_AUTHORIZED["steps"] + TEST_2_CLONED_RFID["steps"] + TEST_3_STOLEN_RFID["steps"]
    for s in all_steps:
        if str(s.get("step")) == str(phase_id) or s.get("phase", "").upper() == phase_id.upper() or s.get("event_type", "").upper() == phase_id.upper():
            matched_step = s
            break

    if not matched_step:
        raise HTTPException(status_code=404, detail=f"Phase '{phase_id}' not found")

    result = await ScenarioRunner.run_scenario_step(matched_step, db)
    log_audit_action(
        db=db,
        action="TRIGGER_ATTACK_PHASE",
        target_type="PHASE",
        target_id=phase_id,
        details={"step": matched_step.get("step"), "phase": matched_step.get("phase")},
        user_id=current_user.id
    )
    return {
        "status": "SUCCESS",
        "phase": matched_step.get("phase"),
        "step": matched_step.get("step"),
        "description": matched_step.get("description"),
        "event_type": matched_step.get("event_type"),
        "incident_id": result.get("incident").id if result.get("incident") else None
    }

@router.post("/reset")
async def reset_demo(
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    result = await ScenarioRunner.reset_demo(db)
    log_audit_action(
        db=db,
        action="RESET_DEMO",
        target_type="DEMO",
        target_id="ALL",
        details={},
        user_id=current_user.id
    )
    return result
