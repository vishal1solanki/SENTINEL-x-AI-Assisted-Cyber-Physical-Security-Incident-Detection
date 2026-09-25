/*
 * SENTINEL-X ESP32 Virtual Physical Security Controller
 * Multi-Factor Authentication: RFID + Iris Biometrics + Door + Dual Alarm Sirens
 * 
 * Supports Interactive Pushbuttons & Serial Commands:
 * - Type "test1": Authorized RFID + Authorized Iris -> DOOR UNLOCKED & OPEN
 * - Type "test2": Cloned RFID -> ACCESS DENIED, DOOR LOCKED, ALARM ON
 * - Type "test3": Valid RFID + Wrong Iris -> ACCESS DENIED (Possible stolen credential), DOOR LOCKED, ALARM ON
 */

#define PIN_PIR 13
#define PIN_BTN_RFID_AUTH 14
#define PIN_BTN_RFID_CLONED 27
#define PIN_BTN_IRIS_AUTH 25
#define PIN_BTN_IRIS_WRONG 33
#define PIN_LED_GREEN 18
#define PIN_LED_RED 19
#define PIN_BUZZER 21

bool rfidVerified = false;
bool alarmActive = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 20000;

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_BTN_RFID_AUTH, INPUT_PULLUP);
  pinMode(PIN_BTN_RFID_CLONED, INPUT_PULLUP);
  pinMode(PIN_BTN_IRIS_AUTH, INPUT_PULLUP);
  pinMode(PIN_BTN_IRIS_WRONG, INPUT_PULLUP);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println("\n==================================================");
  Serial.println("   SENTINEL-X CYBER-PHYSICAL ACCESS CONTROLLER    ");
  Serial.println("   Perimeter Node: SERVER ROOM A | Firm: v3.1.0   ");
  Serial.println("==================================================");
  Serial.println("Ready. Type 'test1', 'test2', or 'test3' in Serial,");
  Serial.println("or press physical buttons on the virtual board.\n");

  printTelemetry("SENSOR_HEARTBEAT", "GATEWAY-A-01", "SENSOR-NET-A-01", "INFO", "{\"status\":\"ONLINE\",\"room\":\"ROOM-SERVER-A\"}");
}

void loop() {
  // 1. Check Serial Commands
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toLowerCase();

    if (cmd == "test1" || cmd == "1") {
      runTest1();
    } else if (cmd == "test2" || cmd == "2") {
      runTest2();
    } else if (cmd == "test3" || cmd == "3") {
      runTest3();
    } else if (cmd == "reset") {
      resetSystem();
    }
  }

  // 2. Button 1: Authorized RFID Button (Active LOW)
  if (digitalRead(PIN_BTN_RFID_AUTH) == LOW) {
    rfidVerified = true;
    Serial.println("\n[RFID READER] Authorized Badge Scanned: Dr. V. Solanki");
    tone(PIN_BUZZER, 1600, 100);
    printTelemetry("RFID_VERIFIED", "RFID-GATE-01", "SENSOR-RFID-A-01", "INFO", "{\"badge_id\":\"AUTH_BADGE_004\",\"registered_user\":\"Dr. V. Solanki\",\"status\":\"VERIFIED\"}");
    delay(600);
  }

  // 3. Button 2: Cloned RFID Button (Active LOW)
  if (digitalRead(PIN_BTN_RFID_CLONED) == LOW) {
    runTest2();
    delay(600);
  }

  // 4. Button 3: Authorized Iris Button (Active LOW)
  if (digitalRead(PIN_BTN_IRIS_AUTH) == LOW) {
    if (rfidVerified) {
      runTest1();
    } else {
      Serial.println("\n[IRIS SCANNER] Iris presented but RFID not yet swiped. Presentation logged.");
      printTelemetry("IRIS_VERIFIED", "IRIS-SCANNER-01", "SENSOR-IRIS-A-01", "INFO", "{\"iris_match\":true,\"subject\":\"Dr. V. Solanki\",\"status\":\"VERIFIED\"}");
    }
    delay(600);
  }

  // 5. Button 4: Wrong Iris Button (Active LOW) -> Triggers Test 3
  if (digitalRead(PIN_BTN_IRIS_WRONG) == LOW) {
    runTest3();
    delay(600);
  }

  // 6. Periodic Heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    printTelemetry("SENSOR_HEARTBEAT", "GATEWAY-A-01", "SENSOR-NET-A-01", "INFO", "{\"uptime_ms\":millis()}");
  }

  delay(40);
}

// ==========================================
// TEST 1: Authorized RFID + Authorized Iris
// RFID VERIFIED IRIS VERIFIED ACCESS GRANTED DOOR UNLOCK DOOR OPEN
// ==========================================
void runTest1() {
  Serial.println("\n>>> INITIATING TEST 1: Authorized RFID + Authorized Iris <<<");
  digitalWrite(PIN_LED_RED, LOW);
  alarmActive = false;

  // Step 1: RFID Verified
  Serial.println("[STEP 1/4] RFID SCAN: Authorized Badge Presented (Dr. V. Solanki)");
  printTelemetry("RFID_VERIFIED", "RFID-GATE-01", "SENSOR-RFID-A-01", "INFO", "{\"badge_id\":\"AUTH_BADGE_004\",\"registered_user\":\"Dr. V. Solanki\",\"status\":\"VERIFIED\"}");
  tone(PIN_BUZZER, 1200, 80);
  delay(800);

  // Step 2: Iris Verified
  Serial.println("[STEP 2/4] IRIS SCAN: Biometric Match Confirmed (Dr. V. Solanki)");
  printTelemetry("IRIS_VERIFIED", "IRIS-SCANNER-01", "SENSOR-IRIS-A-01", "INFO", "{\"iris_match\":true,\"subject\":\"Dr. V. Solanki\",\"confidence\":0.99,\"status\":\"VERIFIED\"}");
  tone(PIN_BUZZER, 1500, 80);
  delay(600);

  // Step 3: Access Granted
  Serial.println("[STEP 3/4] ACCESS CONTROLLER: Multi-factor Verified -> ACCESS GRANTED");
  printTelemetry("ACCESS_GRANTED", "GATEWAY-A-01", "SENSOR-NET-A-01", "INFO", "{\"auth_method\":\"MULTI_FACTOR_RFID_IRIS\",\"subject\":\"Dr. V. Solanki\",\"status\":\"GRANTED\"}");
  digitalWrite(PIN_LED_GREEN, HIGH);
  delay(500);

  // Step 4: Door Unlock & Open
  Serial.println("[STEP 4/4] DOOR CONTROLLER: Solenoid Retracted -> DOOR UNLOCK DOOR OPEN");
  printTelemetry("DOOR_STATE", "DOOR-A-01", "SENSOR-DOOR-A-01", "INFO", "{\"state\":\"UNLOCKED_AND_OPEN\",\"door_angle\":85,\"alarm\":\"OFF\"}");
  tone(PIN_BUZZER, 1800, 200);

  Serial.println("\n==================================================");
  Serial.println("EXPECTED TEST 1 RESULT:");
  Serial.println("RFID VERIFIED IRIS VERIFIED ACCESS GRANTED DOOR UNLOCK DOOR OPEN");
  Serial.println("==================================================\n");

  rfidVerified = false;
  delay(3000);
  digitalWrite(PIN_LED_GREEN, LOW);
}

// ==========================================
// TEST 2: Cloned RFID
// CLONED RFID ACCESS DENIED DOOR LOCKED ALARM ON
// ==========================================
void runTest2() {
  Serial.println("\n>>> INITIATING TEST 2: Cloned RFID Attack Attempt <<<");
  digitalWrite(PIN_LED_GREEN, LOW);
  alarmActive = true;

  // Step 1: Cloned RFID
  Serial.println("[STEP 1/4] RFID SCAN: Cloned UID Presented (0xE20045A1) -> CLONED RFID");
  printTelemetry("CLONED_RFID", "RFID-GATE-01", "SENSOR-RFID-A-01", "HIGH", "{\"badge_id\":\"CLONED_UID_E20045A1\",\"cloned\":true,\"status\":\"CLONED_DETECTED\"}");
  delay(600);

  // Step 2: Access Denied
  Serial.println("[STEP 2/4] ACCESS CONTROLLER: Cloned Signature -> ACCESS DENIED");
  printTelemetry("ACCESS_DENIED_CLONED", "GATEWAY-A-01", "SENSOR-NET-A-01", "HIGH", "{\"reason\":\"CLONED RFID DETECTED\",\"access\":\"DENIED\",\"door\":\"LOCKED\"}");
  delay(400);

  // Step 3: Door Locked
  Serial.println("[STEP 3/4] DOOR CONTROLLER: High-Security Magnetic Seal -> DOOR LOCKED");
  printTelemetry("DOOR_STATE", "DOOR-A-01", "SENSOR-DOOR-A-01", "HIGH", "{\"state\":\"LOCKED\",\"door_angle\":0,\"locked\":true}");
  delay(400);

  // Step 4: Alarm On
  Serial.println("[STEP 4/4] ALARM SIREN: Dual Interior + Exterior Strobes -> ALARM ON");
  printTelemetry("ALARM_STATE", "ALARM-SIREN-01", "SENSOR-ALARM-A-01", "HIGH", "{\"siren\":\"ON\",\"strobe\":\"ACTIVE\",\"alarm_type\":\"CLONED_RFID\"}");

  Serial.println("\n==================================================");
  Serial.println("EXPECTED TEST 2 RESULT:");
  Serial.println("CLONED RFID ACCESS DENIED DOOR LOCKED ALARM ON");
  Serial.println("==================================================\n");

  soundAlarm(4);
}

// ==========================================
// TEST 3: Valid RFID + Wrong Iris
// RFID VERIFIED IRIS MISMATCH ACCESS DENIED DOOR LOCKED ALARM ON
// (Possible stolen credential)
// ==========================================
void runTest3() {
  Serial.println("\n>>> INITIATING TEST 3: Valid RFID + Wrong Iris (Possible Stolen Credential) <<<");
  digitalWrite(PIN_LED_GREEN, LOW);
  alarmActive = true;

  // Step 1: RFID Verified
  Serial.println("[STEP 1/5] RFID SCAN: Valid Badge Scanned -> RFID VERIFIED (Dr. V. Solanki)");
  printTelemetry("RFID_VERIFIED", "RFID-GATE-01", "SENSOR-RFID-A-01", "INFO", "{\"badge_id\":\"AUTH_BADGE_004\",\"registered_user\":\"Dr. V. Solanki\",\"status\":\"VERIFIED\"}");
  tone(PIN_BUZZER, 1200, 80);
  delay(800);

  // Step 2: Iris Mismatch
  Serial.println("[STEP 2/5] IRIS SCAN: Biometric Ocular Mismatch -> IRIS MISMATCH");
  printTelemetry("IRIS_MISMATCH", "IRIS-SCANNER-01", "SENSOR-IRIS-A-01", "CRITICAL", "{\"iris_match\":false,\"subject\":\"UNKNOWN_INTRUDER\",\"status\":\"MISMATCH\",\"deduction\":\"Possible stolen credential\"}");
  delay(600);

  // Step 3: Access Denied
  Serial.println("[STEP 3/5] ACCESS CONTROLLER: Possible Stolen Credential -> ACCESS DENIED");
  printTelemetry("ACCESS_DENIED_MISMATCH", "GATEWAY-A-01", "SENSOR-NET-A-01", "CRITICAL", "{\"reason\":\"Possible stolen credential\",\"access\":\"DENIED\",\"door\":\"LOCKED\"}");
  delay(400);

  // Step 4: Door Locked
  Serial.println("[STEP 4/5] DOOR CONTROLLER: Magnetic Interlock Engaged -> DOOR LOCKED");
  printTelemetry("DOOR_STATE", "DOOR-A-01", "SENSOR-DOOR-A-01", "CRITICAL", "{\"state\":\"LOCKED\",\"door_angle\":0,\"locked\":true}");
  delay(400);

  // Step 5: Alarm On
  Serial.println("[STEP 5/5] ALARM SIREN: Physical Security Strobes Triggered -> ALARM ON");
  printTelemetry("ALARM_STATE", "ALARM-SIREN-01", "SENSOR-ALARM-A-01", "CRITICAL", "{\"siren\":\"ON\",\"strobe\":\"ACTIVE\",\"alarm_type\":\"POSSIBLE_STOLEN_CREDENTIAL\"}");

  Serial.println("\n==================================================");
  Serial.println("EXPECTED TEST 3 RESULT:");
  Serial.println("RFID VERIFIED IRIS MISMATCH ACCESS DENIED DOOR LOCKED ALARM ON");
  Serial.println("==================================================\n");

  soundAlarm(5);
}

void soundAlarm(int pulses) {
  for (int i = 0; i < pulses; i++) {
    digitalWrite(PIN_LED_RED, HIGH);
    tone(PIN_BUZZER, 900);
    delay(150);
    digitalWrite(PIN_LED_RED, LOW);
    tone(PIN_BUZZER, 450);
    delay(150);
  }
  noTone(PIN_BUZZER);
  digitalWrite(PIN_LED_RED, LOW);
}

void resetSystem() {
  rfidVerified = false;
  alarmActive = false;
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  noTone(PIN_BUZZER);
  Serial.println("\n[SYSTEM RESET] System returned to secure baseline. Alarms cleared.");
}

void printTelemetry(String eventType, String deviceId, String sensorId, String severity, String metadataJson) {
  Serial.println(">>> SENTINEL-X INGEST TELEMETRY >>>");
  Serial.print("  { \"event_type\": \""); Serial.print(eventType);
  Serial.print("\", \"source_device_id\": \""); Serial.print(deviceId);
  Serial.print("\", \"sensor_id\": \""); Serial.print(sensorId);
  Serial.print("\", \"room_id\": \"ROOM-SERVER-A\", \"severity\": \""); Serial.print(severity);
  Serial.print("\", \"metadata\": "); Serial.print(metadataJson);
  Serial.println(" }");
  Serial.println("------------------------------------");
}
