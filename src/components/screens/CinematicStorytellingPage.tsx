import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Compass,
  Navigation,
  Wind,
  Zap,
  ShieldAlert,
  Building2,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Camera,
  Play,
  Pause,
  Layers,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  ExternalLink,
  CheckCircle2,
  Eye,
  Radio,
} from 'lucide-react';
import { DistrictId, ScreenId, Building, Alert } from '../../types';
import { BUILDINGS, DISTRICTS } from '../../data/mockData';

interface CinematicStorytellingPageProps {
  onEnterCommandCenter: () => void;
  onNavigateScreen: (screen: ScreenId, entityId?: string) => void;
  alerts: Alert[];
}

type ChapterId = 'awakens' | 'twin' | 'mobility' | 'energy' | 'predictive' | 'command';

interface ChapterMeta {
  id: ChapterId;
  number: string;
  title: string;
  subtitle: string;
  camera: {
    theta: number;
    phi: number;
    radius: number;
    targetX: number;
    targetY: number;
    targetZ: number;
  };
  defaultLayers: {
    traffic: boolean;
    energy: boolean;
    airQuality: boolean;
    buildingHealth: boolean;
    incidents: boolean;
  };
}

const CHAPTERS: ChapterMeta[] = [
  {
    id: 'awakens',
    number: '01',
    title: 'The City Awakens',
    subtitle: 'Autonomous Synchronized Infrastructure',
    camera: { theta: 0.85, phi: 0.72, radius: 155, targetX: 0, targetY: 10, targetZ: 0 },
    defaultLayers: { traffic: true, energy: true, airQuality: false, buildingHealth: false, incidents: false },
  },
  {
    id: 'twin',
    number: '02',
    title: 'One Living Digital Twin',
    subtitle: 'Spatial Topology & 5 Urban Sectors',
    camera: { theta: 0.65, phi: 0.58, radius: 110, targetX: 15, targetY: 12, targetZ: 10 },
    defaultLayers: { traffic: true, energy: true, airQuality: true, buildingHealth: false, incidents: false },
  },
  {
    id: 'mobility',
    number: '03',
    title: 'Intelligent Mobility',
    subtitle: 'Arterial Corridor Speeds & Adaptive Flow',
    camera: { theta: 1.15, phi: 0.24, radius: 72, targetX: 0, targetY: 8, targetZ: 0 },
    defaultLayers: { traffic: true, energy: false, airQuality: false, buildingHealth: false, incidents: false },
  },
  {
    id: 'energy',
    number: '04',
    title: 'Cleaner Energy and Air',
    subtitle: 'Photovoltaic Microgrids & Atmospheric AQI',
    camera: { theta: 0.45, phi: 0.48, radius: 95, targetX: 30, targetY: 10, targetZ: -15 },
    defaultLayers: { traffic: false, energy: true, airQuality: true, buildingHealth: false, incidents: false },
  },
  {
    id: 'predictive',
    number: '05',
    title: 'Predictive Intelligence',
    subtitle: 'Multi-Horizon Risk Models & Mitigations',
    camera: { theta: 0.95, phi: 0.42, radius: 78, targetX: -20, targetY: 14, targetZ: 20 },
    defaultLayers: { traffic: false, energy: false, airQuality: false, buildingHealth: true, incidents: true },
  },
  {
    id: 'command',
    number: '06',
    title: 'Enter NEXUS Command',
    subtitle: 'Full Decision Support & Operational Suites',
    camera: { theta: 0.85, phi: 0.65, radius: 135, targetX: 0, targetY: 10, targetZ: 0 },
    defaultLayers: { traffic: true, energy: true, airQuality: true, buildingHealth: true, incidents: true },
  },
];

export const CinematicStorytellingPage: React.FC<CinematicStorytellingPageProps> = ({
  onEnterCommandCenter,
  onNavigateScreen,
  alerts,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isFreeLookMode, setIsFreeLookMode] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<{ building: Building; x: number; y: number } | null>(null);

  // 5 Transforming Visual Layers
  const [layers, setLayers] = useState({
    traffic: true,
    energy: true,
    airQuality: true,
    buildingHealth: false,
    incidents: false,
  });

  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(true);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('all');
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'street' | 'topdown'>('isometric');

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
  const cameraAngleRef = useRef({ theta: 0.85, phi: 0.72, radius: 155 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 0));
  const cameraLerpTargetRef = useRef<{ theta: number; phi: number; radius: number; targetX: number; targetY: number; targetZ: number } | null>(null);
  const mouseParallaxRef = useRef({ x: 0, y: 0 });

  // Procedural Window Canvas Texture
  const windowTextureRef = useRef<THREE.CanvasTexture | null>(null);

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
          if (rand < 0.6) ctx.fillStyle = '#37d7ff'; // Cyan
          else if (rand < 0.82) ctx.fillStyle = '#9b7bff'; // Violet
          else ctx.fillStyle = '#f3f7ff'; // Warm white
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

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const target = cameraTargetRef.current;
    const px = mouseParallaxRef.current.x * (isFreeLookMode ? 0 : 3.5);
    const py = mouseParallaxRef.current.y * (isFreeLookMode ? 0 : 2.5);

    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta) + px;
    cameraRef.current.position.y = target.y + radius * Math.cos(phi) + py;
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  // Fly camera to a specific chapter configuration
  const goToChapter = (index: number) => {
    const ch = CHAPTERS[index];
    if (!ch) return;
    setActiveChapterIndex(index);
    setIsFreeLookMode(false);
    setIsAutoOrbit(index === 0);
    setLayers(ch.defaultLayers);
    cameraLerpTargetRef.current = {
      theta: ch.camera.theta,
      phi: ch.camera.phi,
      radius: ch.camera.radius,
      targetX: ch.camera.targetX,
      targetY: ch.camera.targetY,
      targetZ: ch.camera.targetZ,
    };
  };

  // Switch camera presets in Free Look mode
  const applyPreset = (preset: 'isometric' | 'street' | 'topdown') => {
    setCameraPreset(preset);
    setIsAutoOrbit(false);
    if (preset === 'isometric') {
      cameraLerpTargetRef.current = { theta: 0.85, phi: 0.65, radius: 135, targetX: 0, targetY: 10, targetZ: 0 };
    } else if (preset === 'street') {
      cameraLerpTargetRef.current = { theta: 1.15, phi: 0.22, radius: 78, targetX: 0, targetY: 10, targetZ: 0 };
    } else if (preset === 'topdown') {
      cameraLerpTargetRef.current = { theta: 0.01, phi: 0.05, radius: 175, targetX: 0, targetY: 0, targetZ: 0 };
    }
  };

  // Smooth camera fly-to building
  const flyToBuilding = (b: Building) => {
    setIsFreeLookMode(true);
    setIsAutoOrbit(false);
    setSelectedBuilding(b);
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
    setSelectedDistrict(distId);
    setIsFreeLookMode(true);
    setIsAutoOrbit(false);
    if (distId === 'all') {
      cameraLerpTargetRef.current = { theta: 0.85, phi: 0.65, radius: 135, targetX: 0, targetY: 10, targetZ: 0 };
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

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

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

    // Suspension Bridge to Harbor
    const bridgeGroup = new THREE.Group();
    const bridgeDeckGeo = new THREE.BoxGeometry(48, 0.8, 6.5);
    const bridgeDeckMat = new THREE.MeshStandardMaterial({ color: 0x1a2e47, metalness: 0.85 });
    const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, bridgeDeckMat);
    bridgeDeck.position.set(24, 2.5, 26);
    bridgeGroup.add(bridgeDeck);

    const pylonGeo = new THREE.CylinderGeometry(0.8, 1.5, 24, 8);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.35 });
    const pylon1 = new THREE.Mesh(pylonGeo, pylonMat);
    pylon1.position.set(13, 12, 26);
    const pylon2 = new THREE.Mesh(pylonGeo, pylonMat);
    pylon2.position.set(35, 12, 26);
    bridgeGroup.add(pylon1, pylon2);

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

    // 8. Road Network & Heatmap Surfaces
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

      const roadSurfaceGeo = new THREE.PlaneGeometry(len, r.w);
      const roadSurfaceMat = new THREE.MeshStandardMaterial({
        color: 0x0d1829,
        roughness: 0.75,
        metalness: 0.35,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.08,
      });
      const roadMesh = new THREE.Mesh(roadSurfaceGeo, roadSurfaceMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = angle;
      roadMesh.position.set(midX, -0.08, midZ);
      roadMesh.userData = { isArterial: r.isArterial, congestion: r.congestion };
      roadGroup.add(roadMesh);
      roadMeshes.push(roadMesh);

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

    // 9. Intersection Traffic Lights
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

      const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const redMesh = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xff3b5c }));
      redMesh.position.set(ic.x + 4.2, 6.1, ic.z + 4.5);
      scene.add(redMesh);

      const amberMesh = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0x332500 }));
      amberMesh.position.set(ic.x + 4.2, 5.5, ic.z + 4.5);
      scene.add(amberMesh);

      const greenMesh = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0x004411 }));
      greenMesh.position.set(ic.x + 4.2, 4.9, ic.z + 4.5);
      scene.add(greenMesh);

      trafficLightBulbs.push({ red: redMesh, amber: amberMesh, green: greenMesh, cycleOffset: ic.offset });
    });
    trafficLightBulbsRef.current = trafficLightBulbs;

    // 10. Multi-Tier Procedural Skyscrapers
    const meshesMap = new Map<string, THREE.Group>();
    const windowTex = getOrCreateWindowTexture();

    BUILDINGS.forEach((b) => {
      const buildingGroup = new THREE.Group();
      buildingGroup.userData = { buildingId: b.id };
      buildingGroup.position.set(b.position3D.x, 0, b.position3D.z);

      let accentColorHex = b.colorHex;
      if (b.maintenanceRiskScore >= 70) accentColorHex = '#FF5D73';
      else if (b.maintenanceRiskScore >= 50) accentColorHex = '#FFB84D';

      const podiumHeight = Math.max(3, b.size3D.h * 0.18);
      const podiumW = b.size3D.w * 1.15;
      const podiumD = b.size3D.d * 1.15;

      const podiumGeo = new THREE.BoxGeometry(podiumW, podiumHeight, podiumD);
      const podiumMat = new THREE.MeshStandardMaterial({
        color: 0x111c2e,
        roughness: 0.45,
        metalness: 0.8,
      });
      const podiumMesh = new THREE.Mesh(podiumGeo, podiumMat);
      podiumMesh.position.y = podiumHeight / 2;
      buildingGroup.add(podiumMesh);

      const towerHeight = b.size3D.h * 0.72;
      let towerGeo: THREE.BufferGeometry;

      if (b.type === 'Research & AI' || b.type === 'Data Center') {
        towerGeo = new THREE.CylinderGeometry(b.size3D.w * 0.52, b.size3D.w * 0.52, towerHeight, 16);
      } else if (b.type === 'Transit Hub') {
        towerGeo = new THREE.BoxGeometry(b.size3D.w * 1.05, towerHeight, b.size3D.d * 0.95);
      } else {
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
      const towerMesh = new THREE.Mesh(towerGeo, towerMat);
      towerMesh.position.y = podiumHeight + towerHeight / 2;
      buildingGroup.add(towerMesh);

      const edges = new THREE.EdgesGeometry(towerGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.38,
      });
      const wireframe = new THREE.LineSegments(edges, wireMat);
      wireframe.position.copy(towerMesh.position);
      buildingGroup.add(wireframe);

      const crownY = podiumHeight + towerHeight;
      if (b.floors > 60) {
        const spireGeo = new THREE.ConeGeometry(b.size3D.w * 0.45, b.size3D.h * 0.16, 6);
        const spireMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9 });
        const spireMesh = new THREE.Mesh(spireGeo, spireMat);
        spireMesh.position.y = crownY + (b.size3D.h * 0.16) / 2;
        buildingGroup.add(spireMesh);

        const beaconGeo = new THREE.SphereGeometry(0.7, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = crownY + b.size3D.h * 0.16 + 0.8;
        beacon.userData = { isBlinkingBeacon: true };
        buildingGroup.add(beacon);
      } else if (b.type === 'Hospital' || b.type === 'Commercial') {
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

    // 11. Elevated Skybridges
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

    // 12. Glowing Energy Conduits
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

    // 13. District AQI Heatmap Discs
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

    // 14. Atmospheric Particulate Dust Particles
    const particleCount = 200;
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

    // 15. Active Incident Hologram Pillars
    const incidentGroup = new THREE.Group();
    incidentBeaconsRef.current = incidentGroup;
    alerts
      .filter((a) => a.status === 'Active')
      .forEach((a) => {
        const b = BUILDINGS.find((item) => item.id === a.relatedBuildingId);
        const x = b ? b.position3D.x : a.districtId === 'neo-harbor' ? 45 : a.districtId === 'core-financial' ? 0 : -38;
        const z = b ? b.position3D.z : a.districtId === 'neo-harbor' ? 30 : a.districtId === 'core-financial' ? 0 : 35;
        const height = 95;

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
        ring.userData = { isRadarRing: true };
        incidentGroup.add(ring);
      });
    scene.add(incidentGroup);

    // 16. Animated Vehicles
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

      const hlGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hlL = new THREE.Mesh(hlGeo, hlMat);
      hlL.position.set(-0.55, 0.4, 1.6);
      const hlR = new THREE.Mesh(hlGeo, hlMat);
      hlR.position.set(0.55, 0.4, 1.6);
      vG.add(hlL, hlR);

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
      vehicles.push({ mesh: vG, axis: isX ? 'x' : 'z', lane, speed, min: -85, max: 85 });
    }
    scene.add(vehicleGroup);

    // 17. Raycaster for Hover & Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isMouseDownRef.current = true;
      isRightClickRef.current = e.button === 2 || e.shiftKey;
      mousePrevRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Slow mouse parallax
      mouseParallaxRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isMouseDownRef.current) {
        setIsFreeLookMode(true);
        const dx = e.clientX - mousePrevRef.current.x;
        const dy = e.clientY - mousePrevRef.current.y;
        mousePrevRef.current = { x: e.clientX, y: e.clientY };

        if (isRightClickRef.current) {
          const factor = cameraAngleRef.current.radius * 0.0018;
          cameraTargetRef.current.x -= dx * factor * Math.cos(cameraAngleRef.current.theta);
          cameraTargetRef.current.z += dx * factor * Math.sin(cameraAngleRef.current.theta);
          cameraTargetRef.current.y += dy * factor;
        } else {
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
              setHoveredBuilding({ building: b, x: e.clientX, y: e.clientY });
              return;
            }
          }
        }
        setHoveredBuilding(null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isMouseDownRef.current = false;
      const clickDist = Math.hypot(e.clientX - mousePrevRef.current.x, e.clientY - mousePrevRef.current.y);

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
              flyToBuilding(b);
            }
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setIsFreeLookMode(true);
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

      // Camera lerp transition
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
        cameraAngleRef.current.theta += delta * 0.05;
        updateCameraPosition();
      } else {
        updateCameraPosition();
      }

      // Cycle traffic lights
      trafficLightBulbs.forEach((tl) => {
        const cycle = (elapsed + tl.cycleOffset) % 10;
        if (cycle < 4.5) {
          (tl.green.material as THREE.MeshBasicMaterial).color.set(0x39d98a);
          (tl.amber.material as THREE.MeshBasicMaterial).color.set(0x332500);
          (tl.red.material as THREE.MeshBasicMaterial).color.set(0x44050b);
        } else if (cycle < 6.0) {
          (tl.green.material as THREE.MeshBasicMaterial).color.set(0x053012);
          (tl.amber.material as THREE.MeshBasicMaterial).color.set(0xffb84d);
          (tl.red.material as THREE.MeshBasicMaterial).color.set(0x44050b);
        } else {
          (tl.green.material as THREE.MeshBasicMaterial).color.set(0x053012);
          (tl.amber.material as THREE.MeshBasicMaterial).color.set(0x332500);
          (tl.red.material as THREE.MeshBasicMaterial).color.set(0xff3b5c);
        }
      });

      // Animate vehicles
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

      // Animate incident radar rings
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

      // Energy conduits visibility
      if (conduitGroup) {
        conduitGroup.visible = layers.energy;
      }

      // AQI Heatmap visibility
      if (aqiGroup) {
        aqiGroup.visible = layers.airQuality;
      }

      // Atmospheric particle dust drift
      if (atmosphericParticlesRef.current) {
        atmosphericParticlesRef.current.visible = layers.airQuality;
        atmosphericParticlesRef.current.rotation.y = elapsed * 0.03;
      }

      // Aircraft beacons blink
      const buildingGroups = Array.from(meshesMap.values());
      buildingGroups.forEach((g) => {
        g.children.forEach((c) => {
          if (c.userData.isBlinkingBeacon) {
            const bMat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
            bMat.color.set(Math.sin(elapsed * 5) > 0 ? 0xff3b5c : 0x22050b);
          }
        });
      });

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
  }, [isAutoOrbit, isFreeLookMode, layers, alerts]);

  // Visual transformation on layer toggle or selection
  useEffect(() => {
    const meshesMap = meshesMapRef.current;
    if (!meshesMap) return;

    BUILDINGS.forEach((b) => {
      const g = meshesMap.get(b.id);
      if (!g) return;

      const isSelected = selectedBuilding?.id === b.id;
      const isHovered = hoveredBuilding?.building.id === b.id;

      let colorHex = b.colorHex;

      if (layers.buildingHealth) {
        if (b.maintenanceRiskScore >= 70) colorHex = '#FF5D73';
        else if (b.maintenanceRiskScore >= 50) colorHex = '#FFB84D';
        else if (b.maintenanceRiskScore <= 20) colorHex = '#39D98A';
      } else if (layers.energy) {
        if (b.energyUsageKwh > 4000) colorHex = '#9B6DFF';
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

    // Road Congestion Heatmap
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

  const activeChapter = CHAPTERS[activeChapterIndex];

  return (
    <div className="relative w-full min-h-screen bg-[#070B16] text-[#F3F7FF] select-none overflow-x-hidden">
      {/* 1. Full-Viewport 3D Three.js Canvas */}
      <div
        ref={mountRef}
        className={`fixed inset-0 z-0 ${
          isFreeLookMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      />

      {/* Floating Cursor Hover Tooltip */}
      {hoveredBuilding && (
        <div
          className="fixed pointer-events-none z-50 bg-[#10182A]/95 backdrop-blur-md border border-[#00E5FF]/60 px-3 py-2 rounded-lg shadow-2xl text-xs -translate-x-1/2 -translate-y-14 transition-all duration-75"
          style={{ left: hoveredBuilding.x, top: hoveredBuilding.y }}
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

      {/* 2. Top Glass Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-20 px-4 md:px-8 flex items-center justify-between pointer-events-none">
        {/* Brand Logo */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF] via-[#4D7CFE] to-[#9B6DFF] p-[1px] flex items-center justify-center shadow-lg shadow-[#00E5FF]/20">
            <div className="w-full h-full bg-[#070B16] rounded-[11px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00E5FF]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-[#F3F7FF] font-mono">
                NEXUS
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#00E5FF] px-1.5 py-0.5 bg-[#00E5FF]/10 rounded border border-[#00E5FF]/30">
                AI-TWIN 3D
              </span>
            </div>
            <div className="text-[10px] text-[#8EA2BE] tracking-tight">
              SMART CITY INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Center Chapter Indicator Pill */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-[#10182A]/80 backdrop-blur-xl border border-[#23354D] px-4 py-1.5 rounded-full shadow-2xl text-xs">
          <span className="font-mono text-[#00E5FF] font-bold">
            {activeChapter.number}
          </span>
          <span className="text-[#8EA2BE]">/</span>
          <span className="text-[#F3F7FF] font-medium">{activeChapter.title}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A] ml-1 animate-pulse" />
        </div>

        {/* Right CTA to Command Center */}
        <div className="pointer-events-auto flex items-center gap-3">
          {isFreeLookMode ? (
            <button
              onClick={() => goToChapter(activeChapterIndex)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#15243A]/90 hover:bg-[#1f3656] border border-[#00E5FF]/40 text-[#00E5FF] rounded-xl text-xs font-semibold transition-all shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Story Track</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsFreeLookMode(true);
                setIsAutoOrbit(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#10182A]/80 hover:bg-[#15243A] border border-[#23354D] text-[#8EA2BE] hover:text-[#F3F7FF] rounded-xl text-xs font-semibold transition-all shadow-lg"
            >
              <Eye className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Free Look 3D</span>
            </button>
          )}

          <button
            onClick={onEnterCommandCenter}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00E5FF] to-[#4D7CFE] hover:from-[#28bade] hover:to-[#3b66d9] text-[#070B16] rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#00E5FF]/20"
          >
            <span>ENTER COMMAND CENTER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Right Chapter Progress Navigation Rail */}
      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 pointer-events-auto">
        {CHAPTERS.map((ch, idx) => {
          const isActive = activeChapterIndex === idx;
          return (
            <button
              key={ch.id}
              onClick={() => goToChapter(idx)}
              className="flex items-center gap-3 group text-right justify-end"
              title={`${ch.number} · ${ch.title}`}
            >
              <span
                className={`hidden lg:inline text-[11px] font-mono transition-all opacity-0 group-hover:opacity-100 ${
                  isActive ? 'text-[#00E5FF] opacity-100 font-bold' : 'text-[#8EA2BE]'
                }`}
              >
                {ch.title}
              </span>
              <div
                className={`w-3 h-3 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'border-[#00E5FF] bg-[#00E5FF] scale-125 shadow-lg shadow-[#00E5FF]/50 ring-4 ring-[#00E5FF]/20'
                    : 'border-[#23354D] bg-[#10182A] group-hover:border-[#00E5FF]/60'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* 4. Left Floating Interactive Layer Controls */}
      <div className="fixed left-4 md:left-8 top-28 z-30 pointer-events-auto">
        <div className="p-1.5 bg-[#10182A]/85 backdrop-blur-xl border border-[#23354D] rounded-2xl shadow-2xl flex flex-col gap-1.5">
          <div className="px-2.5 py-1 text-[10px] font-mono text-[#8EA2BE] flex items-center gap-1.5 border-b border-[#23354D]/60">
            <Layers className="w-3 h-3 text-[#00E5FF]" />
            <span>3D LAYERS</span>
          </div>

          <button
            onClick={() => setLayers((p) => ({ ...p, traffic: !p.traffic }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              layers.traffic
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-sm'
                : 'text-[#8EA2BE] border-transparent hover:bg-[#15243A]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Traffic</span>
          </button>

          <button
            onClick={() => setLayers((p) => ({ ...p, energy: !p.energy }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              layers.energy
                ? 'bg-[#9B6DFF]/20 text-[#9B6DFF] border-[#9B6DFF]/50 shadow-sm'
                : 'text-[#8EA2BE] border-transparent hover:bg-[#15243A]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Energy Grid</span>
          </button>

          <button
            onClick={() => setLayers((p) => ({ ...p, airQuality: !p.airQuality }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              layers.airQuality
                ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/50 shadow-sm'
                : 'text-[#8EA2BE] border-transparent hover:bg-[#15243A]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Air Quality</span>
          </button>

          <button
            onClick={() => setLayers((p) => ({ ...p, buildingHealth: !p.buildingHealth }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              layers.buildingHealth
                ? 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/50 shadow-sm'
                : 'text-[#8EA2BE] border-transparent hover:bg-[#15243A]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Building Risk</span>
          </button>

          <button
            onClick={() => setLayers((p) => ({ ...p, incidents: !p.incidents }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              layers.incidents
                ? 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/50 shadow-sm'
                : 'text-[#8EA2BE] border-transparent hover:bg-[#15243A]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Incidents</span>
          </button>
        </div>
      </div>

      {/* 5. Main Storytelling Narrative Panels (Aligned Left / Center) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-32 pointer-events-none">
        {/* CHAPTER 1 — THE CITY AWAKENS (Full Screen Hero) */}
        {activeChapterIndex === 0 && (
          <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center max-w-3xl pointer-events-auto space-y-6 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10182A]/90 backdrop-blur-xl border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-mono shadow-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              <span>SPATIAL DIGITAL TWIN · NIGHT TELEMETRY ONLINE</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F3F7FF] uppercase font-mono leading-[1.05]">
                SEE THE CITY.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#4D7CFE] to-[#9B6DFF]">
                  PREDICT THE RISKS.
                </span>
                <br />
                SIMULATE THE FUTURE.
              </h1>
              <p className="text-base sm:text-lg text-[#8EA2BE] max-w-xl font-normal leading-relaxed pt-2">
                An intelligent digital twin for a smarter, safer, more sustainable urban future.
              </p>
            </div>

            {/* Two Required Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => goToChapter(1)}
                className="px-7 py-3.5 bg-gradient-to-r from-[#00E5FF] to-[#4D7CFE] hover:from-[#28bade] hover:to-[#3b66d9] text-[#070B16] font-bold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-xl shadow-[#00E5FF]/25 hover:scale-105"
              >
                <span>EXPLORE THE CITY</span>
                <Compass className="w-4 h-4" />
              </button>

              <button
                onClick={onEnterCommandCenter}
                className="px-7 py-3.5 bg-[#10182A]/90 hover:bg-[#15243A] text-[#F3F7FF] border border-[#23354D] hover:border-[#00E5FF]/60 font-semibold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-xl hover:scale-105"
              >
                <span>ENTER COMMAND CENTER</span>
                <ArrowRight className="w-4 h-4 text-[#00E5FF]" />
              </button>
            </div>

            {/* Micro Telemetry Bar */}
            <div className="pt-8 flex flex-wrap items-center gap-6 text-xs font-mono text-[#8EA2BE] border-t border-[#23354D]/50">
              <div>
                <span className="text-[#8EA2BE] block text-[10px]">CONNECTED ASSETS</span>
                <span className="text-[#F3F7FF] text-sm font-bold">24 LANDMARKS</span>
              </div>
              <div className="w-[1px] h-6 bg-[#23354D]" />
              <div>
                <span className="text-[#8EA2BE] block text-[10px]">MUNICIPAL SECTORS</span>
                <span className="text-[#00E5FF] text-sm font-bold">5 DISTRICTS</span>
              </div>
              <div className="w-[1px] h-6 bg-[#23354D]" />
              <div>
                <span className="text-[#8EA2BE] block text-[10px]">SYNTHETIC STREAM</span>
                <span className="text-[#39D98A] text-sm font-bold">12ms LATENCY</span>
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 2 — ONE LIVING DIGITAL TWIN */}
        {activeChapterIndex === 1 && (
          <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center max-w-2xl pointer-events-auto space-y-6 animate-in fade-in duration-500">
            <div className="p-6 bg-[#10182A]/90 backdrop-blur-2xl border border-[#23354D] rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
                <Compass className="w-4 h-4" />
                <span>CHAPTER 02 · SPATIAL FOUNDATION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F7FF]">
                One Living Digital Twin
              </h2>
              <p className="text-sm text-[#8EA2BE] leading-relaxed">
                NEXUS ingests simulated municipal telemetry to construct a unified 3D digital replica. Explore five distinct districts with dedicated operational priorities:
              </p>

              {/* District Selector Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {DISTRICTS.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => flyToDistrict(d.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedDistrict === d.id
                        ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#F3F7FF]'
                        : 'bg-[#070B16]/80 border-[#23354D] hover:border-[#00E5FF]/50 text-[#8EA2BE]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#F3F7FF]">{d.name}</span>
                      <span className="font-mono text-[#39D98A] text-[10px]">AQI {d.avgAqi}</span>
                    </div>
                    <p className="text-[11px] text-[#8EA2BE] mt-1 line-clamp-1">{d.tagline}</p>
                  </div>
                ))}
              </div>

              {/* District Statistics Counters */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#23354D] text-center font-mono">
                <div className="p-2 bg-[#070B16]/60 rounded-xl">
                  <div className="text-lg font-bold text-[#00E5FF]">842 km²</div>
                  <div className="text-[10px] text-[#8EA2BE]">Spatial Area</div>
                </div>
                <div className="p-2 bg-[#070B16]/60 rounded-xl">
                  <div className="text-lg font-bold text-[#39D98A]">4.2M</div>
                  <div className="text-[10px] text-[#8EA2BE]">Synthetic Pop.</div>
                </div>
                <div className="p-2 bg-[#070B16]/60 rounded-xl">
                  <div className="text-lg font-bold text-[#9B6DFF]">12,400</div>
                  <div className="text-[10px] text-[#8EA2BE]">IoT Streams</div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => goToChapter(2)}
                  className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg"
                >
                  <span>Continue to Mobility</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 3 — INTELLIGENT MOBILITY */}
        {activeChapterIndex === 2 && (
          <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center max-w-2xl pointer-events-auto space-y-6 animate-in fade-in duration-500">
            <div className="p-6 bg-[#10182A]/90 backdrop-blur-2xl border border-[#23354D] rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FFB84D]">
                <Navigation className="w-4 h-4" />
                <span>CHAPTER 03 · TRAFFIC MOBILITY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F7FF]">
                Intelligent Mobility
              </h2>
              <p className="text-sm text-[#8EA2BE] leading-relaxed">
                Watch vehicle pods stream through the Financial Spine and Nexus Skyway. Real-time arterial sensors monitor congestion, adjust signal timing, and reroute transit bottlenecks.
              </p>

              {/* Live Mobility Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#070B16]/80 rounded-xl border border-[#23354D]">
                  <span className="text-[11px] text-[#8EA2BE] block">Congestion Index</span>
                  <div className="text-xl font-bold font-mono text-[#FFB84D] mt-1">64% Moderate</div>
                  <div className="w-full bg-[#15243A] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#FFB84D] h-full rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>

                <div className="p-3 bg-[#070B16]/80 rounded-xl border border-[#23354D]">
                  <span className="text-[11px] text-[#8EA2BE] block">Arterial Velocity</span>
                  <div className="text-xl font-bold font-mono text-[#39D98A] mt-1">44.2 km/h</div>
                  <span className="text-[10px] text-[#39D98A] font-mono mt-1 block">+3.8 km/h vs peak</span>
                </div>
              </div>

              <div className="p-3 bg-[#15243A]/80 rounded-xl border border-[#23354D] text-xs text-[#8EA2BE]">
                <span className="text-[#00E5FF] font-semibold block mb-1">
                  Active Traffic Signal Coordination:
                </span>
                Autonomous signal posts cycle Red, Amber, and Green along Central Skyway intersections to clear congestion corridors.
              </div>

              <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
                <button
                  onClick={() => onNavigateScreen('mobility')}
                  className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Mobility & Traffic Suite</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => goToChapter(3)}
                  className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg"
                >
                  <span>Continue to Energy & Air</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 4 — CLEANER ENERGY AND AIR */}
        {activeChapterIndex === 3 && (
          <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center max-w-2xl pointer-events-auto space-y-6 animate-in fade-in duration-500">
            <div className="p-6 bg-[#10182A]/90 backdrop-blur-2xl border border-[#23354D] rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#39D98A]">
                <Wind className="w-4 h-4" />
                <span>CHAPTER 04 · ENVIRONMENT & MICROGRID</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F7FF]">
                Cleaner Energy and Air
              </h2>
              <p className="text-sm text-[#8EA2BE] leading-relaxed">
                Pulsing high-voltage energy conduits connect municipal substations with rooftop solar arrays. Particulate air quality sensors stream atmospheric AQI dispersion in real time.
              </p>

              {/* Energy & Air Telemetry Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#070B16]/80 rounded-xl border border-[#23354D]">
                  <span className="text-[11px] text-[#8EA2BE] block">Renewable Grid Share</span>
                  <div className="text-xl font-bold font-mono text-[#00E5FF] mt-1">48.2% Clean</div>
                  <span className="text-[10px] text-[#8EA2BE] font-mono mt-1 block">708.5 MW Peak Draw</span>
                </div>

                <div className="p-3 bg-[#070B16]/80 rounded-xl border border-[#23354D]">
                  <span className="text-[11px] text-[#8EA2BE] block">Average AQI Index</span>
                  <div className="text-xl font-bold font-mono text-[#39D98A] mt-1">34 AQI · Good</div>
                  <span className="text-[10px] text-[#39D98A] font-mono mt-1 block">-8.1% PM2.5 reduction</span>
                </div>
              </div>

              <div className="p-3 bg-[#15243A]/80 rounded-xl border border-[#23354D] text-xs text-[#8EA2BE]">
                <span className="text-[#9B6DFF] font-semibold block mb-1">
                  Microgrid Solar Synchronized:
                </span>
                Bioluminescent park foliage and rooftop photovoltaic panels offset 412 metric tons of synthetic carbon daily.
              </div>

              <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
                <button
                  onClick={() => onNavigateScreen('environment')}
                  className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Environment & Energy Grid</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => goToChapter(4)}
                  className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg"
                >
                  <span>Continue to Predictive Risk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 5 — PREDICTIVE INTELLIGENCE */}
        {activeChapterIndex === 4 && (
          <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center max-w-2xl pointer-events-auto space-y-6 animate-in fade-in duration-500">
            <div className="p-6 bg-[#10182A]/90 backdrop-blur-2xl border border-[#23354D] rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FF5D73]">
                <ShieldAlert className="w-4 h-4" />
                <span>CHAPTER 05 · PREDICTIVE FORECASTING</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F7FF]">
                Predictive Risk Engine
              </h2>
              <p className="text-sm text-[#8EA2BE] leading-relaxed">
                NEXUS doesn't merely display historical sensor logs. Transparent forecasting models identify structural fatigue, traffic gridlocks, and electrical surges hours before they occur.
              </p>

              {/* Risk Highlights */}
              <div className="space-y-2 pt-2">
                <div
                  onClick={() => {
                    const b = BUILDINGS.find((item) => item.id === 'tower-lumina');
                    if (b) flyToBuilding(b);
                  }}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] rounded-xl border border-[#FF5D73]/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5D73] animate-ping" />
                    <div>
                      <h4 className="text-xs font-bold text-[#F3F7FF]">Lumina Living Complex</h4>
                      <span className="text-[10px] text-[#8EA2BE]">HVAC Bearing Fatigue · +24h Forecast</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#FF5D73] bg-[#FF5D73]/15 px-2 py-0.5 rounded">
                    Score: 78/100
                  </span>
                </div>

                <div
                  onClick={() => {
                    const b = BUILDINGS.find((item) => item.id === 'tower-aegis');
                    if (b) flyToBuilding(b);
                  }}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] rounded-xl border border-[#FFB84D]/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFB84D]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#F3F7FF]">Aegis Security Operations</h4>
                      <span className="text-[10px] text-[#8EA2BE]">Chiller Loop Strain · +6h Horizon</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#FFB84D] bg-[#FFB84D]/15 px-2 py-0.5 rounded">
                    Score: 62/100
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
                <button
                  onClick={() => onNavigateScreen('predictive-risk')}
                  className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Launch Predictive Risk Engine</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => goToChapter(5)}
                  className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg"
                >
                  <span>Enter Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 6 — ENTER NEXUS COMMAND */}
        {activeChapterIndex === 5 && (
          <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center max-w-4xl pointer-events-auto space-y-6 animate-in fade-in duration-500">
            <div className="p-6 md:p-8 bg-[#10182A]/90 backdrop-blur-2xl border border-[#23354D] rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#23354D] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
                    <Sparkles className="w-4 h-4" />
                    <span>CHAPTER 06 · DECISION SUPPORT PLATFORM</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F7FF] mt-1">
                    Enter NEXUS Command Center
                  </h2>
                </div>

                <button
                  onClick={onEnterCommandCenter}
                  className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] via-[#4D7CFE] to-[#9B6DFF] hover:opacity-95 text-[#070B16] font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-[#00E5FF]/20"
                >
                  <span>LAUNCH FULL OPERATIONS SUITE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-[#8EA2BE] leading-relaxed">
                Direct access to the complete eight-section smart-city decision intelligence environment:
              </p>

              {/* 8 Sections Launch Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => onNavigateScreen('command-center')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">01</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Command Center
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Executive Telemetry</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('city-explorer')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">02</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    3D Digital Twin
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Spatial Inspection</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('scenario-simulator')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">03</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Policy Simulator
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Trade-off Models</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('predictive-risk')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">04</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Risk Engine
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Multi-Horizon Alerts</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('mobility')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">05</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Mobility & Traffic
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Signals & Velocities</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('environment')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">06</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Environment & Grid
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Sensors & Renewables</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('alerts')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">07</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Alerts & Triage
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Incident Console</p>
                </div>

                <div
                  onClick={() => onNavigateScreen('buildings')}
                  className="p-3 bg-[#070B16]/80 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-[#00E5FF]">08</span>
                  <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] mt-1">
                    Building Intel
                  </h4>
                  <p className="text-[10px] text-[#8EA2BE] mt-0.5">Facility Directory</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Contextual Right-Side Building Dossier (When clicked in 3D scene) */}
      {selectedBuilding && (
        <div className="fixed right-4 md:right-16 top-24 bottom-24 z-40 w-80 sm:w-96 bg-[#10182A]/90 backdrop-blur-2xl border border-[#23354D] rounded-2xl p-4 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 pointer-events-auto">
          <div className="space-y-3">
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
                onClick={() => setSelectedBuilding(null)}
                className="p-1.5 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8EA2BE] leading-relaxed">
              {selectedBuilding.description}
            </p>

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
                  <Building2 className="w-3 h-3 text-[#39D98A]" /> Occupancy
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
          </div>

          <div className="pt-3 border-t border-[#23354D]">
            <button
              onClick={() => onNavigateScreen('buildings', selectedBuilding.id)}
              className="w-full py-2.5 px-3 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#00E5FF]/20"
            >
              <span>Inspect in Building Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 7. Bottom Navigation Floating Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 h-16 px-4 md:px-8 flex items-center justify-between pointer-events-none bg-gradient-to-t from-[#070B16] via-[#070B16]/80 to-transparent">
        {/* Chapter Stepper Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            disabled={activeChapterIndex === 0}
            onClick={() => goToChapter(activeChapterIndex - 1)}
            className="p-2 rounded-lg bg-[#10182A]/80 border border-[#23354D] text-[#8EA2BE] hover:text-[#F3F7FF] disabled:opacity-40 transition-all"
            title="Previous Story Chapter"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            disabled={activeChapterIndex === CHAPTERS.length - 1}
            onClick={() => goToChapter(activeChapterIndex + 1)}
            className="p-2 rounded-lg bg-[#10182A]/80 border border-[#23354D] text-[#8EA2BE] hover:text-[#F3F7FF] disabled:opacity-40 transition-all"
            title="Next Story Chapter"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline text-xs text-[#8EA2BE] font-mono ml-2">
            CHAPTER {activeChapter.number} OF 06
          </span>
        </div>

        {/* Camera Presets & Reset */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#10182A]/85 backdrop-blur-xl border border-[#23354D] p-1 rounded-xl shadow-xl text-xs">
          <div className="flex items-center gap-1.5 px-2 text-[#8EA2BE]">
            <Camera className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden md:inline font-mono text-[11px]">CAMERA:</span>
          </div>
          <button
            onClick={() => applyPreset('isometric')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              cameraPreset === 'isometric'
                ? 'bg-[#15243A] text-[#00E5FF]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => applyPreset('street')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              cameraPreset === 'street'
                ? 'bg-[#15243A] text-[#00E5FF]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => applyPreset('topdown')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              cameraPreset === 'topdown'
                ? 'bg-[#15243A] text-[#00E5FF]'
                : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
            }`}
          >
            Radar 2D
          </button>

          <div className="w-[1px] h-4 bg-[#23354D] mx-1" />

          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className="p-1.5 text-[#8EA2BE] hover:text-[#00E5FF] rounded transition-colors"
            title={isAutoOrbit ? 'Pause Orbit' : 'Resume Auto Orbit'}
          >
            {isAutoOrbit ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => goToChapter(activeChapterIndex)}
            className="p-1.5 text-[#8EA2BE] hover:text-[#00E5FF] rounded transition-colors"
            title="Reset to Chapter View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
