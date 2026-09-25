from typing import Dict, Any, List

TEST_1_AUTHORIZED = {
    "id": "TEST-01-AUTHORIZED",
    "name": "TEST 1: Authorized RFID + Authorized Iris",
    "description": "Multi-factor authentication: Authorized RFID presented followed by matching Iris biometric verification. Access granted, door unlocked and opened, no alarms.",
    "expected_result": "RFID VERIFIED IRIS VERIFIED ACCESS GRANTED DOOR UNLOCK DOOR OPEN",
    "steps": [
        {
            "step": 1,
            "phase": "RFID_VERIFIED",
            "delay_sec": 1.5,
            "event_type": "RFID_VERIFIED",
            "source_device_id": "RFID-GATE-01",
            "sensor_id": "SENSOR-RFID-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "INFO",
            "metadata": {
                "badge_id": "AUTH_BADGE_004",
                "registered_user": "Dr. V. Solanki",
                "department": "Infrastructure Security",
                "reader_freq": "13.56MHz",
                "status": "VERIFIED",
                "simulated": True
            },
            "description": "Step 1: Authorized RFID badge scanned for Dr. V. Solanki",
            "threat_level": "NORMAL"
        },
        {
            "step": 2,
            "phase": "IRIS_VERIFIED",
            "delay_sec": 1.8,
            "event_type": "IRIS_VERIFIED",
            "source_device_id": "IRIS-SCANNER-01",
            "sensor_id": "SENSOR-IRIS-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "INFO",
            "metadata": {
                "iris_match": True,
                "subject": "Dr. V. Solanki",
                "biometric_score": 0.992,
                "status": "VERIFIED",
                "simulated": True
            },
            "description": "Step 2: Biometric Iris scan verified. Identity matched with presented credential.",
            "threat_level": "NORMAL"
        },
        {
            "step": 3,
            "phase": "ACCESS_GRANTED",
            "delay_sec": 1.0,
            "event_type": "ACCESS_GRANTED",
            "source_device_id": "GATEWAY-A-01",
            "sensor_id": "SENSOR-NET-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "INFO",
            "metadata": {
                "auth_method": "MULTI_FACTOR_RFID_IRIS",
                "status": "GRANTED",
                "subject": "Dr. V. Solanki",
                "door": "UNLOCKED",
                "alarm": "OFF",
                "simulated": True
            },
            "description": "Step 3: Multi-factor authentication succeeded. Access Granted.",
            "threat_level": "NORMAL"
        },
        {
            "step": 4,
            "phase": "DOOR_OPEN",
            "delay_sec": 1.2,
            "event_type": "DOOR_STATE",
            "source_device_id": "DOOR-A-01",
            "sensor_id": "SENSOR-DOOR-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "INFO",
            "metadata": {
                "state": "UNLOCKED_AND_OPEN",
                "door_angle": 85,
                "alarm": "OFF",
                "authorized_by": "Dr. V. Solanki",
                "simulated": True
            },
            "description": "Step 4: Perimeter door unlocked and opened. Personnel entry allowed.",
            "threat_level": "NORMAL"
        }
    ]
}

TEST_2_CLONED_RFID = {
    "id": "TEST-02-CLONED",
    "name": "TEST 2: Cloned RFID Attack",
    "description": "Perimeter breach attempt with cloned badge. Cloned signature detected, access denied, door locked, alarm & sirens activated.",
    "expected_result": "CLONED RFID ACCESS DENIED DOOR LOCKED ALARM ON",
    "steps": [
        {
            "step": 1,
            "phase": "CLONED_RFID",
            "delay_sec": 1.5,
            "event_type": "CLONED_RFID",
            "source_device_id": "RFID-GATE-01",
            "sensor_id": "SENSOR-RFID-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "HIGH",
            "metadata": {
                "badge_id": "CLONED_UID_E20045A1",
                "cloned": True,
                "status": "CLONED_DETECTED",
                "reader_freq": "13.56MHz",
                "tag_type": "Mifare Classic 1K (Cloned Signature)",
                "simulated": True
            },
            "description": "Step 1: Cloned RFID credential presented at reader",
            "threat_level": "ELEVATED"
        },
        {
            "step": 2,
            "phase": "ACCESS_DENIED_CLONED",
            "delay_sec": 1.5,
            "event_type": "ACCESS_DENIED_CLONED",
            "source_device_id": "GATEWAY-A-01",
            "sensor_id": "SENSOR-NET-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "HIGH",
            "metadata": {
                "reason": "CLONED RFID DETECTED",
                "access": "DENIED",
                "door": "LOCKED",
                "badge_id": "CLONED_UID_E20045A1",
                "simulated": True
            },
            "description": "Step 2: Access Denied! Cloned RFID credential identified.",
            "threat_level": "HIGH"
        },
        {
            "step": 3,
            "phase": "DOOR_LOCKED",
            "delay_sec": 1.0,
            "event_type": "DOOR_STATE",
            "source_device_id": "DOOR-A-01",
            "sensor_id": "SENSOR-DOOR-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "HIGH",
            "metadata": {
                "state": "LOCKED",
                "door_angle": 0,
                "locked": True,
                "forced": False,
                "simulated": True
            },
            "description": "Step 3: Perimeter door remains magnetically LOCKED. Physical access denied.",
            "threat_level": "HIGH"
        },
        {
            "step": 4,
            "phase": "ALARM_ON",
            "delay_sec": 1.2,
            "event_type": "ALARM_STATE",
            "source_device_id": "ALARM-SIREN-01",
            "sensor_id": "SENSOR-ALARM-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "HIGH",
            "metadata": {
                "siren": "ON",
                "strobe": "ACTIVE",
                "interior_siren": "ACTIVE",
                "exterior_siren": "ACTIVE",
                "alarm_type": "CLONED_RFID",
                "simulated": True
            },
            "description": "Step 4: Perimeter sirens and strobes activated (Interior + Exterior). Incident dispatched.",
            "threat_level": "CRITICAL"
        }
    ]
}

TEST_3_STOLEN_RFID = {
    "id": "TEST-03-STOLEN",
    "name": "TEST 3: Valid RFID + Wrong Iris (Stolen Credential)",
    "description": "Valid RFID badge scanned, but presented human iris fails biometric verification. Possible stolen credential detected! Access denied, door locked, alarm & sirens activated.",
    "expected_result": "RFID VERIFIED IRIS MISMATCH ACCESS DENIED DOOR LOCKED ALARM ON",
    "steps": [
        {
            "step": 1,
            "phase": "RFID_VERIFIED",
            "delay_sec": 1.5,
            "event_type": "RFID_VERIFIED",
            "source_device_id": "RFID-GATE-01",
            "sensor_id": "SENSOR-RFID-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "INFO",
            "metadata": {
                "badge_id": "AUTH_BADGE_004",
                "registered_user": "Dr. V. Solanki",
                "status": "VERIFIED",
                "simulated": True
            },
            "description": "Step 1: Valid RFID badge presented (Registered to: Dr. V. Solanki)",
            "threat_level": "NORMAL"
        },
        {
            "step": 2,
            "phase": "IRIS_MISMATCH",
            "delay_sec": 2.0,
            "event_type": "IRIS_MISMATCH",
            "source_device_id": "IRIS-SCANNER-01",
            "sensor_id": "SENSOR-IRIS-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "CRITICAL",
            "metadata": {
                "iris_match": False,
                "subject": "UNKNOWN_INTRUDER",
                "expected_user": "Dr. V. Solanki",
                "confidence": 0.12,
                "status": "MISMATCH",
                "deduction": "Possible stolen credential",
                "simulated": True
            },
            "description": "Step 2: Biometric Iris Mismatch! Presented ocular scan does not match credential owner Dr. V. Solanki.",
            "threat_level": "CRITICAL"
        },
        {
            "step": 3,
            "phase": "ACCESS_DENIED_MISMATCH",
            "delay_sec": 1.2,
            "event_type": "ACCESS_DENIED_MISMATCH",
            "source_device_id": "GATEWAY-A-01",
            "sensor_id": "SENSOR-NET-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "CRITICAL",
            "metadata": {
                "reason": "Possible stolen credential",
                "access": "DENIED",
                "door": "LOCKED",
                "credential_id": "AUTH_BADGE_004",
                "simulated": True
            },
            "description": "Step 3: Access Denied! Possible stolen credential detected.",
            "threat_level": "CRITICAL"
        },
        {
            "step": 4,
            "phase": "DOOR_LOCKED",
            "delay_sec": 1.0,
            "event_type": "DOOR_STATE",
            "source_device_id": "DOOR-A-01",
            "sensor_id": "SENSOR-DOOR-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "CRITICAL",
            "metadata": {
                "state": "LOCKED",
                "door_angle": 0,
                "locked": True,
                "simulated": True
            },
            "description": "Step 4: Perimeter door remains magnetically LOCKED. Physical intrusion stopped.",
            "threat_level": "CRITICAL"
        },
        {
            "step": 5,
            "phase": "ALARM_ON",
            "delay_sec": 1.2,
            "event_type": "ALARM_STATE",
            "source_device_id": "ALARM-SIREN-01",
            "sensor_id": "SENSOR-ALARM-A-01",
            "room_id": "ROOM-SERVER-A",
            "severity": "CRITICAL",
            "metadata": {
                "siren": "ON",
                "strobe": "ACTIVE",
                "interior_siren": "ACTIVE",
                "exterior_siren": "ACTIVE",
                "alarm_type": "POSSIBLE_STOLEN_CREDENTIAL",
                "simulated": True
            },
            "description": "Step 5: Perimeter sirens and strobes activated (Interior + Exterior). Physical security alert dispatched.",
            "threat_level": "CRITICAL"
        }
    ]
}

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "TEST_1_AUTHORIZED": TEST_1_AUTHORIZED,
    "TEST_2_CLONED_RFID": TEST_2_CLONED_RFID,
    "TEST_3_STOLEN_RFID": TEST_3_STOLEN_RFID,
    "TEST_1": TEST_1_AUTHORIZED,
    "TEST_2": TEST_2_CLONED_RFID,
    "TEST_3": TEST_3_STOLEN_RFID,
    "AUTHORIZED_ACCESS": TEST_1_AUTHORIZED,
    "CLONED_RFID": TEST_2_CLONED_RFID,
    "STOLEN_RFID": TEST_3_STOLEN_RFID,
    "HARDWARE_CYBER_BREACH": TEST_3_STOLEN_RFID,
    "COORDINATED_INTRUSION": TEST_2_CLONED_RFID,
    "UNAUTHORIZED_RFID": TEST_2_CLONED_RFID
}
