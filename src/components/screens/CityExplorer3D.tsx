import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Layers,
  Building2,
  Zap,
  Users,
  Activity,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Compass,
  Camera,
  Play,
  Pause,
  X,
  Wind,
  Navigation,
  Sliders,
  Sparkles,
  ChevronRight,
  Sun,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Building, DistrictId, ScreenId, Alert } from '../../types';
import { BUILDINGS, DISTRICTS } from '../../data/mockData';

export interface CityExplorer3DProps {
  selectedDistrict: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  onNavigate: (screen: ScreenId, entityId?: string) => void;
  initialBuildingId?: string;
  alerts: Alert[];
  /** When true, renders floating live KPI cards and hero HUD elements */
  isHeroMode?: boolean;
}

type CameraPreset = 'isometric' | 'street' | 'topdown' | 'cinematic';

interface HoveredBuildingInfo {
  building: Building;
  screenX: number;
  screenY: number;
}

interface DistrictLabel2D {
  id: DistrictId;
  name: string;
  tagline: string;
  avgAqi: number;
  screenX: number;
  screenY: number;
  visible: boolean;
}

export const CityExplorer3D: React.FC<CityExplorer3DProps> = ({
  selectedDistrict,
  onSelectDistrict,
  onNavigate,
  initialBuildingId,
  alerts,
  isHeroMode = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    () => BUILDINGS.find((b) => b.id === initialBuildingId) || BUILDINGS[0]
  );
  const [hoveredBuilding, setHoveredBuilding] = useState<HoveredBuildingInfo | null>(null);

  // 5 Interactive Transforming Layers
  const [layers, setLayers] = useState({
    traffic: true,
    energy: true,
    airQuality: true,
    buildingHealth: true,
    incidents: true,
  });

  const [activePreset, setActivePreset] = useState<CameraPreset>('isometric');
  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(!isHeroMode);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(true);
  const [webGLError, setWebGLError] = useState<boolean>(false);
  const [districtLabels, setDistrictLabels] = useState<DistrictLabel2D[]>([]);

  // Three.js instances and refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const roadMeshesRef = useRef<THREE.Mesh[]>([]);
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const conduitGroupRef = useRef<THREE.Group | null>(null);
  const aqiHeatmapGroupRef = useRef<THREE.Group | null>(null);
  const atmosphericParticlesRef = useRef<THREE.Points | null>(null);
  const incidentBeaconsRef = useRef<THREE.Group | null>(null);
  const trafficLightBulbsRef = useRef<{ red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh; cycleOffset: number }[]>([]);

  // Interaction controls
  const isMouseDownRef = useRef(false);
  const isRightClickRef = useRef(false);
  const mousePrevRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0.85, phi: 0.65, radius: 140 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 0));
  const cameraLerpTargetRef = useRef<{ theta: number; phi: number; radius: number; targetX: number; targetY: number; targetZ: number } | null>(null);

  // Procedural Window Canvas Texture
  const windowTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Generate glowing procedural window lattice texture
  const getOrCreateWindowTexture = () => {
    if (windowTextureRef.current) return windowTextureRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark titanium facade background
    ctx.fillStyle = '#0a1322';
    ctx.fillRect(0, 0, 128, 256);

    // Neon glowing window grid
    const rows = 32;
    const cols = 8;
    const w = 10;
    const h = 5;
    const padX = 5;
    const padY = 3;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = Math.random() < 0.68;
        if (lit) {
          const rand = Math.random();
          if (rand < 0.6) ctx.fillStyle = '#37d7ff'; // Cyan window
          else if (rand < 0.82) ctx.fillStyle = '#9b7bff'; // Violet window
          else ctx.fillStyle = '#f3f7ff'; // Warm white window
          ctx.fillRect(c * (w + padX) + padX, r * (h + padY) + padY, w, h);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    windowTextureRef.current = tex;
    return tex;
  };

  // Sync initial building if prop updates
  useEffect(() => {
    if (initialBuildingId) {
      const b = BUILDINGS.find((item) => item.id === initialBuildingId);
      if (b) {
        setSelectedBuilding(b);
        setIsDetailsOpen(true);
        flyToBuilding(b);
      }
    }
  }, [initialBuildingId]);

  // Smooth camera fly-to building
  const flyToBuilding = (b: Building) => {
    setIsAutoOrbit(false);
    cameraLerpTargetRef.current = {
      theta: Math.atan2(b.position3D.x, b.position3D.z) + 0.45,
      phi: 0.58,
      radius: 65,
      targetX: b.position3D.x,
      targetY: b.position3D.y * 0.45,
      targetZ: b.position3D.z,
    };
  };

  // Smooth camera fly-to district
  const flyToDistrict = (distId: DistrictId) => {
    onSelectDistrict(distId);
    setIsAutoOrbit(false);
    if (distId === 'all') {
      cameraLerpTargetRef.current = {
        theta: 0.85,
        phi: 0.65,
        radius: 140,
        targetX: 0,
        targetY: 10,
        targetZ: 0,
      };
    } else {
      const d = DISTRICTS.find((item) => item.id === distId);
      if (d) {
        cameraLerpTargetRef.current = {
          theta: Math.atan2(d.coordinates.x, d.coordinates.z) + 0.45,
          phi: 0.62,
          radius: 80,
          targetX: d.coordinates.x,
          targetY: 8,
          targetZ: d.coordinates.z,
        };
      }
    }
  };

  // Switch camera presets
  const applyCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    setIsAutoOrbit(preset === 'cinematic');
    switch (preset) {
      case 'isometric':
        cameraLerpTargetRef.current = { theta: 0.85, phi: 0.65, radius: 140, targetX: 0, targetY: 10, targetZ: 0 };
        break;
      case 'street':
        cameraLerpTargetRef.current = { theta: 1.15, phi: 0.2, radius: 82, targetX: 0, targetY: 10, targetZ: 0 };
        break;
      case 'topdown':
        cameraLerpTargetRef.current = { theta: 0.01, phi: 0.05, radius: 175, targetX: 0, targetY: 0, targetZ: 0 };
        break;
      case 'cinematic':
        cameraLerpTargetRef.current = { theta: 0.72, phi: 0.48, radius: 110, targetX: 0, targetY: 14, targetZ: 0 };
        break;
    }
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const target = cameraTargetRef.current;
    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const width = container.clientWidth || 900;
      const height = container.clientHeight || 650;

      // 1. Scene & Cinematic Fog
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x070b16);
      scene.fog = new THREE.FogExp2(0x070b16, 0.0055);

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1400);
      cameraRef.current = camera;
      updateCameraPosition();

      // 3. Renderer with antialiasing and tone mapping
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      rendererRef.current = renderer;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      container.appendChild(renderer.domElement);

      // 4. Cinematic Lighting
      const ambientLight = new THREE.AmbientLight(0x162438, 2.6);
      scene.add(ambientLight);

      const electricCyanLight = new THREE.DirectionalLight(0x00e5ff, 2.6);
      electricCyanLight.position.set(85, 140, 65);
      scene.add(electricCyanLight);

      const vividBlueLight = new THREE.DirectionalLight(0x4d7cfe, 2.2);
      vividBlueLight.position.set(-85, 75, -75);
      scene.add(vividBlueLight);

      const violetAccentLight = new THREE.PointLight(0x9b6dff, 3.2, 220);
      violetAccentLight.position.set(0, 50, 0);
      scene.add(violetAccentLight);

      // 5. Ground Plane & Futuristic Cyber Grid
      const groundGeo = new THREE.PlaneGeometry(340, 340);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x070e1b,
        roughness: 0.9,
        metalness: 0.25,
      });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.y = -0.25;
      scene.add(groundMesh);

      // Cyber floor grid
      const gridHelper = new THREE.GridHelper(280, 56, 0x00e5ff, 0x16263f);
      gridHelper.position.y = -0.15;
      scene.add(gridHelper);

      // 6. Water Body & Neo Harbor Canal
      const waterGeo = new THREE.PlaneGeometry(130, 95);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x03192f,
        roughness: 0.12,
        metalness: 0.9,
        emissive: 0x002e4d,
        emissiveIntensity: 0.45,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(68, -0.18, 42);
      scene.add(waterMesh);

      // Water harbor seawall perimeter
      const seawallGeo = new THREE.BoxGeometry(130, 1.4, 2.2);
      const seawallMat = new THREE.MeshStandardMaterial({ color: 0x15243a, roughness: 0.7 });
      const seawall = new THREE.Mesh(seawallGeo, seawallMat);
      seawall.position.set(68, 0.45, -5);
      scene.add(seawall);

      // Cable-stayed Suspension Bridge to Harbor
      const bridgeGroup = new THREE.Group();
      const bridgeDeckGeo = new THREE.BoxGeometry(48, 0.8, 6.5);
      const bridgeDeckMat = new THREE.MeshStandardMaterial({ color: 0x1a2e47, metalness: 0.85 });
      const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, bridgeDeckMat);
      bridgeDeck.position.set(24, 2.5, 26);
      bridgeGroup.add(bridgeDeck);

      // Bridge Pylons
      const pylonGeo = new THREE.CylinderGeometry(0.8, 1.5, 24, 8);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.35 });
      const pylon1 = new THREE.Mesh(pylonGeo, pylonMat);
      pylon1.position.set(13, 12, 26);
      const pylon2 = new THREE.Mesh(pylonGeo, pylonMat);
      pylon2.position.set(35, 12, 26);
      bridgeGroup.add(pylon1, pylon2);

      // Suspension Cables
      for (let i = -14; i <= 14; i += 4) {
        const cableGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(13, 20, 26),
          new THREE.Vector3(13 + i, 2.8, 26),
        ]);
        const cableMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.45 });
        bridgeGroup.add(new THREE.Line(cableGeo, cableMat));
      }
      scene.add(bridgeGroup);

      // 7. Green Belt & Bioluminescent Foliage
      const parksGroup = new THREE.Group();
      const treePositions = [
        [32, -30], [36, -34], [40, -28], [28, -36], [44, -38],
        [-30, -32], [-35, -36], [-28, -42], [-40, -40], [35, -24],
      ];
      treePositions.forEach(([tx, tz]) => {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c2b3d });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(tx, 1.5, tz);

        const canopyGeo = new THREE.ConeGeometry(2.6, 5.2, 7);
        const canopyMat = new THREE.MeshStandardMaterial({
          color: 0x1f7a55,
          emissive: 0x39d98a,
          emissiveIntensity: 0.38,
          roughness: 0.4,
        });
        const canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(tx, 4.6, tz);
        parksGroup.add(trunk, canopy);
      });
      scene.add(parksGroup);

      // 8. Road Network & Sidewalk Meshes
      const roadGroup = new THREE.Group();
      const roadMeshes: THREE.Mesh[] = [];

      const mainRoads = [
        { x1: -85, z1: 0, x2: 85, z2: 0, w: 7.2, isArterial: true, name: 'Nexus Central Skyway', congestion: 0.72 },
        { x1: 0, z1: -85, x2: 0, z2: 85, w: 7.2, isArterial: true, name: 'Financial Spine Arterial', congestion: 0.85 },
        { x1: 20, z1: 20, x2: 80, z2: 48, w: 6.2, isArterial: false, name: 'Harbor Freight Blvd', congestion: 0.45 },
        { x1: -25, z1: 20, x2: -80, z2: 52, w: 6.2, isArterial: false, name: 'Tech Corridor Parkway', congestion: 0.62 },
        { x1: -20, z1: -20, x2: -70, z2: -58, w: 6.2, isArterial: false, name: 'Aurora Boulevard', congestion: 0.38 },
        { x1: 20, z1: -20, x2: 75, z2: -48, w: 6.2, isArterial: false, name: 'Green Belt Botanical Way', congestion: 0.22 },
      ];

      mainRoads.forEach((r) => {
        const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
        const angle = Math.atan2(r.z2 - r.z1, r.x2 - r.x1);
        const midX = (r.x1 + r.x2) / 2;
        const midZ = (r.z1 + r.z2) / 2;

        // Asphalt road surface
        const roadSurfaceGeo = new THREE.PlaneGeometry(len, r.w);
        const roadSurfaceMat = new THREE.MeshStandardMaterial({
          color: 0x0d1829,
          roughness: 0.75,
          metalness: 0.35,
          emissive: 0x00e5ff,
          emissiveIntensity: 0.05,
        });
        const roadMesh = new THREE.Mesh(roadSurfaceGeo, roadSurfaceMat);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.rotation.z = angle;
        roadMesh.position.set(midX, -0.08, midZ);
        roadMesh.userData = { isArterial: r.isArterial, congestion: r.congestion };
        roadGroup.add(roadMesh);
        roadMeshes.push(roadMesh);

        // Center glowing dashes
        const dashGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-len / 2, 0, 0),
          new THREE.Vector3(len / 2, 0, 0),
        ]);
        const dashMat = new THREE.LineDashedMaterial({
          color: 0x00e5ff,
          dashSize: 2.5,
          gapSize: 2,
        });
        const dashLine = new THREE.Line(dashGeo, dashMat);
        dashLine.computeLineDistances();
        dashLine.rotation.x = -Math.PI / 2;
        dashLine.rotation.z = angle;
        dashLine.position.set(midX, 0.05, midZ);
        roadGroup.add(dashLine);
      });
      scene.add(roadGroup);
      roadMeshesRef.current = roadMeshes;

      // 9. Intersection Animated Traffic Signals
      const trafficLightBulbs: { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh; cycleOffset: number }[] = [];
      const intersectionCoords = [
        { x: 0, z: 0, offset: 0 },
        { x: 0, z: 40, offset: 2.5 },
        { x: 0, z: -40, offset: 1.2 },
        { x: -40, z: 0, offset: 3.8 },
      ];

      intersectionCoords.forEach((ic) => {
        const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 6, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x15243a, metalness: 0.9 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(ic.x + 4.2, 3, ic.z + 4.2);
        scene.add(pole);

        const housingGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x0d1522, roughness: 0.5 });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(ic.x + 4.2, 5.5, ic.z + 4.2);
        scene.add(housing);

        // Red light
        const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
        const redMesh = new THREE.Mesh(bulbGeo, redMat);
        redMesh.position.set(ic.x + 4.2, 6.1, ic.z + 4.5);
        scene.add(redMesh);

        // Amber light
        const amberMat = new THREE.MeshBasicMaterial({ color: 0x443000 });
        const amberMesh = new THREE.Mesh(bulbGeo, amberMat);
        amberMesh.position.set(ic.x + 4.2, 5.5, ic.z + 4.5);
        scene.add(amberMesh);

        // Green light
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x004411 });
        const greenMesh = new THREE.Mesh(bulbGeo, greenMat);
        greenMesh.position.set(ic.x + 4.2, 4.9, ic.z + 4.5);
        scene.add(greenMesh);

        trafficLightBulbs.push({
          red: redMesh,
          amber: amberMesh,
          green: greenMesh,
          cycleOffset: ic.offset,
        });
      });
      trafficLightBulbsRef.current = trafficLightBulbs;

      // 10. Multi-Tier Procedural Skyscrapers with varied architecture
      const meshesMap = new Map<string, THREE.Group>();
      const windowTex = getOrCreateWindowTexture();

      BUILDINGS.forEach((b) => {
        const buildingGroup = new THREE.Group();
        buildingGroup.userData = { buildingId: b.id };
        buildingGroup.position.set(b.position3D.x, 0, b.position3D.z);

        // Building health color coding
        let accentColorHex = b.colorHex;
        if (b.maintenanceRiskScore >= 70) accentColorHex = '#FF5D73';
        else if (b.maintenanceRiskScore >= 50) accentColorHex = '#FFB84D';

        const podiumHeight = Math.max(3, b.size3D.h * 0.18);
        const podiumW = b.size3D.w * 1.15;
        const podiumD = b.size3D.d * 1.15;

        // 10a. Base Podium Block
        const podiumGeo = new THREE.BoxGeometry(podiumW, podiumHeight, podiumD);
        const podiumMat = new THREE.MeshStandardMaterial({
          color: 0x111c2e,
          roughness: 0.45,
          metalness: 0.8,
        });
        const podiumMesh = new THREE.Mesh(podiumGeo, podiumMat);
        podiumMesh.position.y = podiumHeight / 2;
        buildingGroup.add(podiumMesh);

        // 10b. Main Tower Shaft (Rectangular, Cylindrical or Chamfered based on building type)
        const towerHeight = b.size3D.h * 0.72;
        let towerMesh: THREE.Mesh;
        let towerGeo: THREE.BufferGeometry;

        if (b.type === 'Research & AI' || b.type === 'Data Center') {
          // Cylindrical futuristic tower
          towerGeo = new THREE.CylinderGeometry(b.size3D.w * 0.52, b.size3D.w * 0.52, towerHeight, 16);
        } else if (b.type === 'Transit Hub') {
          // Stepped broad tower
          towerGeo = new THREE.BoxGeometry(b.size3D.w * 1.05, towerHeight, b.size3D.d * 0.95);
        } else {
          // Box high-rise
          towerGeo = new THREE.BoxGeometry(b.size3D.w, towerHeight, b.size3D.d);
        }

        const towerMat = new THREE.MeshStandardMaterial({
          map: windowTex,
          color: new THREE.Color(accentColorHex),
          roughness: 0.32,
          metalness: 0.75,
          emissive: new THREE.Color(accentColorHex),
          emissiveIntensity: 0.28,
        });
        towerMesh = new THREE.Mesh(towerGeo, towerMat);
        towerMesh.position.y = podiumHeight + towerHeight / 2;
        buildingGroup.add(towerMesh);

        // Wireframe edges on main tower
        const edges = new THREE.EdgesGeometry(towerGeo);
        const wireMat = new THREE.LineBasicMaterial({
          color: 0x00e5ff,
          transparent: true,
          opacity: 0.38,
        });
        const wireframe = new THREE.LineSegments(edges, wireMat);
        wireframe.position.copy(towerMesh.position);
        buildingGroup.add(wireframe);

        // 10c. Crown / Spire / Helipad (Architectural Variety)
        const crownY = podiumHeight + towerHeight;
        if (b.floors > 60) {
          // Tapered Spire with Flashing Red Aviation Beacon
          const spireGeo = new THREE.ConeGeometry(b.size3D.w * 0.45, b.size3D.h * 0.16, 6);
          const spireMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9 });
          const spireMesh = new THREE.Mesh(spireGeo, spireMat);
          spireMesh.position.y = crownY + (b.size3D.h * 0.16) / 2;
          buildingGroup.add(spireMesh);

          // Red aircraft warning beacon
          const beaconGeo = new THREE.SphereGeometry(0.7, 8, 8);
          const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.y = crownY + b.size3D.h * 0.16 + 0.8;
          beacon.userData = { isBlinkingBeacon: true };
          buildingGroup.add(beacon);
        } else if (b.type === 'Hospital' || b.type === 'Commercial') {
          // Helipad Disc on roof
          const heliGeo = new THREE.CylinderGeometry(b.size3D.w * 0.4, b.size3D.w * 0.4, 0.4, 16);
          const heliMat = new THREE.MeshStandardMaterial({
            color: 0x1f3452,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.35,
          });
          const heliMesh = new THREE.Mesh(heliGeo, heliMat);
          heliMesh.position.y = crownY + 0.2;
          buildingGroup.add(heliMesh);
        } else {
          // Solar panel array roof
          const solarRoofGeo = new THREE.BoxGeometry(b.size3D.w * 0.85, 0.3, b.size3D.d * 0.85);
          const solarRoofMat = new THREE.MeshStandardMaterial({
            color: 0x071b30,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.25,
            metalness: 0.9,
          });
          const solarRoof = new THREE.Mesh(solarRoofGeo, solarRoofMat);
          solarRoof.position.y = crownY + 0.15;
          buildingGroup.add(solarRoof);
        }

        scene.add(buildingGroup);
        meshesMap.set(b.id, buildingGroup);
      });
      meshesMapRef.current = meshesMap;

      // 11. Futuristic Elevated Skybridges Connecting Adjacent Towers
      const skybridgePairs = [
        { b1: 'tower-apex', b2: 'tower-solaris', y: 22 },
        { b1: 'tower-quantum', b2: 'tower-cybernetics', y: 18 },
        { b1: 'tower-lumina', b2: 'tower-aegis', y: 15 },
      ];

      skybridgePairs.forEach((sp) => {
        const b1 = BUILDINGS.find((item) => item.id === sp.b1);
        const b2 = BUILDINGS.find((item) => item.id === sp.b2);
        if (b1 && b2) {
          const dx = b2.position3D.x - b1.position3D.x;
          const dz = b2.position3D.z - b1.position3D.z;
          const dist = Math.hypot(dx, dz);
          const angle = Math.atan2(dz, dx);
          const midX = (b1.position3D.x + b2.position3D.x) / 2;
          const midZ = (b1.position3D.z + b2.position3D.z) / 2;

          const bridgeTubeGeo = new THREE.BoxGeometry(dist - 8, 1.4, 2.4);
          const bridgeTubeMat = new THREE.MeshStandardMaterial({
            color: 0x15243a,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.3,
            metalness: 0.85,
            roughness: 0.2,
          });
          const bridgeTube = new THREE.Mesh(bridgeTubeGeo, bridgeTubeMat);
          bridgeTube.position.set(midX, sp.y, midZ);
          bridgeTube.rotation.y = -angle;
          scene.add(bridgeTube);
        }
      });

      // 12. Glowing Energy Conduits Group
      const conduitGroup = new THREE.Group();
      conduitGroupRef.current = conduitGroup;
      const conduitLines = [
        { from: [0, 0], to: [-38, 32] },
        { from: [0, 0], to: [42, 28] },
        { from: [0, 0], to: [-32, -35] },
        { from: [0, 0], to: [32, -32] },
        { from: [-38, 32], to: [-48, 42] },
        { from: [42, 28], to: [60, 36] },
      ];
      conduitLines.forEach((c) => {
        const pts = [
          new THREE.Vector3(c.from[0], 0.35, c.from[1]),
          new THREE.Vector3(c.to[0], 0.35, c.to[1]),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineDashedMaterial({
          color: 0x9b6dff,
          dashSize: 3,
          gapSize: 2,
          linewidth: 2,
        });
        const line = new THREE.Line(geo, mat);
        line.computeLineDistances();
        conduitGroup.add(line);
      });
      scene.add(conduitGroup);

      // 13. District AQI Heatmap Colored Discs
      const aqiGroup = new THREE.Group();
      aqiHeatmapGroupRef.current = aqiGroup;
      DISTRICTS.forEach((d) => {
        const aqiColor = d.avgAqi < 25 ? 0x39d98a : d.avgAqi < 40 ? 0x00e5ff : 0xffb84d;
        const discGeo = new THREE.CircleGeometry(30, 32);
        const discMat = new THREE.MeshBasicMaterial({
          color: aqiColor,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(d.coordinates.x, -0.06, d.coordinates.z);
        aqiGroup.add(disc);
      });
      scene.add(aqiGroup);

      // 14. Atmospheric Particulate Dust Floating Field
      const particleCount = 180;
      const particleGeo = new THREE.BufferGeometry();
      const particlePos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePos[i] = (Math.random() - 0.5) * 180;
        particlePos[i + 1] = Math.random() * 45 + 3;
        particlePos[i + 2] = (Math.random() - 0.5) * 180;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x00e5ff,
        size: 1.2,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const atmosphericParticles = new THREE.Points(particleGeo, particleMat);
      atmosphericParticlesRef.current = atmosphericParticles;
      scene.add(atmosphericParticles);

      // 15. Active Incident Vertical Hologram Light Pillars
      const incidentGroup = new THREE.Group();
      incidentBeaconsRef.current = incidentGroup;
      alerts
        .filter((a) => a.status === 'Active')
        .forEach((a) => {
          const b = BUILDINGS.find((item) => item.id === a.relatedBuildingId);
          const x = b ? b.position3D.x : a.districtId === 'neo-harbor' ? 45 : a.districtId === 'core-financial' ? 0 : -38;
          const z = b ? b.position3D.z : a.districtId === 'neo-harbor' ? 30 : a.districtId === 'core-financial' ? 0 : 35;
          const height = 95;

          // Vertical glowing cylinder beam
          const beamGeo = new THREE.CylinderGeometry(0.5, 2.6, height, 16);
          const beamMat = new THREE.MeshBasicMaterial({
            color: a.severity === 'Critical' ? 0xff5d73 : 0xffb84d,
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.set(x, height / 2, z);
          incidentGroup.add(beam);

          // Concentric ground radar ripple ring
          const ringGeo = new THREE.RingGeometry(2, 4.5, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: a.severity === 'Critical' ? 0xff5d73 : 0xffb84d,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(x, 0.45, z);
          ring.userData = { isRadarRing: true, baseRadius: 4.5 };
          incidentGroup.add(ring);
        });
      scene.add(incidentGroup);

      // 16. Animated Vehicles with Dual Headlights & Taillights
      const vehicleGroup = new THREE.Group();
      vehicleGroupRef.current = vehicleGroup;
      const vehicleCount = 42;
      const vehicles: { mesh: THREE.Group; axis: 'x' | 'z'; lane: number; speed: number; min: number; max: number }[] = [];

      for (let i = 0; i < vehicleCount; i++) {
        const vG = new THREE.Group();
        const vGeo = new THREE.BoxGeometry(1.6, 0.8, 3.2);
        const vMat = new THREE.MeshStandardMaterial({ color: 0x1e3654, metalness: 0.9, roughness: 0.2 });
        const vMesh = new THREE.Mesh(vGeo, vMat);
        vMesh.position.y = 0.4;
        vG.add(vMesh);

        // Headlights
        const hlGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hlL = new THREE.Mesh(hlGeo, hlMat);
        hlL.position.set(-0.55, 0.4, 1.6);
        const hlR = new THREE.Mesh(hlGeo, hlMat);
        hlR.position.set(0.55, 0.4, 1.6);
        vG.add(hlL, hlR);

        // Taillights
        const tlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
        const tlMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
        const tlL = new THREE.Mesh(tlGeo, tlMat);
        tlL.position.set(-0.55, 0.4, -1.6);
        const tlR = new THREE.Mesh(tlGeo, tlMat);
        tlR.position.set(0.55, 0.4, -1.6);
        vG.add(tlL, tlR);

        const isX = Math.random() > 0.5;
        const lane = (Math.round(Math.random() * 4) - 2) * 32 + (Math.random() > 0.5 ? 1.4 : -1.4);
        const speed = (0.32 + Math.random() * 0.38) * (Math.random() > 0.5 ? 1 : -1);

        if (isX) {
          vG.position.set((Math.random() - 0.5) * 160, 0, lane);
          vG.rotation.y = speed > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          vG.position.set(lane, 0, (Math.random() - 0.5) * 160);
          vG.rotation.y = speed > 0 ? 0 : Math.PI;
        }

        vehicleGroup.add(vG);
        vehicles.push({
          mesh: vG,
          axis: isX ? 'x' : 'z',
          lane,
          speed,
          min: -85,
          max: 85,
        });
      }
      scene.add(vehicleGroup);

      // 17. Raycaster for Hover and Click
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handlePointerDown = (e: PointerEvent) => {
        isMouseDownRef.current = true;
        isRightClickRef.current = e.button === 2 || e.shiftKey;
        mousePrevRef.current = { x: e.clientX, y: e.clientY };
      };

      const handlePointerMove = (e: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (isMouseDownRef.current) {
          const dx = e.clientX - mousePrevRef.current.x;
          const dy = e.clientY - mousePrevRef.current.y;
          mousePrevRef.current = { x: e.clientX, y: e.clientY };

          if (isRightClickRef.current) {
            // Pan camera target
            const factor = cameraAngleRef.current.radius * 0.0018;
            cameraTargetRef.current.x -= dx * factor * Math.cos(cameraAngleRef.current.theta);
            cameraTargetRef.current.z += dx * factor * Math.sin(cameraAngleRef.current.theta);
            cameraTargetRef.current.y += dy * factor;
          } else {
            // Orbit camera
            cameraAngleRef.current.theta -= dx * 0.008;
            cameraAngleRef.current.phi = Math.max(
              0.05,
              Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - dy * 0.008)
            );
          }
          updateCameraPosition();
        } else {
          // Hover Raycast
          raycaster.setFromCamera(mouse, camera);
          const allBuildingGroups = Array.from(meshesMap.values());
          const clickableChildren: THREE.Object3D[] = [];
          allBuildingGroups.forEach((g) => clickableChildren.push(...g.children));

          const intersects = raycaster.intersectObjects(clickableChildren, false);
          if (intersects.length > 0) {
            let parent = intersects[0].object.parent;
            while (parent && !parent.userData.buildingId && parent !== scene) {
              parent = parent.parent;
            }
            if (parent && parent.userData.buildingId) {
              const b = BUILDINGS.find((item) => item.id === parent!.userData.buildingId);
              if (b) {
                setHoveredBuilding({
                  building: b,
                  screenX: e.clientX,
                  screenY: e.clientY,
                });
                return;
              }
            }
          }
          setHoveredBuilding(null);
        }
      };

      const handlePointerUp = (e: PointerEvent) => {
        isMouseDownRef.current = false;
        const clickDist = Math.hypot(
          e.clientX - mousePrevRef.current.x,
          e.clientY - mousePrevRef.current.y
        );

        // Click selection
        if (clickDist < 5) {
          raycaster.setFromCamera(mouse, camera);
          const allBuildingGroups = Array.from(meshesMap.values());
          const clickableChildren: THREE.Object3D[] = [];
          allBuildingGroups.forEach((g) => clickableChildren.push(...g.children));

          const intersects = raycaster.intersectObjects(clickableChildren, false);
          if (intersects.length > 0) {
            let parent = intersects[0].object.parent;
            while (parent && !parent.userData.buildingId && parent !== scene) {
              parent = parent.parent;
            }
            if (parent && parent.userData.buildingId) {
              const b = BUILDINGS.find((item) => item.id === parent!.userData.buildingId);
              if (b) {
                setSelectedBuilding(b);
                setIsDetailsOpen(true);
                flyToBuilding(b);
              }
            }
          }
        }
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        cameraAngleRef.current.radius = Math.max(
          28,
          Math.min(270, cameraAngleRef.current.radius + e.deltaY * 0.12)
        );
        updateCameraPosition();
      };

      const domEl = renderer.domElement;
      domEl.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      domEl.addEventListener('wheel', handleWheel, { passive: false });
      domEl.addEventListener('contextmenu', (e) => e.preventDefault());

      // 18. Animation Loop
      let animId: number;
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Smooth camera lerp transition
        if (cameraLerpTargetRef.current) {
          const t = cameraLerpTargetRef.current;
          cameraAngleRef.current.theta += (t.theta - cameraAngleRef.current.theta) * 0.08;
          cameraAngleRef.current.phi += (t.phi - cameraAngleRef.current.phi) * 0.08;
          cameraAngleRef.current.radius += (t.radius - cameraAngleRef.current.radius) * 0.08;
          cameraTargetRef.current.x += (t.targetX - cameraTargetRef.current.x) * 0.08;
          cameraTargetRef.current.y += (t.targetY - cameraTargetRef.current.y) * 0.08;
          cameraTargetRef.current.z += (t.targetZ - cameraTargetRef.current.z) * 0.08;

          if (
            Math.abs(t.radius - cameraAngleRef.current.radius) < 0.5 &&
            Math.abs(t.theta - cameraAngleRef.current.theta) < 0.02
          ) {
            cameraLerpTargetRef.current = null;
          }
          updateCameraPosition();
        } else if (isAutoOrbit && !isMouseDownRef.current) {
          cameraAngleRef.current.theta += delta * 0.06;
          updateCameraPosition();
        }

        // Cycle intersection traffic lights
        trafficLightBulbs.forEach((tl) => {
          const cycle = (elapsed + tl.cycleOffset) % 10;
          if (cycle < 4.5) {
            // Green
            (tl.green.material as THREE.MeshBasicMaterial).color.set(0x39d98a);
            (tl.amber.material as THREE.MeshBasicMaterial).color.set(0x332500);
            (tl.red.material as THREE.MeshBasicMaterial).color.set(0x44050b);
          } else if (cycle < 6.0) {
            // Amber
            (tl.green.material as THREE.MeshBasicMaterial).color.set(0x053012);
            (tl.amber.material as THREE.MeshBasicMaterial).color.set(0xffb84d);
            (tl.red.material as THREE.MeshBasicMaterial).color.set(0x44050b);
          } else {
            // Red
            (tl.green.material as THREE.MeshBasicMaterial).color.set(0x053012);
            (tl.amber.material as THREE.MeshBasicMaterial).color.set(0x332500);
            (tl.red.material as THREE.MeshBasicMaterial).color.set(0xff3b5c);
          }
        });

        // Animate traffic vehicles
        if (layers.traffic && vehicleGroup) {
          vehicleGroup.visible = true;
          vehicles.forEach((v) => {
            const congestionFactor = Math.abs(v.lane) < 6 ? 0.35 : 1.0;
            if (v.axis === 'x') {
              v.mesh.position.x += v.speed * congestionFactor;
              if (v.mesh.position.x > v.max) v.mesh.position.x = v.min;
              if (v.mesh.position.x < v.min) v.mesh.position.x = v.max;
            } else {
              v.mesh.position.z += v.speed * congestionFactor;
              if (v.mesh.position.z > v.max) v.mesh.position.z = v.min;
              if (v.mesh.position.z < v.min) v.mesh.position.z = v.max;
            }
          });
        } else if (vehicleGroup) {
          vehicleGroup.visible = false;
        }

        // Incident radar rings animation
        if (incidentGroup && layers.incidents) {
          incidentGroup.visible = true;
          incidentGroup.children.forEach((child) => {
            if (child.userData.isRadarRing) {
              const scale = 1 + 0.5 * Math.sin(elapsed * 3.5);
              child.scale.set(scale, scale, 1);
            }
          });
        } else if (incidentGroup) {
          incidentGroup.visible = false;
        }

        // Conduits pulsing animation
        if (conduitGroup && layers.energy) {
          conduitGroup.visible = true;
        } else if (conduitGroup) {
          conduitGroup.visible = false;
        }

        // AQI Heatmap visibility
        if (aqiGroup && layers.airQuality) {
          aqiGroup.visible = true;
        } else if (aqiGroup) {
          aqiGroup.visible = false;
        }

        // Atmospheric particle dust drift
        if (atmosphericParticlesRef.current && layers.airQuality) {
          atmosphericParticlesRef.current.visible = true;
          atmosphericParticlesRef.current.rotation.y = elapsed * 0.03;
        } else if (atmosphericParticlesRef.current) {
          atmosphericParticlesRef.current.visible = false;
        }

        // Aircraft beacon lights blink
        const buildingGroups = Array.from(meshesMap.values());
        buildingGroups.forEach((g) => {
          g.children.forEach((c) => {
            if (c.userData.isBlinkingBeacon) {
              const bMat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
              bMat.color.set(Math.sin(elapsed * 5) > 0 ? 0xff3b5c : 0x22050b);
            }
          });
        });

        // Update 2D Screen District Labels
        if (container && cameraRef.current) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          const labels: DistrictLabel2D[] = DISTRICTS.map((d) => {
            const v = new THREE.Vector3(d.coordinates.x, 14, d.coordinates.z);
            v.project(cameraRef.current!);
            const isBehind = v.z > 1;
            const screenX = ((v.x + 1) * w) / 2;
            const screenY = ((-v.y + 1) * h) / 2;
            return {
              id: d.id,
              name: d.name,
              tagline: d.tagline,
              avgAqi: d.avgAqi,
              screenX,
              screenY,
              visible: !isBehind && screenX >= 20 && screenX <= w - 20 && screenY >= 40 && screenY <= h - 40,
            };
          });
          setDistrictLabels(labels);
        }

        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        domEl.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        domEl.removeEventListener('wheel', handleWheel);
        if (container.contains(domEl)) {
          container.removeChild(domEl);
        }
        renderer.dispose();
      };
    } catch (e) {
      console.error('WebGL error:', e);
      setWebGLError(true);
    }
  }, [isAutoOrbit, layers, alerts]);

  // Transform scene visually when layers or selected building change
  useEffect(() => {
    const meshesMap = meshesMapRef.current;
    if (!meshesMap) return;

    BUILDINGS.forEach((b) => {
      const g = meshesMap.get(b.id);
      if (!g) return;

      const isSelected = selectedBuilding?.id === b.id;
      const isHovered = hoveredBuilding?.building.id === b.id;

      let colorHex = b.colorHex;

      // 1. Building Health Layer Visual Transformation
      if (layers.buildingHealth) {
        if (b.maintenanceRiskScore >= 70) colorHex = '#FF5D73'; // Critical Red
        else if (b.maintenanceRiskScore >= 50) colorHex = '#FFB84D'; // Warning Amber
        else if (b.maintenanceRiskScore <= 20) colorHex = '#39D98A'; // Nominal Emerald
      }

      // 2. Energy Consumption Layer Visual Transformation
      if (layers.energy && !layers.buildingHealth) {
        if (b.energyUsageKwh > 4000) colorHex = '#9B6DFF'; // High energy surge violet
        else if (b.energyRating.includes('Net Zero')) colorHex = '#39D98A';
      }

      g.children.forEach((c) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
          if (isSelected) {
            c.material.color.set(0x00e5ff);
            c.material.emissive.set(0x00e5ff);
            c.material.emissiveIntensity = 0.85;
          } else if (isHovered) {
            c.material.color.set(0x00e5ff);
            c.material.emissive.set(0x00e5ff);
            c.material.emissiveIntensity = 0.55;
          } else {
            c.material.color.set(new THREE.Color(colorHex));
            c.material.emissive.set(new THREE.Color(colorHex));
            c.material.emissiveIntensity = 0.24;
          }
        }
      });

      if (isSelected) {
        g.scale.set(1.06, 1.03, 1.06);
      } else {
        g.scale.set(1, 1, 1);
      }
    });

    // Road Congestion Heatmap Visual Transformation
    roadMeshesRef.current.forEach((rm) => {
      const mat = rm.material as THREE.MeshStandardMaterial;
      if (layers.traffic) {
        if (rm.userData.congestion > 0.75) {
          mat.color.set(0x331018);
          mat.emissive.set(0xff5d73);
          mat.emissiveIntensity = 0.35;
        } else if (rm.userData.congestion > 0.5) {
          mat.color.set(0x281d0d);
          mat.emissive.set(0xffb84d);
          mat.emissiveIntensity = 0.25;
        } else {
          mat.color.set(0x0d1829);
          mat.emissive.set(0x00e5ff);
          mat.emissiveIntensity = 0.12;
        }
      } else {
        mat.color.set(0x0d1829);
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [selectedBuilding, hoveredBuilding, layers]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#23354D] bg-[#070B16] select-none shadow-2xl flex flex-col justify-between ${
        isHeroMode ? 'h-[750px] min-h-[620px]' : 'h-[calc(100vh-6.5rem)] min-h-[600px]'
      }`}
    >
      {/* 3D WebGL Canvas */}
      {webGLError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-xs text-[#8EA2BE]">
          <AlertTriangle className="w-10 h-10 text-[#FFB84D] mb-3" />
          <h3 className="text-base font-bold text-[#F3F7FF]">WebGL Hardware Acceleration Unavailable</h3>
          <p className="mt-1 max-w-md">
            The 3D city scene requires WebGL. All urban metrics, building telemetry, and scenario controls remain fully accessible via the Command Center and Building Intelligence.
          </p>
        </div>
      ) : (
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      )}

      {/* Floating 3D District Screen Labels */}
      {districtLabels.map(
        (dl) =>
          dl.visible && (
            <div
              key={dl.id}
              onClick={() => flyToDistrict(dl.id)}
              className="absolute pointer-events-auto z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: dl.screenX, top: dl.screenY }}
            >
              <div
                className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-[11px] font-mono transition-all duration-200 shadow-xl flex items-center gap-1.5 ${
                  selectedDistrict === dl.id
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] scale-105 shadow-[#00E5FF]/20 ring-1 ring-[#00E5FF]'
                    : 'bg-[#10182A]/80 border-[#23354D]/90 text-[#8EA2BE] hover:text-[#F3F7FF] hover:border-[#00E5FF]/60 hover:scale-105'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                <span className="font-semibold">{dl.name}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#070B16] text-[#39D98A]">
                  AQI {dl.avgAqi}
                </span>
              </div>
            </div>
          )
      )}

      {/* Floating Cursor Hover Tooltip */}
      {hoveredBuilding && (
        <div
          className="fixed pointer-events-none z-50 bg-[#10182A]/95 backdrop-blur-md border border-[#00E5FF]/60 px-3 py-2 rounded-lg shadow-2xl text-xs -translate-x-1/2 -translate-y-14 transition-all duration-75"
          style={{ left: hoveredBuilding.screenX, top: hoveredBuilding.screenY }}
        >
          <div className="flex items-center gap-1.5 font-bold text-[#F3F7FF]">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
            <span>{hoveredBuilding.building.name}</span>
          </div>
          <div className="text-[10px] text-[#8EA2BE] flex items-center gap-2 mt-0.5 font-mono">
            <span>{hoveredBuilding.building.type}</span>
            <span>·</span>
            <span>{hoveredBuilding.building.heightMeters}m</span>
            <span>·</span>
            <span
              className={
                hoveredBuilding.building.maintenanceRiskScore >= 60 ? 'text-[#FF5D73]' : 'text-[#39D98A]'
              }
            >
              Risk: {hoveredBuilding.building.maintenanceRiskScore}/100
            </span>
          </div>
        </div>
      )}

      {/* TOP FLOATING HUD BAR: District Navigator & Transforming Layers */}
      <div className="relative z-20 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* District Navigator Pill Bar */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#10182A]/85 backdrop-blur-md border border-[#23354D] p-1 rounded-xl shadow-xl">
          <div className="flex items-center gap-1.5 px-2 text-xs text-[#8EA2BE]">
            <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden md:inline font-mono text-[11px]">DISTRICT:</span>
          </div>
          <button
            onClick={() => flyToDistrict('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              selectedDistrict === 'all'
                ? 'bg-[#00E5FF] text-[#070B16] font-bold shadow-md'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A]'
            }`}
          >
            Metro
          </button>
          {DISTRICTS.map((d) => (
            <button
              key={d.id}
              onClick={() => flyToDistrict(d.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                selectedDistrict === d.id
                  ? 'bg-[#00E5FF] text-[#070B16] font-bold shadow-md'
                  : 'text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A]'
              }`}
            >
              {d.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* 5 Transforming Visual Layers Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#10182A]/85 backdrop-blur-md border border-[#23354D] p-1 rounded-xl shadow-xl">
          <span className="text-[11px] font-mono text-[#8EA2BE] px-2 hidden lg:inline flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#00E5FF]" /> VISUAL LAYERS:
          </span>

          {/* Traffic Layer */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, traffic: !prev.traffic }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              layers.traffic
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-sm'
                : 'bg-[#070B16]/70 text-[#8EA2BE] border-[#23354D] opacity-60'
            }`}
            title="Toggle Traffic flow, vehicle trails, and road congestion heatmap"
          >
            Traffic
          </button>

          {/* Energy Layer */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, energy: !prev.energy }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              layers.energy
                ? 'bg-[#9B6DFF]/20 text-[#9B6DFF] border-[#9B6DFF]/50 shadow-sm'
                : 'bg-[#070B16]/70 text-[#8EA2BE] border-[#23354D] opacity-60'
            }`}
            title="Toggle Energy conduits and facility consumption glow"
          >
            Energy
          </button>

          {/* Air Quality Layer */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, airQuality: !prev.airQuality }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              layers.airQuality
                ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/50 shadow-sm'
                : 'bg-[#070B16]/70 text-[#8EA2BE] border-[#23354D] opacity-60'
            }`}
            title="Toggle AQI atmospheric dispersion heatmap and particle field"
          >
            Air Quality
          </button>

          {/* Building Health Layer */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, buildingHealth: !prev.buildingHealth }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              layers.buildingHealth
                ? 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/50 shadow-sm'
                : 'bg-[#070B16]/70 text-[#8EA2BE] border-[#23354D] opacity-60'
            }`}
            title="Toggle Building structural & preventative risk coloring"
          >
            Building Risk
          </button>

          {/* Incidents Layer */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, incidents: !prev.incidents }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              layers.incidents
                ? 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/50 shadow-sm'
                : 'bg-[#070B16]/70 text-[#8EA2BE] border-[#23354D] opacity-60'
            }`}
            title="Toggle Vertical holographic emergency light pillars"
          >
            Incidents
          </button>
        </div>
      </div>

      {/* FLOATING LEFT HERO KPI CARDS (When isHeroMode is enabled) */}
      {isHeroMode && (
        <div className="absolute left-4 top-20 z-20 w-72 space-y-2 pointer-events-none hidden md:block">
          <div className="pointer-events-auto p-3 bg-[#10182A]/85 backdrop-blur-xl border border-[#23354D]/90 rounded-xl shadow-2xl hover:border-[#00E5FF]/40 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8EA2BE]">Mobility Flow</span>
              <span className="text-[#00E5FF] font-mono font-bold">64% Congestion</span>
            </div>
            <div className="w-full bg-[#070B16] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#FFB84D] h-full rounded-full" style={{ width: '64%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#8EA2BE] mt-1 font-mono">
              <span>Arterial Velocity: 44.2 km/h</span>
              <span className="text-[#39D98A]">+3.8 km/h</span>
            </div>
          </div>

          <div className="pointer-events-auto p-3 bg-[#10182A]/85 backdrop-blur-xl border border-[#23354D]/90 rounded-xl shadow-2xl hover:border-[#39D98A]/40 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8EA2BE]">Atmospheric AQI</span>
              <span className="text-[#39D98A] font-mono font-bold">34 AQI · Good</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#8EA2BE] mt-2 font-mono">
              <span>PM2.5: 8.4 µg/m³</span>
              <span className="text-[#39D98A]">-8.1% vs peak</span>
            </div>
          </div>

          <div className="pointer-events-auto p-3 bg-[#10182A]/85 backdrop-blur-xl border border-[#23354D]/90 rounded-xl shadow-2xl hover:border-[#9B6DFF]/40 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8EA2BE]">Clean Microgrid</span>
              <span className="text-[#9B6DFF] font-mono font-bold">48.2% Renewables</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#8EA2BE] mt-2 font-mono">
              <span>Demand: 708.5 MW</span>
              <span className="text-[#00E5FF]">Solar/Hydro Sync</span>
            </div>
          </div>

          <div className="pointer-events-auto p-3 bg-[#10182A]/85 backdrop-blur-xl border border-[#23354D]/90 rounded-xl shadow-2xl hover:border-[#FF5D73]/40 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8EA2BE]">Active Incidents</span>
              <span className="text-[#FF5D73] font-mono font-bold">3 Operational</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#8EA2BE] mt-2 font-mono">
              <span>1 Critical · 2 Warning</span>
              <span className="text-[#FF5D73]">Pillars Active</span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING RIGHT-SIDE DETAILS DRAWER / DOSSIER */}
      {selectedBuilding && isDetailsOpen && (
        <div className="absolute right-4 top-20 bottom-16 z-30 w-80 sm:w-96 bg-[#10182A]/90 backdrop-blur-xl border border-[#23354D] rounded-2xl p-4 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#23354D] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                  {selectedBuilding.type}
                </span>
                <h3 className="text-base font-bold text-[#F3F7FF] mt-1.5 leading-snug">
                  {selectedBuilding.name}
                </h3>
                <p className="text-[11px] text-[#8EA2BE]">
                  {selectedBuilding.districtName} Sector · Asset #{selectedBuilding.id.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-1.5 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A] rounded-lg transition-colors"
                title="Minimize dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#8EA2BE] leading-relaxed">
              {selectedBuilding.description}
            </p>

            {/* 4 Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#070B16]/80 border border-[#23354D]">
                <div className="text-[10px] text-[#8EA2BE] flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#00E5FF]" /> Height & Floors
                </div>
                <div className="text-sm font-bold font-mono text-[#F3F7FF] mt-1">
                  {selectedBuilding.heightMeters} m
                </div>
                <div className="text-[10px] text-[#8EA2BE]">
                  {selectedBuilding.floors} Physical Levels
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B16]/80 border border-[#23354D]">
                <div className="text-[10px] text-[#8EA2BE] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#9B6DFF]" /> Power Draw
                </div>
                <div className="text-sm font-bold font-mono text-[#F3F7FF] mt-1">
                  {selectedBuilding.energyUsageKwh.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#39D98A]">
                  kWh · Rating {selectedBuilding.energyRating}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B16]/80 border border-[#23354D]">
                <div className="text-[10px] text-[#8EA2BE] flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#39D98A]" /> Occupancy
                </div>
                <div className="text-sm font-bold font-mono text-[#F3F7FF] mt-1">
                  {selectedBuilding.occupancyEstimate}%
                </div>
                <div className="text-[10px] text-[#8EA2BE]">
                  ~{selectedBuilding.occupancyCount.toLocaleString()} occupants
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B16]/80 border border-[#23354D]">
                <div className="text-[10px] text-[#8EA2BE] flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-[#FF5D73]" /> Maint. Vulnerability
                </div>
                <div
                  className={`text-sm font-bold font-mono mt-1 ${
                    selectedBuilding.maintenanceRiskScore >= 70
                      ? 'text-[#FF5D73]'
                      : selectedBuilding.maintenanceRiskScore >= 40
                      ? 'text-[#FFB84D]'
                      : 'text-[#39D98A]'
                  }`}
                >
                  {selectedBuilding.maintenanceRiskScore}/100
                </div>
                <div className="text-[10px] text-[#8EA2BE]">
                  Status: {selectedBuilding.status}
                </div>
              </div>
            </div>

            {/* Smart Subsystems */}
            <div className="p-2.5 bg-[#070B16]/80 rounded-xl border border-[#23354D] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#8EA2BE]">
                <span>Photovoltaic Solar Array:</span>
                <span className="font-mono text-[#00E5FF]">{selectedBuilding.solarCapacityKw} kW</span>
              </div>
              <div className="flex justify-between text-[#8EA2BE]">
                <span>Emergency Backup:</span>
                <span className="font-mono text-[#F3F7FF] text-[11px] truncate max-w-[160px]">
                  {selectedBuilding.backupPower}
                </span>
              </div>
              <div className="flex justify-between text-[#8EA2BE]">
                <span>HVAC Efficiency:</span>
                <span className="font-mono text-[#39D98A]">{selectedBuilding.hvacEfficiency}% Optimal</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-[#23354D]">
            <button
              onClick={() => onNavigate('buildings', selectedBuilding.id)}
              className="w-full py-2.5 px-3 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#00E5FF]/20"
            >
              <span>Inspect Full Building Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Button to reopen details if closed */}
      {selectedBuilding && !isDetailsOpen && (
        <button
          onClick={() => setIsDetailsOpen(true)}
          className="absolute right-4 top-20 z-20 px-3 py-2 bg-[#10182A]/90 backdrop-blur-md border border-[#00E5FF]/40 text-[#00E5FF] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl hover:bg-[#15243A] transition-all"
        >
          <Building2 className="w-4 h-4" />
          <span>{selectedBuilding.name}</span>
        </button>
      )}

      {/* BOTTOM FLOATING CONTROLS: Camera Presets & Dynamic Interactive Legend */}
      <div className="relative z-20 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Camera Presets & Orbit Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#10182A]/85 backdrop-blur-md border border-[#23354D] p-1 rounded-xl shadow-xl">
          <div className="flex items-center gap-1.5 px-2 text-xs text-[#8EA2BE]">
            <Camera className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden md:inline font-mono text-[11px]">CAMERA:</span>
          </div>

          <button
            onClick={() => applyCameraPreset('isometric')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              activePreset === 'isometric'
                ? 'bg-[#15243A] text-[#00E5FF] border border-[#23354D]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => applyCameraPreset('street')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              activePreset === 'street'
                ? 'bg-[#15243A] text-[#00E5FF] border border-[#23354D]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Street View
          </button>
          <button
            onClick={() => applyCameraPreset('topdown')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              activePreset === 'topdown'
                ? 'bg-[#15243A] text-[#00E5FF] border border-[#23354D]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Radar 2D
          </button>
          <button
            onClick={() => applyCameraPreset('cinematic')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              activePreset === 'cinematic'
                ? 'bg-[#15243A] text-[#00E5FF] border border-[#23354D]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Cinematic
          </button>

          <div className="w-[1px] h-4 bg-[#23354D] mx-1" />

          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className="p-1.5 text-[#8EA2BE] hover:text-[#00E5FF] rounded transition-colors"
            title={isAutoOrbit ? 'Pause Auto Orbit' : 'Resume Auto Orbit'}
          >
            {isAutoOrbit ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => applyCameraPreset('isometric')}
            className="p-1.5 text-[#8EA2BE] hover:text-[#00E5FF] rounded transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Interactive Layer Legend */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0B1120]/85 backdrop-blur-md border border-[#23354D] px-3.5 py-1.5 rounded-xl text-xs text-[#8EA2BE] shadow-xl">
          {layers.traffic && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
              <span>Vehicles & Heatmap</span>
            </div>
          )}
          {layers.energy && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#9B6DFF]" />
              <span>Power Conduits</span>
            </div>
          )}
          {layers.airQuality && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#39D98A]" />
              <span>Atmospheric AQI</span>
            </div>
          )}
          {layers.buildingHealth && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFB84D]" />
              <span>Health Diagnostics</span>
            </div>
          )}
          {layers.incidents && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5D73]" />
              <span>Pillars & Beacons</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
