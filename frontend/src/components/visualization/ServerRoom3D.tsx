import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, ShieldAlert, Radio, Eye, Key, DoorOpen, BellRing, Lock, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

interface ServerRoom3DProps {
  activePhase?: number; // 0: Idle, 1: Test 1 (Authorized), 2: Test 2 (Cloned), 3: Test 3 (Stolen/Mismatch)
  lastEvent?: {
    event_type: string;
    source_device_id?: string;
    severity?: string;
    metadata?: any;
  } | null;
  isAttackerView?: boolean;
  onPhaseSelect?: (phase: number) => void;
  className?: string;
}

export const ServerRoom3D: React.FC<ServerRoom3DProps> = ({
  activePhase = 0,
  lastEvent = null,
  isAttackerView = false,
  onPhaseSelect,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'door' | 'iris' | 'interior' | 'top'>('iso');
  const [currentTest, setCurrentTest] = useState<number>(activePhase);
  const [telemetryOverlay, setTelemetryOverlay] = useState({
    rfid: 'IDLE (13.56MHz Ready)',
    iris: 'STANDBY (Optical Ready)',
    door: 'MAGNETICALLY LOCKED (0°)',
    siren: 'OFF (Perimeter Secure)',
    status: 'SYSTEM NOMINAL'
  });

  // Keep references to 3D objects for real-time animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Peripherals
  const doorPivotRef = useRef<THREE.Group | null>(null);
  const rfidLedRef = useRef<THREE.Mesh | null>(null);
  const irisLensRef = useRef<THREE.Mesh | null>(null);
  const irisBeamRef = useRef<THREE.Mesh | null>(null);
  const interiorSirenRef = useRef<THREE.Mesh | null>(null);
  const exteriorSirenRef = useRef<THREE.Mesh | null>(null);
  const interiorSirenLightRef = useRef<THREE.PointLight | null>(null);
  const exteriorSirenLightRef = useRef<THREE.PointLight | null>(null);
  const pirConeRef = useRef<THREE.Mesh | null>(null);
  const rackLedsRef = useRef<THREE.Mesh[]>([]);

  // Intruder / Personnel Avatar Rig
  const intruderGroupRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-6, 0, 8));

  // Dynamic simulation states
  const testStateRef = useRef<{
    testMode: number; // 0: Idle, 1: Auth, 2: Cloned, 3: Stolen
    doorOpen: boolean;
    alarmActive: boolean;
    irisScanning: boolean;
    irisMatch: boolean | null;
    rfidStatus: 'idle' | 'auth' | 'cloned';
    subStep: number;
  }>({
    testMode: 0,
    doorOpen: false,
    alarmActive: false,
    irisScanning: false,
    irisMatch: null,
    rfidStatus: 'idle',
    subStep: 0
  });

  // Sync testMode with prop
  useEffect(() => {
    if (activePhase > 0) {
      triggerVisualTest(activePhase);
    }
  }, [activePhase]);

  // React to incoming WebSocket telemetry events in real time!
  useEffect(() => {
    if (!lastEvent) return;
    const type = lastEvent.event_type;
    const meta = lastEvent.metadata || {};

    if (type === 'RFID_VERIFIED') {
      testStateRef.current.rfidStatus = 'auth';
      testStateRef.current.alarmActive = false;
      targetPosRef.current.set(-4.5, 0, 5.4);
      setTelemetryOverlay(prev => ({
        ...prev,
        rfid: `VERIFIED (${meta.registered_user || 'Dr. V. Solanki'})`,
        status: 'RFID PRESENTED'
      }));
    } else if (type === 'IRIS_VERIFIED') {
      testStateRef.current.irisScanning = true;
      testStateRef.current.irisMatch = true;
      setTelemetryOverlay(prev => ({
        ...prev,
        iris: 'BIOMETRIC MATCH CONFIRMED (0.99)',
        status: 'IRIS VERIFIED'
      }));
    } else if (type === 'ACCESS_GRANTED') {
      testStateRef.current.doorOpen = true;
      testStateRef.current.alarmActive = false;
      targetPosRef.current.set(-2.0, 0, 0.5); // Walks inside!
      setTelemetryOverlay(prev => ({
        ...prev,
        door: 'UNLOCKED & SWINGING OPEN (85°)',
        status: 'ACCESS GRANTED - PERSONNEL ENTERED'
      }));
    } else if (type === 'CLONED_RFID' || type === 'ACCESS_DENIED_CLONED') {
      testStateRef.current.rfidStatus = 'cloned';
      testStateRef.current.doorOpen = false;
      testStateRef.current.alarmActive = true;
      targetPosRef.current.set(-4.5, 0, 5.4);
      setTelemetryOverlay({
        rfid: 'CLONED UID DETECTED [0xE20045A1]',
        iris: 'STANDBY',
        door: 'STRICTLY LOCKED (0°)',
        siren: 'ACTIVE (Dual Sirens Blaring)',
        status: 'BREACH DETECTED - CLONED RFID'
      });
    } else if (type === 'IRIS_MISMATCH' || type === 'ACCESS_DENIED_MISMATCH') {
      testStateRef.current.irisScanning = true;
      testStateRef.current.irisMatch = false;
      testStateRef.current.doorOpen = false;
      testStateRef.current.alarmActive = true;
      targetPosRef.current.set(-4.5, 0, 5.4);
      setTelemetryOverlay({
        rfid: 'VERIFIED (Dr. V. Solanki)',
        iris: 'MISMATCH [Possible Stolen Credential]',
        door: 'STRICTLY LOCKED (0°)',
        siren: 'ACTIVE (Dual Sirens Blaring)',
        status: 'SECURITY ALERT - BIOMETRIC MISMATCH'
      });
    } else if (type === 'ALARM_STATE') {
      testStateRef.current.alarmActive = meta.siren === 'ON' || meta.strobe === 'ACTIVE';
      setTelemetryOverlay(prev => ({
        ...prev,
        siren: testStateRef.current.alarmActive ? 'ACTIVE (Interior + Exterior Sirens Blaring)' : 'OFF'
      }));
    } else if (type === 'DOOR_STATE') {
      testStateRef.current.doorOpen = meta.state === 'UNLOCKED_AND_OPEN';
      setTelemetryOverlay(prev => ({
        ...prev,
        door: testStateRef.current.doorOpen ? 'UNLOCKED & OPEN' : 'MAGNETICALLY LOCKED'
      }));
    }
  }, [lastEvent]);

  // Execute interactive 3D visual test sequence
  const triggerVisualTest = (flowId: number) => {
    setCurrentTest(flowId);
    testStateRef.current.testMode = flowId;
    testStateRef.current.subStep = 1;

    if (flowId === 1) {
      // TEST 1: Authorized RFID + Authorized Iris -> Door Unlock & Open
      testStateRef.current.alarmActive = false;
      testStateRef.current.doorOpen = false;
      testStateRef.current.rfidStatus = 'auth';
      testStateRef.current.irisScanning = false;
      testStateRef.current.irisMatch = null;
      targetPosRef.current.set(-4.5, 0, 5.4);

      setTelemetryOverlay({
        rfid: 'VERIFIED (Dr. V. Solanki)',
        iris: 'SCANNING OCULAR SIGNATURE...',
        door: 'MAGNETICALLY LOCKED',
        siren: 'OFF',
        status: 'TEST 1: Step 1 RFID Verified'
      });

      // Step 2: Iris Verified
      setTimeout(() => {
        testStateRef.current.irisScanning = true;
        testStateRef.current.irisMatch = true;
        setTelemetryOverlay(prev => ({
          ...prev,
          iris: 'BIOMETRIC MATCH CONFIRMED (99.2%)',
          status: 'TEST 1: Step 2 Iris Biometric Verified'
        }));
      }, 1400);

      // Step 3: Access Granted & Door Open
      setTimeout(() => {
        testStateRef.current.doorOpen = true;
        setTelemetryOverlay(prev => ({
          ...prev,
          door: 'UNLOCKED & OPENING (85°)',
          status: 'TEST 1: Access Granted -> Personnel Entering'
        }));
        targetPosRef.current.set(-2.0, 0, 0.0); // Enters room!
      }, 2600);

    } else if (flowId === 2) {
      // TEST 2: Cloned RFID -> Access Denied, Door Locked, Alarm ON
      testStateRef.current.doorOpen = false;
      testStateRef.current.rfidStatus = 'cloned';
      testStateRef.current.irisScanning = false;
      testStateRef.current.irisMatch = null;
      targetPosRef.current.set(-4.5, 0, 5.4);

      setTelemetryOverlay({
        rfid: 'CLONED UID DETECTED [0xE20045A1]',
        iris: 'BYPASS ATTEMPT',
        door: 'MAGNETICALLY LOCKED',
        siren: 'OFF',
        status: 'TEST 2: Cloned RFID Presented'
      });

      // Step 2: Access Denied & Alarm ON
      setTimeout(() => {
        testStateRef.current.doorOpen = false;
        testStateRef.current.alarmActive = true;
        setTelemetryOverlay({
          rfid: 'CLONED RFID [REJECTED]',
          iris: 'ACCESS DENIED',
          door: 'STRICTLY LOCKED (0°)',
          siren: 'ACTIVE (Dual Interior + Exterior Sirens Blaring)',
          status: 'TEST 2: CLONED RFID -> ACCESS DENIED -> ALARM ON'
        });
      }, 1200);

    } else if (flowId === 3) {
      // TEST 3: Valid RFID + Wrong Iris -> Stolen Credential, Door Locked, Alarm ON
      testStateRef.current.doorOpen = false;
      testStateRef.current.alarmActive = false;
      testStateRef.current.rfidStatus = 'auth';
      testStateRef.current.irisScanning = false;
      testStateRef.current.irisMatch = null;
      targetPosRef.current.set(-4.5, 0, 5.4);

      setTelemetryOverlay({
        rfid: 'VERIFIED (Dr. V. Solanki)',
        iris: 'SCANNING OCULAR SIGNATURE...',
        door: 'MAGNETICALLY LOCKED',
        siren: 'OFF',
        status: 'TEST 3: Step 1 Valid RFID Scanned'
      });

      // Step 2: Iris Mismatch
      setTimeout(() => {
        testStateRef.current.irisScanning = true;
        testStateRef.current.irisMatch = false; // Mismatch!
        setTelemetryOverlay(prev => ({
          ...prev,
          iris: 'MISMATCH! [Possible Stolen Credential]',
          status: 'TEST 3: Step 2 Biometric Iris Mismatch'
        }));
      }, 1400);

      // Step 3: Alarm ON & Door Locked
      setTimeout(() => {
        testStateRef.current.doorOpen = false;
        testStateRef.current.alarmActive = true;
        setTelemetryOverlay({
          rfid: 'VERIFIED (Dr. V. Solanki)',
          iris: 'MISMATCH (Fraud Detected)',
          door: 'STRICTLY LOCKED (0° - ACCESS REFUSED)',
          siren: 'ACTIVE (Dual Sirens Blaring)',
          status: 'TEST 3: Possible Stolen Credential -> Door Locked -> Alarm On'
        });
      }, 2600);
    }
  };

  // Camera Presets
  const setCameraView = (view: 'iso' | 'door' | 'iris' | 'interior' | 'top') => {
    setCameraPreset(view);
    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    switch (view) {
      case 'iso':
        cam.position.set(11, 13, 15);
        cam.lookAt(0, 2, 0);
        break;
      case 'door':
        cam.position.set(-7, 4.5, 8.5);
        cam.lookAt(-4.0, 2.5, 4.0);
        break;
      case 'iris':
        cam.position.set(-4.5, 2.8, 6.2);
        cam.lookAt(-4.3, 2.6, 4.2);
        break;
      case 'interior':
        cam.position.set(1.0, 4.0, 2.0);
        cam.lookAt(4.0, 2.0, -2.0);
        break;
      case 'top':
        cam.position.set(0, 21, 0.1);
        cam.lookAt(0, 0, 0);
        break;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene & Renderer ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isAttackerView ? 0x080204 : 0x070b14);
    scene.fog = new THREE.FogExp2(isAttackerView ? 0x080204 : 0x070b14, 0.025);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(11, 13, 15);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- 2. Ambient & Key Lighting ---
    const ambientLight = new THREE.AmbientLight(isAttackerView ? 0x450a0a : 0x0f172a, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Cyan/Red Room Ceiling Center Accent
    const accentLight = new THREE.PointLight(isAttackerView ? 0xe11d48 : 0x06b6d4, 2.0, 25);
    accentLight.position.set(0, 8, 0);
    scene.add(accentLight);

    // --- 3. Floor with Cyber Grid ---
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isAttackerView ? 0x120407 : 0x0a0f1d,
      roughness: 0.6,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, isAttackerView ? 0xf43f5e : 0x38bdf8, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // --- 4. Perimeter Walls & Heavy Door Frame ---
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.5
    });

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 0.4), wallMat);
    backWall.position.set(0, 3, -12);
    scene.add(backWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 24), wallMat);
    rightWall.position.set(12, 3, 0);
    scene.add(rightWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 24), wallMat);
    leftWall.position.set(-12, 3, 0);
    scene.add(leftWall);

    // Front Wall with Doorway Opening
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 0.4), wallMat);
    frontWallLeft.position.set(-8.5, 3, 4);
    scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(13, 6, 0.4), wallMat);
    frontWallRight.position.set(5.5, 3, 4);
    scene.add(frontWallRight);

    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.4), wallMat);
    doorHeader.position.set(-3, 5.25, 4);
    scene.add(doorHeader);

    // Luminous Doorway Frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.4
    });
    const doorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.5, 0.5), frameMat);
    doorFrameL.position.set(-5.0, 2.25, 4);
    scene.add(doorFrameL);

    const doorFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.5, 0.5), frameMat);
    doorFrameR.position.set(-1.0, 2.25, 4);
    scene.add(doorFrameR);

    // --- 5. Swinging Security Door (Hinged at x = -5.0) ---
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-5.0, 0, 4.0); // Hinge position
    doorPivotRef.current = doorPivot;
    scene.add(doorPivot);

    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.9, 4.4, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.3,
        metalness: 0.8
      })
    );
    doorMesh.position.set(1.95, 2.2, 0); // Offset to pivot at left hinge
    doorMesh.castShadow = true;
    doorPivot.add(doorMesh);

    // Reinforced glass observation panel on door
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.2),
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transmission: 0.8,
        opacity: 0.6,
        transparent: true,
        roughness: 0.1
      })
    );
    windowMesh.position.set(1.95, 2.8, 0);
    doorPivot.add(windowMesh);

    // Magnetic lock solenoid at top right of door
    const magLock = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.2, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
    );
    magLock.position.set(-1.2, 4.3, 4.15);
    scene.add(magLock);

    // --- 6. Wall-Mounted RFID Reader Terminal ---
    const rfidBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.6, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    rfidBox.position.set(-5.35, 2.1, 4.25);
    scene.add(rfidBox);

    const rfidLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 1.5
      })
    );
    rfidLed.position.set(-5.35, 2.3, 4.35);
    rfidLedRef.current = rfidLed;
    scene.add(rfidLed);

    // --- 7. Wall-Mounted Iris Biometric Scanner ---
    const irisHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.55, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.8, roughness: 0.2 })
    );
    irisHousing.position.set(-5.35, 2.8, 4.25); // Eye level
    scene.add(irisHousing);

    // Bezel ring
    const irisBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.02, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8 })
    );
    irisBezel.position.set(-5.35, 2.8, 4.35);
    scene.add(irisBezel);

    // Optical Lens
    const irisLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.2
      })
    );
    irisLens.position.set(-5.35, 2.8, 4.37);
    irisLensRef.current = irisLens;
    scene.add(irisLens);

    // Volumetric Eye-Scanning Beam (Conical projection targeting character face)
    const beamGeo = new THREE.ConeGeometry(0.35, 1.4, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const irisBeam = new THREE.Mesh(beamGeo, beamMat);
    irisBeam.position.set(-5.1, 2.5, 4.9);
    irisBeam.rotation.x = Math.PI * 0.45;
    irisBeam.rotation.z = -Math.PI * 0.15;
    irisBeamRef.current = irisBeam;
    scene.add(irisBeam);

    // --- 8. Dual Alarm Sirens & Strobes (Interior + Exterior) ---
    // A. Exterior Siren above Entrance
    const extSirenBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    extSirenBase.position.set(-3.0, 4.75, 4.25);
    scene.add(extSirenBase);

    const extSirenDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x7f0000,
        emissiveIntensity: 0.2,
        roughness: 0.1
      })
    );
    extSirenDome.position.set(-3.0, 4.82, 4.25);
    exteriorSirenRef.current = extSirenDome;
    scene.add(extSirenDome);

    const extSirenLight = new THREE.PointLight(0xff0000, 0, 16);
    extSirenLight.position.set(-3.0, 4.85, 4.5);
    exteriorSirenLightRef.current = extSirenLight;
    scene.add(extSirenLight);

    // B. Interior Siren on Room Ceiling
    const intSirenBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    intSirenBase.position.set(0, 5.75, 0);
    scene.add(intSirenBase);

    const intSirenDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x7f0000,
        emissiveIntensity: 0.2,
        roughness: 0.1
      })
    );
    intSirenDome.position.set(0, 5.65, 0);
    intSirenDome.rotation.x = Math.PI; // Pointing downwards from ceiling
    interiorSirenRef.current = intSirenDome;
    scene.add(intSirenDome);

    const intSirenLight = new THREE.PointLight(0xff0000, 0, 25);
    intSirenLight.position.set(0, 5.4, 0);
    interiorSirenLightRef.current = intSirenLight;
    scene.add(intSirenLight);

    // --- 9. Server Racks with Blinking Activity LEDs ---
    const rackGeo = new THREE.BoxGeometry(2.0, 5.0, 1.5);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x030712, metalness: 0.85, roughness: 0.3 });
    const rackPositions = [
      new THREE.Vector3(2.5, 2.5, -2.5),
      new THREE.Vector3(5.0, 2.5, -2.5),
      new THREE.Vector3(7.5, 2.5, -2.5)
    ];

    const leds: THREE.Mesh[] = [];
    rackPositions.forEach((pos) => {
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.copy(pos);
      scene.add(rack);

      const glassDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 4.8),
        new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, transmission: 0.7, opacity: 0.4, transparent: true })
      );
      glassDoor.position.set(pos.x, pos.y, pos.z + 0.76);
      scene.add(glassDoor);

      for (let unit = 0; unit < 6; unit++) {
        for (let col = 0; col < 3; col++) {
          const led = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.02),
            new THREE.MeshBasicMaterial({ color: col === 0 ? 0x22c55e : col === 1 ? 0x38bdf8 : 0xf59e0b })
          );
          led.position.set(pos.x - 0.6 + col * 0.3, pos.y - 1.8 + unit * 0.7, pos.z + 0.74);
          scene.add(led);
          leds.push(led);
        }
      }
    });
    rackLedsRef.current = leds;

    // --- 10. Personnel / Operative Avatar Rig ---
    const operative = new THREE.Group();
    operative.position.set(-6, 0, 8);
    intruderGroupRef.current = operative;
    scene.add(operative);

    // Torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    torso.position.y = 1.45;
    operative.add(torso);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.45, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    head.position.y = 2.25;
    operative.add(head);

    // Cyber Visor / Eye
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.12, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    visor.position.set(0, 2.25, 0.2);
    operative.add(visor);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.48, 1.9, 0);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.y = -0.4;
    leftArmGroup.add(leftArm);
    operative.add(leftArmGroup);
    leftArmRef.current = leftArmGroup;

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.48, 1.9, 0);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.y = -0.4;
    rightArmGroup.add(rightArm);
    operative.add(rightArmGroup);
    rightArmRef.current = rightArmGroup;

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 1.0, 0.25);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x090d16 });

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.2, 1.0, 0);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.y = -0.5;
    leftLegGroup.add(leftLeg);
    operative.add(leftLegGroup);
    leftLegRef.current = leftLegGroup;

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.2, 1.0, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.y = -0.5;
    rightLegGroup.add(rightLeg);
    operative.add(rightLegGroup);
    rightLegRef.current = rightLegGroup;

    // --- 11. Mouse Interaction ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      const cam = cameraRef.current;
      const radius = Math.hypot(cam.position.x, cam.position.z);
      let theta = Math.atan2(cam.position.z, cam.position.x);
      theta -= deltaX * 0.006;
      cam.position.x = radius * Math.cos(theta);
      cam.position.z = radius * Math.sin(theta);
      cam.position.y = Math.max(2, Math.min(30, cam.position.y + deltaY * 0.05));
      cam.lookAt(0, 2, 0);
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      cam.position.multiplyScalar(factor);
      cam.lookAt(0, 2, 0);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 12. Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const st = testStateRef.current;

      // 1. Smooth Door Swing
      // RULE: Only open when doorOpen is true (Test 1). Locked (0°) on failed auth!
      if (doorPivotRef.current) {
        const targetDoorAngle = st.doorOpen ? -Math.PI * 0.48 : 0.0;
        doorPivotRef.current.rotation.y = THREE.MathUtils.lerp(
          doorPivotRef.current.rotation.y,
          targetDoorAngle,
          delta * 3.5
        );
      }

      // 2. Dual Alarm Sirens & Strobes (Interior + Exterior)
      if (st.alarmActive) {
        const strobe = Math.sin(time * 16) > 0 ? 3.5 : 0.1;
        if (interiorSirenLightRef.current) interiorSirenLightRef.current.intensity = strobe * 2.0;
        if (exteriorSirenLightRef.current) exteriorSirenLightRef.current.intensity = strobe * 2.0;

        if (interiorSirenRef.current && interiorSirenRef.current.material instanceof THREE.MeshStandardMaterial) {
          interiorSirenRef.current.material.emissive.setHex(0xff0000);
          interiorSirenRef.current.material.emissiveIntensity = strobe;
        }
        if (exteriorSirenRef.current && exteriorSirenRef.current.material instanceof THREE.MeshStandardMaterial) {
          exteriorSirenRef.current.material.emissive.setHex(0xff0000);
          exteriorSirenRef.current.material.emissiveIntensity = strobe;
        }
      } else {
        if (interiorSirenLightRef.current) interiorSirenLightRef.current.intensity = 0;
        if (exteriorSirenLightRef.current) exteriorSirenLightRef.current.intensity = 0;

        if (interiorSirenRef.current && interiorSirenRef.current.material instanceof THREE.MeshStandardMaterial) {
          interiorSirenRef.current.material.emissiveIntensity = 0.05;
        }
        if (exteriorSirenRef.current && exteriorSirenRef.current.material instanceof THREE.MeshStandardMaterial) {
          exteriorSirenRef.current.material.emissiveIntensity = 0.05;
        }
      }

      // 3. Iris Scanner Lens & Eye-Scanning Beam
      if (irisLensRef.current && irisLensRef.current.material instanceof THREE.MeshStandardMaterial) {
        if (st.irisScanning) {
          if (st.irisMatch === true) {
            irisLensRef.current.material.color.setHex(0x10b981);
            irisLensRef.current.material.emissive.setHex(0x10b981);
            irisLensRef.current.material.emissiveIntensity = 2.0;
            if (irisBeamRef.current && irisBeamRef.current.material instanceof THREE.MeshBasicMaterial) {
              irisBeamRef.current.material.color.setHex(0x10b981);
              irisBeamRef.current.material.opacity = 0.35 + Math.sin(time * 15) * 0.15;
            }
          } else if (st.irisMatch === false) {
            // Mismatch!
            const redPulse = Math.sin(time * 20) > 0 ? 0xff0000 : 0x7f0000;
            irisLensRef.current.material.color.setHex(redPulse);
            irisLensRef.current.material.emissive.setHex(redPulse);
            irisLensRef.current.material.emissiveIntensity = 2.5;
            if (irisBeamRef.current && irisBeamRef.current.material instanceof THREE.MeshBasicMaterial) {
              irisBeamRef.current.material.color.setHex(0xff0000);
              irisBeamRef.current.material.opacity = 0.5 + Math.sin(time * 20) * 0.25;
            }
          }
        } else {
          irisLensRef.current.material.color.setHex(0x06b6d4);
          irisLensRef.current.material.emissive.setHex(0x06b6d4);
          irisLensRef.current.material.emissiveIntensity = 0.6;
          if (irisBeamRef.current && irisBeamRef.current.material instanceof THREE.MeshBasicMaterial) {
            irisBeamRef.current.material.opacity = 0.0;
          }
        }
      }

      // 4. RFID Terminal LED
      if (rfidLedRef.current && rfidLedRef.current.material instanceof THREE.MeshStandardMaterial) {
        if (st.rfidStatus === 'cloned') {
          const redBlink = Math.sin(time * 15) > 0 ? 0xef4444 : 0x450a0a;
          rfidLedRef.current.material.color.setHex(redBlink);
          rfidLedRef.current.material.emissive.setHex(redBlink);
        } else if (st.rfidStatus === 'auth') {
          rfidLedRef.current.material.color.setHex(0x10b981);
          rfidLedRef.current.material.emissive.setHex(0x10b981);
        } else {
          rfidLedRef.current.material.color.setHex(0x06b6d4);
          rfidLedRef.current.material.emissive.setHex(0x06b6d4);
        }
      }

      // 5. Operative Avatar Movement towards Target Waypoint
      if (intruderGroupRef.current && targetPosRef.current) {
        const char = intruderGroupRef.current;
        const target = targetPosRef.current;
        const dist = char.position.distanceTo(target);

        if (dist > 0.1) {
          char.position.lerp(target, delta * 2.8);
          const angle = Math.atan2(target.x - char.position.x, target.z - char.position.z);
          char.rotation.y = angle;

          if (leftLegRef.current && rightLegRef.current && leftArmRef.current && rightArmRef.current) {
            leftLegRef.current.rotation.x = Math.sin(time * 12) * 0.55;
            rightLegRef.current.rotation.x = -Math.sin(time * 12) * 0.55;
            leftArmRef.current.rotation.x = -Math.sin(time * 12) * 0.45;
            rightArmRef.current.rotation.x = Math.sin(time * 12) * 0.45;
          }
        } else {
          // Standing in front of scanner / inside room
          if (leftLegRef.current && rightLegRef.current && leftArmRef.current && rightArmRef.current) {
            leftLegRef.current.rotation.x = 0;
            rightLegRef.current.rotation.x = 0;

            if (st.testMode > 0 && target.z > 3.0) {
              // Presenting badge to RFID reader
              rightArmRef.current.rotation.x = -Math.PI * 0.4;
              rightArmRef.current.rotation.z = Math.PI * 0.15;
              leftArmRef.current.rotation.x = Math.sin(time * 2) * 0.05;
            } else {
              leftArmRef.current.rotation.x = 0;
              rightArmRef.current.rotation.x = 0;
            }
          }
        }
      }

      // 6. Blink server rack LEDs
      if (Math.random() < 0.25 && rackLedsRef.current.length > 0) {
        const randIdx = Math.floor(Math.random() * rackLedsRef.current.length);
        const led = rackLedsRef.current[randIdx];
        if (led && led.material instanceof THREE.MeshBasicMaterial) {
          led.material.color.setHex(Math.random() > 0.4 ? 0x22c55e : 0x06b6d4);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isAttackerView]);

  return (
    <div className={`relative rounded-xl border ${isAttackerView ? 'border-rose-950/80 bg-black/90' : 'border-slate-800 bg-[#090e1a]/95'} overflow-hidden shadow-2xl ${className}`}>
      {/* Top Interactive Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Camera Preset Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/75 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg">
          <button
            onClick={() => setCameraView('iso')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition ${cameraPreset === 'iso' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setCameraView('door')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition ${cameraPreset === 'door' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Door Portal
          </button>
          <button
            onClick={() => setCameraView('iris')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition ${cameraPreset === 'iris' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Biometric Scanner
          </button>
          <button
            onClick={() => setCameraView('interior')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition ${cameraPreset === 'interior' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Server Aisle
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition ${cameraPreset === 'top' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Top View
          </button>
        </div>

        {/* 3 Interactive Test Flow Quick-Triggers */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/80 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg">
          <button
            onClick={() => triggerVisualTest(1)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono font-bold transition"
            title="TEST 1: Authorized RFID + Authorized Iris -> Door Unlock & Open"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>TEST 1: AUTH PASS</span>
          </button>
          <button
            onClick={() => triggerVisualTest(2)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 text-[11px] font-mono font-bold transition"
            title="TEST 2: Cloned RFID -> Access Denied, Door Locked, Alarm ON"
          >
            <Key className="w-3 h-3 text-amber-400" />
            <span>TEST 2: CLONED RFID</span>
          </button>
          <button
            onClick={() => triggerVisualTest(3)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 text-[11px] font-mono font-bold transition"
            title="TEST 3: Valid RFID + Wrong Iris -> Stolen Credential, Door Locked, Alarm ON"
          >
            <Eye className="w-3 h-3 text-rose-400" />
            <span>TEST 3: STOLEN RFID</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-[480px] cursor-grab active:cursor-grabbing" />

      {/* Live Cyber-Physical Telemetry Readout Strip */}
      <div className="p-3.5 bg-black/85 backdrop-blur-md border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
            <Key className="w-3 h-3 text-cyan-400" />
            <span>RFID Scanner</span>
          </div>
          <div className={`mt-1 font-bold text-xs truncate ${telemetryOverlay.rfid.includes('CLONED') ? 'text-rose-400' : telemetryOverlay.rfid.includes('VERIFIED') ? 'text-emerald-400' : 'text-slate-300'}`}>
            {telemetryOverlay.rfid}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Biometric Iris Scanner</span>
          </div>
          <div className={`mt-1 font-bold text-xs truncate ${telemetryOverlay.iris.includes('MISMATCH') ? 'text-rose-400' : telemetryOverlay.iris.includes('MATCH') ? 'text-emerald-400' : 'text-slate-300'}`}>
            {telemetryOverlay.iris}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
            <DoorOpen className="w-3 h-3 text-cyan-400" />
            <span>Door Interlock</span>
          </div>
          <div className={`mt-1 font-bold text-xs truncate ${telemetryOverlay.door.includes('UNLOCKED') ? 'text-emerald-400' : 'text-amber-400'}`}>
            {telemetryOverlay.door}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
            <BellRing className="w-3 h-3 text-rose-400" />
            <span>Dual Alarm Sirens</span>
          </div>
          <div className={`mt-1 font-bold text-xs truncate ${telemetryOverlay.siren.includes('ACTIVE') ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {telemetryOverlay.siren}
          </div>
        </div>
      </div>
    </div>
  );
};
