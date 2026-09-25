def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_system_status(client):
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "ONLINE"
    assert data["database"] == "ONLINE"

def test_auth_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@sentinel.local", "password": "Admin@SentinelX2026!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"

def test_device_quarantine_and_restore(client):
    # In demo mode, auth defaults to demo analyst if token omitted or token can be provided
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "analyst@sentinel.local", "password": "Analyst@SentinelX2026!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Quarantine PIR-A-01
    q_resp = client.post(
        "/api/devices/PIR-A-01/quarantine",
        headers=headers,
        json={"reason": "Simulated tampering detected", "incident_id": None}
    )
    assert q_resp.status_code == 200
    assert q_resp.json()["device"]["status"] == "QUARANTINED"

    # Restore PIR-A-01
    r_resp = client.post(
        "/api/devices/PIR-A-01/restore",
        headers=headers,
        json={"reason": "Investigation concluded, restored baseline", "incident_id": None}
    )
    assert r_resp.status_code == 200
    assert r_resp.json()["device"]["status"] == "ONLINE"
