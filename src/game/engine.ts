import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CharacterProfile,
  DialogueSubtitle,
  HudSnapshot,
  Language,
  MinimapBlip,
  MissionInfo,
  RadioStationId,
  SavedGameState,
  TimeOfDay,
  VehicleKind,
  WeaponId,
} from '../types/game';
import { CityTextures, createCityTextures } from './textures';
import { buildCityWorld, BuiltCity, ROAD_CENTERS, WORLD_LIMIT } from './city';
import { CharacterRig, createCharacterMesh, createPickupMesh, createVehicleMesh, VehicleRig } from './models';
import { soundEngine } from './audio';
import { calculateLevel } from './saveSystem';

interface VehicleEntity {
  id: string;
  kind: VehicleKind;
  name: string;
  rig: VehicleRig;
  x: number;
  y: number;
  z: number;
  vy: number;
  yaw: number;
  speed: number;
  maxSpeed: number;
  accel: number;
  hp: number;
  exploded: boolean;
  smokeTimer: number;
  deployedCops: number;
  isTraffic: boolean;
  isPolice: boolean;
  trafficDir: number;
  flashTimer: number;
}

interface PedEntity {
  id: string;
  rig: CharacterRig;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  walkPhase: number;
  hp: number;
  dead: boolean;
  fallProgress: number;
  deadTimer: number;
  isHostile: boolean;
  isPolice: boolean;
  isPartner?: boolean;
  isBuddy?: boolean;
  shootCooldown: number;
  fleeTimer: number;
  turnTimer: number;
}

interface PooledProjectile {
  active: boolean;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  damage: number;
  explosive: boolean;
  fromEnemy: boolean;
  fromBuddy: boolean;
}

interface PooledParticle {
  active: boolean;
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  gravity: number;
}

const VEHICLE_NAMES: Record<VehicleKind, { en: string; ar: string }> = {
  sports: { en: 'Veloce GT', ar: 'سبورت فيلوتشي GT' },
  muscle: { en: 'Dominator V8', ar: 'دومينيتور V8' },
  police: { en: 'KTA PD Interceptor', ar: 'دورية الشرطة' },
  taxi: { en: 'Cairo Bay Cab', ar: 'تاكسي المدينة' },
  suv: { en: 'Titan 4x4', ar: 'دفع رباعي تايتان' },
  bike: { en: 'Hayabusa R1', ar: 'موتوسيكل هايابوزا' },
};

const MAX_PARTICLES = 110;
const MAX_PROJECTILES = 56;

// Module-level reusable math helpers (Zero GC allocations per frame)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _cullSphere = new THREE.Sphere(new THREE.Vector3(), 5.5);
const _projScreenMatrix = new THREE.Matrix4();
const _frustum = new THREE.Frustum();

export class KtaGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private textures!: CityTextures;
  private city!: BuiltCity;

  private character: CharacterProfile;
  private language: Language;
  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onPauseRequest: () => void;
  private onAutoSave?: (state: SavedGameState) => void;

  private playerRig!: CharacterRig;
  private playerX = -28;
  private playerY = 0;
  private playerZ = -48;
  private playerVy = 0;
  private playerYaw = 0;
  private walkPhase = 0;
  private health = 100;
  private maxHealth = 100;
  private armor = 50;
  private cash = 600;
  private respect = 100;
  private currentLevel = 1;
  private wantedStars = 0;
  private wantedHideTimer = 0;
  private isWasted = false;
  private actionCooldown = 0;
  private muzzleFlashTimer = 0;
  private muzzleFlashMesh!: THREE.Mesh;
  private activeWeapon: WeaponId = 'pistol';
  private radioStation: RadioStationId = 'cairo';
  private timeOfDay: TimeOfDay = 'sunset';

  private vehicles: VehicleEntity[] = [];
  private peds: PedEntity[] = [];
  private partnerNpc: PedEntity | null = null;
  private buddyNpc: PedEntity | null = null;
  private buddyActive = false;
  private buddyCalloutCooldown = 0;

  private particlePool: PooledParticle[] = [];
  private particleCursor = 0;
  private projectilePool: PooledProjectile[] = [];
  private projectileCursor = 0;
  private sharedBulletGeo!: THREE.BoxGeometry;
  private sharedRocketGeo!: THREE.SphereGeometry;
  private sharedParticleGeo!: THREE.BoxGeometry;

  private drivenVehicle: VehicleEntity | null = null;

  private cameraOrbitYaw = 0;
  private cameraPitch = 0.28;
  private draggingCam = false;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private pointerMoved = false;
  private keys = new Set<string>();
  private touchInput = { x: 0, y: 0, boost: false };
  private touchFiring = false;
  private mouseFiring = false;
  private driftSmokeTimer = 0;

  private storyChapter = 1;
  private completedMissionIds: string[] = [];
  private activeMission: MissionInfo | null = null;
  private missionTargets: Array<{ x: number; z: number; marker: THREE.Mesh }> = [];
  private missionCheckpointsTotal = 0;
  private missionCheckpointsDone = 0;
  private missionStuntStartCount = 0;

  private bannerMessage: HudSnapshot['bannerMessage'] = null;
  private bannerTimer = 0;
  private subtitle: DialogueSubtitle | null = null;
  private subtitleTimer = 0;
  private hudEmitTimer = 0;
  private autoSaveTimer = 0;
  private lodUpdateTimer = 0;
  private paused = false;
  private airTime = 0;

  private stats = {
    missionsDone: 0,
    carsDriven: 0,
    takedowns: 0,
    stuntsLanded: 0,
  };
  private drivenIds = new Set<string>();

  constructor(options: {
    container: HTMLElement;
    character: CharacterProfile;
    language: Language;
    initialSave?: SavedGameState | null;
    onHudUpdate: (snapshot: HudSnapshot) => void;
    onPauseRequest: () => void;
    onAutoSave?: (state: SavedGameState) => void;
  }) {
    this.container = options.container;
    this.character = options.character;
    this.language = options.language;
    this.onHudUpdate = options.onHudUpdate;
    this.onPauseRequest = options.onPauseRequest;
    this.onAutoSave = options.onAutoSave;
    this.maxHealth = options.character.stats.maxHealth;
    this.health = this.maxHealth;

    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    // Cap pixel ratio at 1.5 for locked 60+ FPS on mobile & high-DPI screens
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      62,
      (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight),
      0.2,
      340,
    );

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.setupLighting();
    this.textures = createCityTextures(this.renderer);
    this.city = buildCityWorld(this.scene, this.textures);
    this.initObjectPools();

    // Restore saved progress if launched via "Continue Saved Game"
    if (options.initialSave) {
      this.applySaveState(options.initialSave, false);
    } else {
      this.applyTimeOfDay(this.timeOfDay);
    }

    this.spawnPlayer();
    this.spawnPartnerCharacter();
    this.spawnBuddyCharacter();
    this.spawnInitialVehicles();
    this.spawnPedestrians();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    soundEngine.setRadioStation(this.radioStation);
    const partnerName = this.getPartnerName();
    this.speak(
      partnerName,
      this.language === 'ar'
        ? `أهلاً بيك يا ${this.character.name.ar}! مستنياك في كافيه أصيلة على الكورنيش، وصاحبك عبقرينو واقف جنبك.`
        : `Hey ${this.character.name.en}! Waiting at Aseela's Corniche Café — Abqarino has your back!`,
      '#ec4899',
      5.2,
    );
    this.emitHud();
    this.startLoop();
  }

  private initObjectPools() {
    this.sharedParticleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const mesh = new THREE.Mesh(this.sharedParticleGeo, mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.particlePool.push({ active: false, mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, gravity: 14 });
    }

    this.sharedBulletGeo = new THREE.BoxGeometry(0.12, 0.12, 0.72);
    this.sharedRocketGeo = new THREE.SphereGeometry(0.24, 8, 8);
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const mesh = new THREE.Mesh(this.sharedBulletGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.projectilePool.push({
        active: false,
        mesh,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vz: 0,
        life: 0,
        damage: 0,
        explosive: false,
        fromEnemy: false,
        fromBuddy: false,
      });
    }
  }

  private getPartnerName(): string {
    if (this.character.id === 'aseela') {
      return this.language === 'ar' ? 'كيمو' : 'Kimo';
    }
    return this.language === 'ar' ? 'أصيلة' : 'Aseela';
  }

  private getBuddyName(): string {
    if (this.character.id === 'abqarino') {
      return this.language === 'ar' ? 'كيمو' : 'Kimo';
    }
    return this.language === 'ar' ? 'عبقرينو' : 'Abqarino';
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xfde68a, 0x1e293b, 0.78);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffd7a3, 1.85);
    this.sunLight.position.set(110, 95, 70);
    this.sunLight.castShadow = !this.isSoftwareGl;
    // 1024x1024 crisp shadow map for locked 60+ FPS on mobile & mid-range GPUs
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 15;
    this.sunLight.shadow.camera.far = 340;
    this.sunLight.shadow.camera.left = -135;
    this.sunLight.shadow.camera.right = 135;
    this.sunLight.shadow.camera.top = 135;
    this.sunLight.shadow.camera.bottom = -135;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
  }

  public applyTimeOfDay(mode: TimeOfDay) {
    this.timeOfDay = mode;
    if (mode === 'sunset') {
      const sky = 0xd97757;
      this.scene.background = new THREE.Color(sky);
      this.scene.fog = new THREE.FogExp2(sky, 0.0044);
      this.sunLight.color.setHex(0xffb36b);
      this.sunLight.intensity = 2.1;
      this.sunLight.position.set(130, 55, 45);
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.75;
    } else if (mode === 'day') {
      const sky = 0x7dd3fc;
      this.scene.background = new THREE.Color(sky);
      this.scene.fog = new THREE.FogExp2(sky, 0.0034);
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 2.3;
      this.sunLight.position.set(70, 140, 80);
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.85;
    } else {
      const sky = 0x090d1f;
      this.scene.background = new THREE.Color(sky);
      this.scene.fog = new THREE.FogExp2(sky, 0.0056);
      this.sunLight.color.setHex(0x6366f1);
      this.sunLight.intensity = 0.65;
      this.sunLight.position.set(-80, 90, -60);
      this.hemiLight.color.setHex(0x312e81);
      this.hemiLight.groundColor.setHex(0x09090b);
      this.hemiLight.intensity = 0.55;
    }

    const emissiveScale = mode === 'day' ? 0.12 : mode === 'sunset' ? 0.65 : 1.15;
    this.city?.buildingMats.forEach((m) => (m.emissiveIntensity = emissiveScale));
    this.city?.lampBulbMats.forEach((m) => (m.emissiveIntensity = mode === 'day' ? 0.15 : 1.25));
    this.city?.neonMats.forEach((m) => (m.emissiveIntensity = mode === 'day' ? 0.45 : 1.35));
    this.vehicles.forEach((v) => {
      v.rig.headlights.emissiveIntensity = mode === 'day' ? 0.2 : 1.2;
    });
  }

  private spawnPlayer() {
    this.playerRig = createCharacterMesh({ ...this.character.outfitColors, castShadow: true });
    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.playerRig.group);

    this.muzzleFlashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    );
    this.muzzleFlashMesh.visible = false;
    this.muzzleFlashMesh.position.set(0, 0.05, 0.55);
    this.playerRig.weaponMount.add(this.muzzleFlashMesh);

    this.syncEquippedWeaponMesh();
  }

  private spawnPartnerCharacter() {
    // Aseela (or Kimo if playing as Aseela) waiting at Aseela's Corniche Café
    const partnerIsAseela = this.character.id !== 'aseela';
    const rig = createCharacterMesh({
      jacket: partnerIsAseela ? 0x0d9488 : 0xd95f18,
      shirt: 0x111827,
      pants: 0x1e293b,
      skin: 0xc68652,
      hair: 0x111827,
      sunglasses: !partnerIsAseela,
    });
    const px = 76;
    const pz = -29;
    rig.group.position.set(px, 0.22, pz);
    rig.group.rotation.y = Math.PI;
    this.scene.add(rig.group);

    this.partnerNpc = {
      id: 'partner-npc',
      rig,
      x: px,
      z: pz,
      yaw: Math.PI,
      speed: 0,
      walkPhase: 0,
      hp: 999,
      dead: false,
      fallProgress: 0,
      deadTimer: 0,
      isHostile: false,
      isPolice: false,
      isPartner: true,
      shootCooldown: 0,
      fleeTimer: 0,
      turnTimer: 999,
    };
  }

  private spawnBuddyCharacter() {
    // Abqarino (or Kimo if playing as Abqarino) standing ready as interactive Co-op Buddy
    const buddyIsAbqarino = this.character.id !== 'abqarino';
    const rig = createCharacterMesh({
      jacket: buddyIsAbqarino ? 0x0f766e : 0xd95f18,
      shirt: buddyIsAbqarino ? 0xf59e0b : 0x18181b,
      pants: 0x1e293b,
      skin: 0xd49a6a,
      hair: 0x111827,
      sunglasses: true,
      castShadow: true,
    });
    rig.weaponMeshes.smg.visible = true;
    const bx = -22;
    const bz = -46;
    rig.group.position.set(bx, 0, bz);
    this.scene.add(rig.group);

    this.buddyNpc = {
      id: 'buddy-abqarino',
      rig,
      x: bx,
      z: bz,
      yaw: 0,
      speed: 6.4,
      walkPhase: 0,
      hp: 999,
      dead: false,
      fallProgress: 0,
      deadTimer: 0,
      isHostile: false,
      isPolice: false,
      isBuddy: true,
      shootCooldown: 0,
      fleeTimer: 0,
      turnTimer: 999,
    };
  }

  private syncEquippedWeaponMesh() {
    (Object.keys(this.playerRig.weaponMeshes) as WeaponId[]).forEach((wid) => {
      this.playerRig.weaponMeshes[wid].visible = wid === this.activeWeapon;
    });
  }

  private createVehicle(
    id: string,
    kind: VehicleKind,
    color: number,
    x: number,
    z: number,
    yaw: number,
    isTraffic: boolean,
    trafficDir = 0,
    brandIdx = 0,
  ): VehicleEntity {
    const brandSlot =
      kind === 'police'
        ? undefined
        : brandIdx % 2 === 0
          ? this.textures.brandAssets.logoA
          : this.textures.brandAssets.logoE;

    const rig = createVehicleMesh(kind, color, this.city.pool, brandSlot);
    rig.group.position.set(x, 0, z);
    rig.group.rotation.y = yaw;
    this.scene.add(rig.group);

    const spec = {
      sports: { maxSpeed: 31, accel: 12.5 },
      muscle: { maxSpeed: 29, accel: 11.5 },
      police: { maxSpeed: 30, accel: 12.0 },
      taxi: { maxSpeed: 25, accel: 9.5 },
      suv: { maxSpeed: 24, accel: 9.0 },
      bike: { maxSpeed: 34, accel: 14.5 },
    }[kind];

    const ent: VehicleEntity = {
      id,
      kind,
      name: VEHICLE_NAMES[kind][this.language],
      rig,
      x,
      y: 0,
      z,
      vy: 0,
      yaw,
      speed: 0,
      maxSpeed: spec.maxSpeed,
      accel: spec.accel,
      hp: 100,
      exploded: false,
      smokeTimer: 0,
      deployedCops: 0,
      isTraffic,
      isPolice: kind === 'police',
      trafficDir,
      flashTimer: 0,
    };
    this.vehicles.push(ent);
    return ent;
  }

  private spawnInitialVehicles() {
    this.createVehicle('hero-sports', 'sports', 0xf97316, -19, -52, Math.PI / 2, false, 0, 0);
    this.createVehicle('hero-bike', 'bike', 0xef4444, -24, -46, Math.PI / 4, false, 0, 1);
    this.createVehicle('hero-muscle', 'muscle', 0x2563eb, 14, -52, -Math.PI / 2, false, 0, 1);
    this.createVehicle('hero-suv', 'suv', 0x10b981, 28, 72, 0, false, 0, 0);
    this.createVehicle('hero-taxi', 'taxi', 0xfacc15, -52, -16, 0, false, 0, 1);
    this.createVehicle('hero-sports-2', 'sports', 0xec4899, 84, -14, Math.PI, false, 0, 0);
    this.createVehicle('hero-bike-2', 'bike', 0x14b8a6, -84, -52, 0, false, 0, 1);

    const palette = [0xef4444, 0x3b82f6, 0x10b981, 0xeab308, 0xa855f7, 0xf8fafc, 0x64748b];
    const kinds: VehicleKind[] = ['taxi', 'suv', 'muscle', 'sports', 'bike'];
    for (let i = 0; i < 10; i++) {
      const roadVal = ROAD_CENTERS[i % ROAD_CENTERS.length];
      const along = -95 + ((i * 37) % 190);
      const horizontal = i % 2 === 0;
      const dir = horizontal ? (i % 4 === 0 ? 1 : 3) : i % 4 === 1 ? 0 : 2;
      const laneOffset = dir === 0 || dir === 3 ? -2.8 : 2.8;
      const x = horizontal ? along : roadVal + laneOffset;
      const z = horizontal ? roadVal + laneOffset : along;
      const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][dir];
      const kind = kinds[i % kinds.length];
      this.createVehicle(`traffic-${i}`, kind, palette[i % palette.length], x, z, yaw, true, dir, i);
    }
  }

  private spawnSingleNpc(
    idx: number,
    options?: { isHostile?: boolean; isPolice?: boolean; nearX?: number; nearZ?: number },
  ): PedEntity {
    const jacketColors = [0x0ea5e9, 0xf43f5e, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xe2e8f0];
    const pantsColors = [0x1e293b, 0x334155, 0x475569, 0x0f172a];
    const isPolice = Boolean(options?.isPolice);
    const isHostile = Boolean(options?.isHostile) || (!isPolice && idx % 6 === 0);

    let x = options?.nearX;
    let z = options?.nearZ;
    if (x === undefined || z === undefined) {
      const road = ROAD_CENTERS[idx % ROAD_CENTERS.length];
      const side = idx % 2 === 0 ? 7.6 : -7.6;
      const posAlong = -100 + ((idx * 29) % 200);
      const horizontal = idx % 3 !== 0;
      x = horizontal ? posAlong : road + side;
      z = horizontal ? road + side : posAlong;
    }

    const rig = createCharacterMesh({
      jacket: isPolice ? 0x1e3a8a : isHostile ? 0x7f1d1d : jacketColors[idx % jacketColors.length],
      shirt: isPolice ? 0x0f172a : isHostile ? 0x18181b : 0xf8fafc,
      pants: isPolice ? 0x0f172a : pantsColors[idx % pantsColors.length],
      skin: idx % 2 === 0 ? 0xd9a273 : 0xb57a4c,
      hair: 0x1c1917,
      sunglasses: idx % 4 === 0 || isHostile || isPolice,
      isHostile,
      isPolice,
    });
    if (isHostile || isPolice) {
      rig.weaponMeshes.pistol.visible = true;
    }
    rig.group.position.set(x, 0, z);
    this.scene.add(rig.group);
    const ped: PedEntity = {
      id: `ped-${Date.now()}-${idx}-${Math.random()}`,
      rig,
      x,
      z,
      yaw: Math.random() * Math.PI * 2,
      speed: isPolice ? 4.2 : 2.1 + Math.random() * 1.1,
      walkPhase: Math.random() * 10,
      hp: isPolice ? 95 : isHostile ? 80 : 45,
      dead: false,
      fallProgress: 0,
      deadTimer: 0,
      isHostile,
      isPolice,
      shootCooldown: 1.1,
      fleeTimer: 0,
      turnTimer: 2 + Math.random() * 4,
    };
    this.peds.push(ped);
    return ped;
  }

  private spawnPedestrians() {
    for (let i = 0; i < 18; i++) {
      this.spawnSingleNpc(i);
    }
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    soundEngine.unlock();
    const code = e.code;
    this.keys.add(code);

    if (code === 'Escape' || code === 'KeyP') {
      this.onPauseRequest();
      return;
    }
    if (this.paused || this.isWasted) return;

    if (code === 'KeyF') this.toggleVehicleEntry();
    else if (code === 'KeyE') this.handleInteractKey();
    else if (code === 'KeyG') this.toggleBuddyFollow();
    else if (code === 'KeyR') this.cycleRadio();
    else if (code === 'KeyT') this.cycleTimeOfDay();
    else if (code === 'KeyH') this.honkHorn();
    else if (code === 'KeyJ') this.triggerAction();
    else if (code === 'Digit1') this.setWeapon('melee');
    else if (code === 'Digit2') this.setWeapon('pistol');
    else if (code === 'Digit3') this.setWeapon('smg');
    else if (code === 'Digit4') this.setWeapon('shotgun');
    else if (code === 'Digit5') this.setWeapon('rifle');
    else if (code === 'Digit6') this.setWeapon('rpg');
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent) => {
    soundEngine.unlock();
    if (this.paused || this.isWasted) return;
    if (e.button === 0) {
      this.draggingCam = true;
      this.pointerDownX = e.clientX;
      this.pointerDownY = e.clientY;
      this.pointerMoved = false;
      this.mouseFiring = e.pointerType !== 'touch';
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.draggingCam) return;
    const dx = e.clientX - this.pointerDownX;
    const dy = e.clientY - this.pointerDownY;
    if (Math.hypot(dx, dy) > 5) this.pointerMoved = true;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
    this.cameraOrbitYaw -= dx * 0.0075;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + dy * 0.004, 0.08, 0.72);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.draggingCam && !this.pointerMoved && e.pointerType !== 'touch' && !this.drivenVehicle && !this.paused && !this.isWasted) {
      this.triggerAction();
    }
    this.draggingCam = false;
    this.mouseFiring = false;
  };

  public toggleBuddyFollow() {
    this.buddyActive = !this.buddyActive;
    const bName = this.getBuddyName();
    if (this.buddyActive && this.buddyNpc) {
      // Bring buddy right beside player if far away
      const px = this.getPlayerPosX();
      const pz = this.getPlayerPosZ();
      if (Math.hypot(this.buddyNpc.x - px, this.buddyNpc.z - pz) > 25) {
        const col = this.resolveBuildingCollision(px + 2.8, pz + 2.8, 0.5);
        this.buddyNpc.x = col.x;
        this.buddyNpc.z = col.z;
      }
      this.speak(
        bName,
        this.language === 'ar' ? 'جيتلك يا صاحبي! ضهرك في أمان دلوقتي، يلا بينا!' : 'Right behind you, partner! Let’s handle this together!',
        '#14b8a6',
        3.5,
      );
    } else {
      this.speak(
        bName,
        this.language === 'ar' ? 'تمام، هستناك هنا في الساحة لو احتجتني.' : 'Got it, I will hold down the block until you call!',
        '#14b8a6',
        3.0,
      );
    }
    this.emitHud();
  }

  public exportSaveState(): SavedGameState {
    return {
      version: 1,
      characterId: this.character.id,
      cash: this.cash,
      respect: this.respect,
      level: this.currentLevel,
      health: Math.round(this.health),
      armor: Math.round(this.armor),
      activeWeapon: this.activeWeapon,
      radioStation: this.radioStation,
      timeOfDay: this.timeOfDay,
      storyChapter: this.storyChapter,
      completedMissionIds: [...this.completedMissionIds],
      playerX: Math.round(this.getPlayerPosX() * 10) / 10,
      playerZ: Math.round(this.getPlayerPosZ() * 10) / 10,
      stats: { ...this.stats },
      savedAt: Date.now(),
    };
  }

  public applySaveState(save: SavedGameState, relocatePlayer = true) {
    this.cash = save.cash;
    this.respect = save.respect;
    this.currentLevel = calculateLevel(this.respect);
    this.health = Math.min(this.maxHealth, Math.max(15, save.health));
    this.armor = save.armor;
    this.activeWeapon = save.activeWeapon;
    this.radioStation = save.radioStation;
    this.storyChapter = save.storyChapter;
    this.completedMissionIds = [...save.completedMissionIds];
    this.stats = { ...save.stats };
    this.applyTimeOfDay(save.timeOfDay);

    const col = this.resolveBuildingCollision(save.playerX, save.playerZ, 0.65);
    this.playerX = col.x;
    this.playerZ = col.z;

    if (relocatePlayer) {
      if (this.drivenVehicle) {
        this.drivenVehicle = null;
        this.playerRig.group.visible = true;
      }
      this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
      this.syncEquippedWeaponMesh();
      soundEngine.setRadioStation(this.radioStation);
      this.emitHud();
    }
  }

  private triggerAutoSave() {
    if (this.onAutoSave) {
      this.onAutoSave(this.exportSaveState());
    }
  }

  public setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.keys.clear();
      this.mouseFiring = false;
      this.touchFiring = false;
      soundEngine.stopEngine();
      this.triggerAutoSave();
    }
  }

  public setLanguage(lang: Language) {
    this.language = lang;
    this.vehicles.forEach((v) => {
      v.name = VEHICLE_NAMES[v.kind][lang];
    });
    this.emitHud();
  }

  public setWeapon(w: WeaponId) {
    this.activeWeapon = w;
    this.syncEquippedWeaponMesh();
    this.emitHud();
  }

  public cycleWeapon(dir: 1 | -1 = 1) {
    const order: WeaponId[] = ['melee', 'pistol', 'smg', 'shotgun', 'rifle', 'rpg'];
    const idx = order.indexOf(this.activeWeapon);
    const next = order[(idx + dir + order.length) % order.length];
    this.setWeapon(next);
  }

  public cycleRadio() {
    const order: RadioStationId[] = ['cairo', 'synthwave', 'funk', 'off'];
    const next = order[(order.indexOf(this.radioStation) + 1) % order.length];
    this.radioStation = next;
    soundEngine.setRadioStation(next);
    this.emitHud();
  }

  public cycleTimeOfDay() {
    const order: TimeOfDay[] = ['sunset', 'day', 'night'];
    const next = order[(order.indexOf(this.timeOfDay) + 1) % order.length];
    this.applyTimeOfDay(next);
    this.emitHud();
  }

  public setTimeOfDay(mode: TimeOfDay) {
    this.applyTimeOfDay(mode);
    this.emitHud();
  }

  public honkHorn() {
    if (!this.drivenVehicle) return;
    soundEngine.playHorn(this.drivenVehicle.isPolice);
  }

  public setTouchInput(x: number, y: number, boost: boolean) {
    this.touchInput.x = x;
    this.touchInput.y = y;
    this.touchInput.boost = boost;
  }

  public setTouchFire(firing: boolean) {
    this.touchFiring = firing;
    if (firing) {
      soundEngine.unlock();
      this.triggerAction();
    }
  }

  public setTouchJumpOrDrift(active: boolean) {
    if (active) this.keys.add('Space');
    else this.keys.delete('Space');
  }

  public handleInteractKey() {
    if (this.tryBuyFood()) return;
    this.tryStartNearbyMission();
  }

  public tryBuyFood(): boolean {
    if (this.drivenVehicle) return false;
    for (const r of this.city.restaurants) {
      if (Math.hypot(r.x - this.playerX, r.z - this.playerZ) < 3.4) {
        if (this.cash < r.cost) {
          this.showBanner(this.language === 'ar' ? 'مش معاك فلوس كفاية!' : 'Not enough cash!', 'alert', 2);
          return true;
        }
        this.cash -= r.cost;
        this.health = Math.min(this.maxHealth, this.health + r.heal);
        soundEngine.playAction('repair');
        this.showBanner(`+${r.heal} صحة`, 'success', 2);
        this.speak(
          r.name[this.language],
          this.language === 'ar' ? 'ألف هنا وشفا يا نجم! وجبة بلدي ترد الروح.' : 'Fresh off the grill — enjoy your meal, boss!',
          '#22c55e',
          3.2,
        );
        this.triggerAutoSave();
        this.emitHud();
        return true;
      }
    }
    return false;
  }

  public toggleVehicleEntry() {
    if (this.drivenVehicle) {
      const v = this.drivenVehicle;
      const exitCol = this.resolveBuildingCollision(v.x - Math.cos(v.yaw) * 2.2, v.z + Math.sin(v.yaw) * 2.2, 0.55);
      this.playerX = exitCol.x;
      this.playerZ = exitCol.z;
      this.playerY = 0;
      this.playerYaw = v.yaw;
      this.playerRig.group.visible = true;
      this.playerRig.group.position.set(this.playerX, 0, this.playerZ);

      if (this.buddyActive && this.buddyNpc) {
        const bCol = this.resolveBuildingCollision(v.x + Math.cos(v.yaw) * 2.2, v.z - Math.sin(v.yaw) * 2.2, 0.5);
        this.buddyNpc.x = bCol.x;
        this.buddyNpc.z = bCol.z;
        this.buddyNpc.rig.group.visible = true;
        this.buddyNpc.rig.group.position.set(bCol.x, 0, bCol.z);
      }

      v.speed *= 0.5;
      this.drivenVehicle = null;
      soundEngine.playAction('door');
      soundEngine.stopEngine();
      this.emitHud();
      return;
    }

    let best: VehicleEntity | null = null;
    let bestDist = 4.8;
    for (const v of this.vehicles) {
      if (v.exploded) continue;
      const d = Math.hypot(v.x - this.playerX, v.z - this.playerZ);
      if (d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    if (!best) return;

    if (best.isTraffic) {
      best.isTraffic = false;
      this.addWanted(1);
      this.speak(
        this.language === 'ar' ? 'سواق الغلابة' : 'Angry Driver',
        this.language === 'ar' ? 'يا عم انت بتسحب عربيتي كده عادي؟!' : 'Hey! You just took my ride!',
        '#f87171',
        3.2,
      );
    } else if (best.kind === 'sports' || best.kind === 'bike') {
      this.speak(
        this.character.name[this.language],
        this.language === 'ar' ? 'الوحش ده بتاعنا دلوقتي! اربط الحزام.' : 'Pure horsepower! Let’s roll.',
        this.character.accentHex,
        2.8,
      );
    }

    if (!this.drivenIds.has(best.id)) {
      this.drivenIds.add(best.id);
      this.stats.carsDriven = this.drivenIds.size;
    }
    this.drivenVehicle = best;
    this.playerRig.group.visible = false;
    if (this.buddyActive && this.buddyNpc) {
      this.buddyNpc.rig.group.visible = false;
    }
    soundEngine.playAction('door');
    this.emitHud();
  }

  private spawnPooledProjectile(
    x: number,
    y: number,
    z: number,
    vx: number,
    vz: number,
    yaw: number,
    life: number,
    damage: number,
    color: number,
    explosive: boolean,
    fromEnemy: boolean,
    fromBuddy: boolean,
  ) {
    const p = this.projectilePool[this.projectileCursor];
    this.projectileCursor = (this.projectileCursor + 1) % MAX_PROJECTILES;

    p.active = true;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vz = vz;
    p.life = life;
    p.damage = damage;
    p.explosive = explosive;
    p.fromEnemy = fromEnemy;
    p.fromBuddy = fromBuddy;

    p.mesh.geometry = explosive ? this.sharedRocketGeo : this.sharedBulletGeo;
    (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    p.mesh.position.set(x, y, z);
    p.mesh.rotation.y = yaw;
    p.mesh.visible = true;
  }

  public triggerAction() {
    if (this.actionCooldown > 0 || this.isWasted || this.paused) return;

    if (this.drivenVehicle) {
      this.honkHorn();
      return;
    }

    soundEngine.playWeaponFire(this.activeWeapon);
    this.playerRig.rightArm.rotation.x = -1.45;

    const dmgMul = this.character.stats.damageMultiplier ?? 1.0;

    if (this.activeWeapon === 'melee') {
      this.actionCooldown = 0.36;
      for (const ped of this.peds) {
        if (ped.dead) continue;
        const d = Math.hypot(ped.x - this.playerX, ped.z - this.playerZ);
        if (d < 2.6) {
          this.damagePed(ped, Math.round(35 * dmgMul), Math.sin(this.playerYaw), Math.cos(this.playerYaw));
        }
      }
      return;
    }

    // Gunfire scares nearby civilians so they panic & flee!
    for (const ped of this.peds) {
      if (!ped.dead && !ped.isHostile && !ped.isPolice && !ped.isPartner && !ped.isBuddy) {
        const d = Math.hypot(ped.x - this.playerX, ped.z - this.playerZ);
        if (d < 28) {
          ped.fleeTimer = 5.5;
          ped.yaw = Math.atan2(ped.x - this.playerX, ped.z - this.playerZ);
        }
      }
    }

    const specs: Record<
      Exclude<WeaponId, 'melee'>,
      { cd: number; speed: number; dmg: number; pellets: number; spread: number; color: number; explosive: boolean }
    > = {
      pistol: { cd: 0.28, speed: 54, dmg: 26, pellets: 1, spread: 0.03, color: 0xfef08a, explosive: false },
      smg: { cd: 0.1, speed: 56, dmg: 16, pellets: 1, spread: 0.08, color: 0xfbbf24, explosive: false },
      shotgun: { cd: 0.65, speed: 48, dmg: 22, pellets: 5, spread: 0.24, color: 0xf97316, explosive: false },
      rifle: { cd: 0.14, speed: 66, dmg: 24, pellets: 1, spread: 0.04, color: 0x38bdf8, explosive: false },
      rpg: { cd: 1.05, speed: 35, dmg: 120, pellets: 1, spread: 0, color: 0xef4444, explosive: true },
    };

    const s = specs[this.activeWeapon];
    this.actionCooldown = s.cd;
    this.muzzleFlashTimer = 0.06;
    this.muzzleFlashMesh.visible = true;

    const sx = this.playerX + Math.sin(this.playerYaw) * 0.95;
    const sz = this.playerZ + Math.cos(this.playerYaw) * 0.95;
    this.spawnBurst(sx, 1.32, sz, s.color, 3, 4);

    for (let i = 0; i < s.pellets; i++) {
      const yaw = this.playerYaw + (Math.random() - 0.5) * s.spread;
      this.spawnPooledProjectile(
        sx,
        1.32,
        sz,
        Math.sin(yaw) * s.speed,
        Math.cos(yaw) * s.speed,
        yaw,
        s.explosive ? 1.8 : 0.95,
        Math.round(s.dmg * dmgMul),
        s.color,
        s.explosive,
        false,
        false,
      );
    }

    if (this.activeWeapon === 'rpg') {
      this.addWanted(1);
    }
  }

  private addRespect(amount: number) {
    if (amount <= 0) return;
    this.respect += amount;
    const newLevel = calculateLevel(this.respect);
    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      soundEngine.playAction('mission');
      this.showBanner(
        this.language === 'ar' ? `ترقية! وصلت للمستوى ${newLevel}` : `Level Up! Reached Level ${newLevel}`,
        'gold',
        3.5,
      );
    }
  }

  private damagePed(ped: PedEntity, amount: number, dirX: number, dirZ: number) {
    if (ped.dead || ped.isPartner || ped.isBuddy) return;
    ped.hp -= amount;
    this.spawnBurst(ped.x, 1.25, ped.z, 0xef4444, 5, 7);

    if (ped.hp <= 0) {
      ped.dead = true;
      ped.fallProgress = 0;
      ped.deadTimer = 9.0;
      this.stats.takedowns += 1;
      this.addRespect(ped.isHostile || ped.isPolice ? 55 : 15);
      this.addWanted(ped.isHostile ? 0 : 1);

      const dropMesh = createPickupMesh('cash');
      dropMesh.position.set(ped.x, 0.65, ped.z);
      this.scene.add(dropMesh);
      this.city.pickups.push({
        id: `drop-${Date.now()}-${Math.random()}`,
        kind: 'cash',
        x: ped.x,
        z: ped.z,
        mesh: dropMesh,
        cooldown: 0,
        temporary: true,
        value: ped.isPolice ? 180 : ped.isHostile ? 140 : 65,
      });

      if ((this.activeMission?.id === 'sweep' || this.activeMission?.id === 'coop-hack') && ped.isHostile) {
        this.activeMission.progress += 1;
        if (this.activeMission.progress >= this.activeMission.total) {
          this.completeMission();
        }
      }
    } else {
      ped.x += dirX * 0.45;
      ped.z += dirZ * 0.45;
      if (!ped.isHostile && !ped.isPolice) {
        ped.fleeTimer = 5.0;
        ped.yaw = Math.atan2(ped.x - this.playerX, ped.z - this.playerZ);
        this.addWanted(1);
      }
    }
  }

  private damageVehicle(v: VehicleEntity, amount: number) {
    if (v.exploded) return;
    v.hp = Math.max(0, v.hp - amount);
    if (v.hp <= 0) {
      v.exploded = true;
      v.speed = 0;
      v.vy = 6.5;
      v.y = 0.25;
      v.rig.bodyMat.color.setHex(0x18181b);
      v.rig.headlights.emissiveIntensity = 0;
      this.triggerExplosion(v.x, v.z);
      if (this.drivenVehicle === v) {
        this.damagePlayer(45);
        this.toggleVehicleEntry();
      }
    }
  }

  private triggerExplosion(x: number, z: number) {
    soundEngine.playExplosion();
    this.spawnBurst(x, 1.3, z, 0xf97316, 18, 12);
    this.spawnBurst(x, 2.0, z, 0xfef08a, 12, 10);
    this.spawnBurst(x, 2.4, z, 0x334155, 10, 6);

    for (const ped of this.peds) {
      if (ped.dead || ped.isPartner || ped.isBuddy) continue;
      const d = Math.hypot(ped.x - x, ped.z - z);
      if (d < 9.0) {
        this.damagePed(ped, 115, (ped.x - x) / (d + 0.1), (ped.z - z) / (d + 0.1));
      }
    }

    for (const v of this.vehicles) {
      const d = Math.hypot(v.x - x, v.z - z);
      if (d < 9.5 && !v.exploded) {
        v.vy = 7.5;
        v.y = 0.2;
        if (d < 6.5 && v.hp > 0) {
          this.damageVehicle(v, 70);
        }
      }
    }
  }

  private addWanted(delta: number) {
    if (delta <= 0) return;
    const prev = this.wantedStars;
    const next = Math.min(5, this.wantedStars + delta);
    if (next > prev) {
      this.wantedStars = next;
      this.wantedHideTimer = 0;
      this.ensurePolicePursuit();
      if (prev === 0) {
        this.speak(
          this.language === 'ar' ? 'بلاغ الشرطة' : 'KTA Police Dispatch',
          this.language === 'ar'
            ? 'الكل يتحرك! الدوريات في الطريق لمحاصرة المشتبه فيه!'
            : 'All units respond! Patrol cars moving in to intercept suspect!',
          '#38bdf8',
          3.8,
        );
      }
    }
  }

  private ensurePolicePursuit() {
    const policeCount = this.vehicles.filter((v) => v.isPolice && !v.isTraffic && !v.exploded).length;
    const needed = Math.min(3, Math.ceil(this.wantedStars / 2));
    for (let i = policeCount; i < needed; i++) {
      const angle = Math.random() * Math.PI * 2;
      const px = THREE.MathUtils.clamp(this.getPlayerPosX() + Math.cos(angle) * 58, -WORLD_LIMIT, WORLD_LIMIT);
      const pz = THREE.MathUtils.clamp(this.getPlayerPosZ() + Math.sin(angle) * 58, -WORLD_LIMIT, WORLD_LIMIT);
      this.createVehicle(`cop-${Date.now()}-${i}`, 'police', 0x0f172a, px, pz, 0, false);
    }
  }

  public tryStartNearbyMission() {
    if (this.activeMission) return;
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();
    for (const m of this.city.missionSpots) {
      if (Math.hypot(m.x - px, m.z - pz) < 5.2) {
        this.startMission(m.id);
        return;
      }
    }
  }

  private startMission(id: string) {
    this.clearMissionMarkers();
    const partnerName = this.getPartnerName();
    const buddyName = this.getBuddyName();

    if (id === 'story') {
      if (this.storyChapter === 1) {
        this.spawnMissionCheckpoints([{ x: 76, z: -26 }], 0xec4899);
        this.activeMission = {
          id: 'story-1',
          isStory: true,
          title: { en: `Chapter 1: Meet ${partnerName}`, ar: `القصة 1: ميعاد مع ${partnerName}` },
          objective: { en: `Drive to ${partnerName}'s Corniche Café`, ar: `روح عند ${partnerName} في كافيه الكورنيش` },
          progress: 0,
          total: 1,
          timeLeft: 90,
          rewardCash: 900,
        };
        this.speak(
          partnerName,
          this.language === 'ar'
            ? `مستنياك في الكافيه يا ${this.character.name.ar}، تعالى بسرعة قبل ما الزحمة تقفل الطريق!`
            : `Waiting at the café, ${this.character.name.en} — hurry before the rival crew shows up!`,
          '#ec4899',
          4.5,
        );
      } else if (this.storyChapter === 2) {
        for (let i = 0; i < 5; i++) {
          this.spawnSingleNpc(200 + i, {
            isHostile: true,
            nearX: 76 + (Math.random() - 0.5) * 28,
            nearZ: -26 + (Math.random() - 0.5) * 28,
          });
        }
        this.activeMission = {
          id: 'sweep',
          isStory: true,
          title: { en: `Chapter 2: Protect ${partnerName}`, ar: `القصة 2: احمي ${partnerName}` },
          objective: { en: 'Defeat the 5 rival gang ambushers!', ar: 'اتعامل مع الـ 5 بلطجية اللي محاصرين الكافيه!' },
          progress: 0,
          total: 5,
          timeLeft: 95,
          rewardCash: 1400,
        };
        this.speak(
          partnerName,
          this.language === 'ar' ? `الحقني يا ${this.character.name.ar}! العصابة حاصرت الكافيه!` : 'Watch out! The rival crew just ambushed the café!',
          '#ec4899',
          4.5,
        );
      } else {
        this.spawnMissionCheckpoints([{ x: -84, z: -68 }], 0xfacc15);
        this.activeMission = {
          id: 'story-3',
          isStory: true,
          title: { en: 'Chapter 3: Coastal Villa Escape', ar: 'القصة 3: الهروب لفيلا الساحل' },
          objective: { en: 'Drive together to the Coastal Villa Safehouse', ar: 'وصلوا سوا لفيلا الساحل بأمان' },
          progress: 0,
          total: 1,
          timeLeft: 85,
          rewardCash: 2200,
        };
        this.speak(
          partnerName,
          this.language === 'ar'
            ? 'يلا نطلع على فيلا الساحل سوا ونسيب الدوشة دي ورانا!'
            : 'Let’s take the coastal road to the Villa Safehouse together!',
          '#ec4899',
          4.5,
        );
      }
      this.emitHud();
      return;
    }

    if (id === 'coop-hack') {
      // Activate Abqarino Co-op Buddy immediately!
      if (!this.buddyActive) {
        this.buddyActive = true;
        if (this.buddyNpc && !this.drivenVehicle) {
          const col = this.resolveBuildingCollision(this.playerX + 2.5, this.playerZ + 2.5, 0.5);
          this.buddyNpc.x = col.x;
          this.buddyNpc.z = col.z;
          this.buddyNpc.rig.group.visible = true;
        }
      }
      for (let i = 0; i < 6; i++) {
        this.spawnSingleNpc(250 + i, {
          isHostile: true,
          nearX: 28 + (Math.random() - 0.5) * 32,
          nearZ: 28 + (Math.random() - 0.5) * 32,
        });
      }
      this.activeMission = {
        id: 'coop-hack',
        isCoop: true,
        title: { en: `Co-op: Raid with ${buddyName}`, ar: `مهمة مشتركة: هجوم مع ${buddyName}` },
        objective: {
          en: `Fight alongside ${buddyName} and defeat 6 gang guards at Downtown East!`,
          ar: `انزل كتف في كتف مع ${buddyName} وخلص على 6 من حرس العصابة!`,
        },
        progress: 0,
        total: 6,
        timeLeft: 110,
        rewardCash: 1850,
      };
      this.speak(
        buddyName,
        this.language === 'ar'
          ? 'أنا هكرت كاميرات العصابة! خليك جنبي وهننضف المنطقة سوا!'
          : 'I hacked their street cameras! Stay close and we’ll take them down together!',
        '#06b6d4',
        4.6,
      );
      this.emitHud();
      return;
    }

    if (id === 'delivery') {
      this.spawnMissionCheckpoints(
        [
          { x: 56, z: -56 },
          { x: 56, z: 56 },
          { x: -56, z: 56 },
        ],
        0xf59e0b,
      );
      this.activeMission = {
        id,
        title: { en: 'Express Delivery Run', ar: 'توصيلة إكسبريس في الزحمة' },
        objective: { en: 'Reach all 3 golden checkpoints', ar: 'عدي على الـ 3 نقاط الدهبية قبل الوقت ما يخلص' },
        progress: 0,
        total: 3,
        timeLeft: 80,
        rewardCash: 850,
      };
      this.speak(
        this.language === 'ar' ? 'المعلم هاني' : 'Uncle Hany',
        this.language === 'ar' ? 'اسمع يا بطل، الطرود دي لازم توصل قبل الزحمة. دوس بنزين!' : 'Those crates need to clear 3 checkpoints fast. Hit the gas!',
        '#f59e0b',
        4.2,
      );
    } else if (id === 'sweep') {
      for (let i = 0; i < 5; i++) {
        this.spawnSingleNpc(100 + i, {
          isHostile: true,
          nearX: -28 + (Math.random() - 0.5) * 44,
          nearZ: 28 + (Math.random() - 0.5) * 44,
        });
      }
      this.activeMission = {
        id,
        title: { en: 'Neighborhood Sweep', ar: 'تطهير الحارة' },
        objective: { en: 'Take out 5 armed gang troublemakers', ar: 'اتعامل مع 5 من العصابة المسلحة' },
        progress: 0,
        total: 5,
        timeLeft: 85,
        rewardCash: 1100,
      };
      this.speak(
        this.character.name[this.language],
        this.language === 'ar' ? 'العصابة رجعت الحارة؟ وقت الجد دلوقتي!' : 'Rival crew on our turf? Time to clean house.',
        this.character.accentHex,
        4.0,
      );
    } else if (id === 'stunt') {
      this.missionStuntStartCount = this.stats.stuntsLanded;
      this.activeMission = {
        id,
        title: { en: 'Bay Stunt Show', ar: 'عرض نطات الكورنيش' },
        objective: { en: 'Land 2 vehicle ramp jumps', ar: 'نط بمركبة مرتين من على الرامب' },
        progress: 0,
        total: 2,
        timeLeft: 85,
        rewardCash: 950,
      };
      this.speak(
        partnerName,
        this.language === 'ar' ? 'الناس كلها بتتفرج على الكورنيش! عايزين نشوفك طاير في السما.' : 'Crowds are watching! Hit those ramps!',
        '#ec4899',
        4.0,
      );
    }
    this.emitHud();
  }

  private spawnMissionCheckpoints(pts: Array<{ x: number; z: number }>, color: number) {
    this.missionCheckpointsTotal = pts.length;
    this.missionCheckpointsDone = 0;
    pts.forEach((p, idx) => {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 7.5, 16, 1, true),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
      );
      marker.position.set(p.x, 3.75, p.z);
      marker.visible = idx === 0;
      this.scene.add(marker);
      this.missionTargets.push({ x: p.x, z: p.z, marker });
    });
  }

  private clearMissionMarkers() {
    this.missionTargets.forEach((t) => this.scene.remove(t.marker));
    this.missionTargets = [];
  }

  private completeMission() {
    if (!this.activeMission) return;
    const wasStory = Boolean(this.activeMission.isStory);
    const wasCoop = Boolean(this.activeMission.isCoop);
    const missionId = this.activeMission.id;
    const reward = Math.round(this.activeMission.rewardCash * this.character.stats.cashBonus);
    this.cash += reward;
    this.addRespect(180);
    this.stats.missionsDone += 1;
    if (!this.completedMissionIds.includes(missionId)) {
      this.completedMissionIds.push(missionId);
    }

    soundEngine.playAction('mission');
    this.showBanner(
      this.language === 'ar' ? `عاش يا بطل! المهمة تمت +$${reward}` : `Mission Passed! +$${reward}`,
      'success',
      4,
    );

    if (wasStory) {
      const partnerName = this.getPartnerName();
      if (this.storyChapter < 3) {
        this.storyChapter += 1;
        this.speak(
          partnerName,
          this.language === 'ar'
            ? 'انت دايماً جدع وبتنقذني في أصعب وقت! ارجع لعلامة القصة عشان نكمل.'
            : 'You always come through for me! Head back to the Story marker for the next chapter.',
          '#ec4899',
          4.5,
        );
      } else {
        this.storyChapter = 1;
        this.speak(
          partnerName,
          this.language === 'ar'
            ? 'وصلنا الفيلا بأمان! الكورنيش والمدينة كلها بقوا بتوعنا النهاردة!'
            : 'We made it to the Villa! Sunhaven Bay is ours tonight.',
          '#ec4899',
          4.8,
        );
      }
    } else if (wasCoop) {
      const buddyName = this.getBuddyName();
      this.speak(
        buddyName,
        this.language === 'ar'
          ? 'الله ينور يا صاحبي! مفيش عصابة تقدر تقف قدامنا واحنا مع بعض!'
          : 'Clean sweep, buddy! Nobody stands a chance when we team up!',
        '#06b6d4',
        4.6,
      );
    }

    this.activeMission = null;
    this.clearMissionMarkers();
    this.triggerAutoSave();
    this.emitHud();
  }

  private failMission(reason: string) {
    this.activeMission = null;
    this.clearMissionMarkers();
    this.showBanner(reason, 'alert', 3.5);
    this.emitHud();
  }

  private showBanner(text: string, tone: NonNullable<HudSnapshot['bannerMessage']>['tone'], sec = 3) {
    this.bannerMessage = { text, tone };
    this.bannerTimer = sec;
  }

  private speak(speaker: string, text: string, color: string, sec = 3.5) {
    this.subtitle = { speaker, text, color };
    this.subtitleTimer = sec;
  }

  private spawnBurst(x: number, y: number, z: number, color: number, count: number, speed = 8, gravity = 14) {
    for (let i = 0; i < count; i++) {
      const pt = this.particlePool[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;

      pt.active = true;
      pt.life = 0.36 + Math.random() * 0.3;
      pt.maxLife = pt.life;
      pt.gravity = gravity;
      pt.vx = (Math.random() - 0.5) * speed;
      pt.vy = 1.5 + Math.random() * (speed * 0.7);
      pt.vz = (Math.random() - 0.5) * speed;

      (pt.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      pt.mesh.position.set(x, y, z);
      pt.mesh.scale.setScalar(1);
      pt.mesh.visible = true;
    }
  }

  public respawnPlayer() {
    this.isWasted = false;
    this.health = this.maxHealth;
    this.armor = 50;
    this.wantedStars = 0;
    this.drivenVehicle = null;
    this.playerRig.group.visible = true;
    this.playerX = -28;
    this.playerY = 0;
    this.playerZ = -48;
    this.playerVy = 0;
    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    soundEngine.setPoliceSiren(false);
    this.speak(
      this.character.name[this.language],
      this.language === 'ar' ? 'الحمد لله على السلامة... راجعين أقوى بكتير!' : 'Back on my feet. Nobody keeps me down.',
      this.character.accentHex,
      3.5,
    );
    this.emitHud();
  }

  private getPlayerPosX() {
    return this.drivenVehicle ? this.drivenVehicle.x : this.playerX;
  }

  private getPlayerPosZ() {
    return this.drivenVehicle ? this.drivenVehicle.z : this.playerZ;
  }

  private resolveBuildingCollision(x: number, z: number, radius: number, y = 0): { x: number; z: number; hit: boolean } {
    let rx = x;
    let rz = z;
    let hit = false;
    for (const b of this.city.buildings) {
      if (y > b.h + 1.2) continue;
      const hw = b.w / 2 + radius;
      const hd = b.d / 2 + radius;
      const dx = rx - b.x;
      const dz = rz - b.z;
      if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
        hit = true;
        const ox = hw - Math.abs(dx);
        const oz = hd - Math.abs(dz);
        if (ox < oz) rx += dx >= 0 ? ox : -ox;
        else rz += dz >= 0 ? oz : -oz;
      }
    }
    if (rx < -WORLD_LIMIT || rx > WORLD_LIMIT || rz < -WORLD_LIMIT || rz > WORLD_LIMIT) {
      hit = true;
    }
    rx = THREE.MathUtils.clamp(rx, -WORLD_LIMIT, WORLD_LIMIT);
    rz = THREE.MathUtils.clamp(rz, -WORLD_LIMIT, WORLD_LIMIT);
    return { x: rx, z: rz, hit };
  }

  private resolveVehicleToVehicleCollisions() {
    for (let i = 0; i < this.vehicles.length; i++) {
      const a = this.vehicles[i];
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const b = this.vehicles[j];
        if (Math.abs(a.y - b.y) > 2.2) continue;
        const minDist = (a.kind === 'bike' ? 1.2 : 1.75) + (b.kind === 'bike' ? 1.2 : 1.75);
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dz);
        if (dist < minDist) {
          const nx = dist > 0.01 ? dx / dist : 1;
          const nz = dist > 0.01 ? dz / dist : 0;
          const overlap = minDist - dist;

          a.x -= nx * overlap * 0.5;
          a.z -= nz * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.z += nz * overlap * 0.5;

          const relSpeed = Math.abs(a.speed - b.speed);
          if (relSpeed > 6) {
            soundEngine.playAction('crash');
            this.spawnBurst((a.x + b.x) * 0.5, 0.85, (a.z + b.z) * 0.5, 0xfbbf24, 6, 9);
            a.speed *= 0.45;
            b.speed *= 0.45;
            if (a === this.drivenVehicle || b === this.drivenVehicle) {
              this.damageVehicle(a, 5);
              this.damageVehicle(b, 5);
              if (a.isPolice || b.isPolice) this.addWanted(1);
            }
          } else {
            a.speed *= 0.85;
            b.speed *= 0.85;
          }

          a.rig.group.position.set(a.x, a.y, a.z);
          b.rig.group.position.set(b.x, b.y, b.z);
        }
      }
    }
  }

  private getRampHeightAt(x: number, z: number): number {
    for (const r of this.city.ramps) {
      const dx = x - r.x;
      const dz = z - r.z;
      const cos = Math.cos(-r.yaw);
      const sin = Math.sin(-r.yaw);
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      if (Math.abs(lx) < r.width * 0.55 && Math.abs(lz) < r.length * 0.55) {
        const t = THREE.MathUtils.clamp((lz + r.length * 0.5) / r.length, 0, 1);
        return 0.24 + t * r.height;
      }
    }
    return 0;
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(0.05, this.clock.getDelta());
      if (!this.paused) {
        this.update(dt);
      }
      this.renderer.render(this.scene, this.camera);
      if (this.isSoftwareGl) this.afterDraw(tick);
      else this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number) {
    if (this.actionCooldown > 0) this.actionCooldown -= dt;
    if (this.buddyCalloutCooldown > 0) this.buddyCalloutCooldown -= dt;
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) this.muzzleFlashMesh.visible = false;
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerMessage = null;
    }
    if (this.subtitleTimer > 0) {
      this.subtitleTimer -= dt;
      if (this.subtitleTimer <= 0) this.subtitle = null;
    }

    if (this.keys.has('KeyQ')) this.cameraOrbitYaw += 1.9 * dt;

    if (
      (this.touchFiring || (this.mouseFiring && !this.pointerMoved)) &&
      !this.drivenVehicle &&
      !this.isWasted &&
      (this.activeWeapon === 'smg' || this.activeWeapon === 'rifle')
    ) {
      this.triggerAction();
    }

    if (!this.isWasted) {
      if (this.drivenVehicle) this.updateDrivenVehicle(dt);
      else this.updatePlayerOnFoot(dt);
    }

    this.updateTrafficAndPolice(dt);
    this.resolveVehicleToVehicleCollisions();
    this.updateBreakableProps(dt);
    this.updatePedestrians(dt);
    this.updateBuddyNpc(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updatePickupsAndMissions(dt);
    this.updateWantedSystem(dt);
    this.updateCamera(dt);

    // GPU-driven Flag Wind Animation + LOD + Frustum Distance Culling
    const elapsed = this.clock.elapsedTime;
    for (let i = 0; i < this.city.flagUniforms.length; i++) {
      this.city.flagUniforms[i].value = elapsed;
    }
    this.city.waterMesh.position.y = -0.25 + Math.sin(elapsed * 1.4) * 0.05;

    this.lodUpdateTimer += dt;
    if (this.lodUpdateTimer >= 0.12) {
      this.lodUpdateTimer = 0;
      this.updateLodAndFrustumCulling();
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 20) {
      this.autoSaveTimer = 0;
      this.triggerAutoSave();
    }

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.08) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }
  }

  private updateLodAndFrustumCulling() {
    this.camera.updateMatrixWorld();
    _projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projScreenMatrix);

    for (let i = 0; i < this.city.lods.length; i++) {
      this.city.lods[i].update(this.camera);
    }

    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();
    for (let i = 0; i < this.peds.length; i++) {
      const p = this.peds[i];
      if (p.dead) continue;
      const distSq = (p.x - px) * (p.x - px) + (p.z - pz) * (p.z - pz);
      if (distSq > 110 * 110) {
        p.rig.group.visible = false;
      } else {
        _cullSphere.center.set(p.x, 1, p.z);
        _cullSphere.radius = 2.5;
        p.rig.group.visible = _frustum.intersectsSphere(_cullSphere);
      }
    }
  }

  private updatePlayerOnFoot(dt: number) {
    let moveX = this.touchInput.x;
    let moveZ = this.touchInput.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;

    const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchInput.boost;
    const baseSpeed = (sprinting ? 11.5 : 6.8) * this.character.stats.speedMultiplier;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0.05) {
      const nx = moveX / len;
      const nz = moveZ / len;
      const sin = Math.sin(this.cameraOrbitYaw);
      const cos = Math.cos(this.cameraOrbitYaw);
      const wx = nx * cos + nz * sin;
      const wz = -nx * sin + nz * cos;

      const targetYaw = Math.atan2(wx, wz);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 13);

      const col = this.resolveBuildingCollision(
        this.playerX + wx * baseSpeed * dt,
        this.playerZ + wz * baseSpeed * dt,
        0.55,
        this.playerY,
      );
      this.playerX = col.x;
      this.playerZ = col.z;

      this.walkPhase += dt * (sprinting ? 14 : 9);
      const swing = Math.sin(this.walkPhase) * 0.72;
      this.playerRig.leftLeg.rotation.x = swing;
      this.playerRig.rightLeg.rotation.x = -swing;
      this.playerRig.leftArm.rotation.x = -swing * 0.75;
      this.playerRig.rightArm.rotation.x = THREE.MathUtils.lerp(this.playerRig.rightArm.rotation.x, swing * 0.4, 0.25);
    } else {
      this.playerRig.leftLeg.rotation.x = THREE.MathUtils.lerp(this.playerRig.leftLeg.rotation.x, 0, 0.2);
      this.playerRig.rightLeg.rotation.x = THREE.MathUtils.lerp(this.playerRig.rightLeg.rotation.x, 0, 0.2);
      this.playerRig.leftArm.rotation.x = THREE.MathUtils.lerp(this.playerRig.leftArm.rotation.x, 0, 0.2);
      this.playerRig.rightArm.rotation.x = THREE.MathUtils.lerp(this.playerRig.rightArm.rotation.x, -0.25, 0.15);
    }

    const groundY = this.getRampHeightAt(this.playerX, this.playerZ);
    if (this.keys.has('Space') && this.playerY <= groundY + 0.05) {
      this.playerVy = 8.0;
    }
    this.playerVy -= 24 * dt;
    this.playerY += this.playerVy * dt;
    if (this.playerY <= groundY) {
      this.playerY = groundY;
      this.playerVy = 0;
    }

    this.playerRig.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;
    soundEngine.updateEngine(false, 0);
  }

  private updateDrivenVehicle(dt: number) {
    const v = this.drivenVehicle!;
    let throttle = -this.touchInput.y;
    let steer = -this.touchInput.x;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) throttle += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) throttle -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) steer += 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) steer -= 1;

    const nitro = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchInput.boost;
    const handbrake = this.keys.has('Space');
    const topSpeed = v.maxSpeed * this.character.stats.speedMultiplier * (nitro ? 1.18 : 1.0);
    const accel = v.accel * (nitro ? 1.25 : 1.0);

    if (throttle > 0) v.speed = Math.min(topSpeed, v.speed + accel * dt);
    else if (throttle < 0) v.speed = Math.max(-topSpeed * 0.4, v.speed - accel * 1.1 * dt);
    else v.speed *= Math.pow(0.35, dt);

    if (handbrake) v.speed *= Math.pow(0.22, dt);

    const steerRate =
      (handbrake ? 2.6 : 1.95) *
      this.character.stats.handlingMultiplier *
      THREE.MathUtils.clamp(Math.abs(v.speed) / 8, 0.3, 1.0);
    if (Math.abs(v.speed) > 0.4) {
      v.yaw += steer * steerRate * (v.speed >= 0 ? 1 : -1) * dt;
    }

    // Sub-stepped horizontal movement prevents wall tunneling
    const stepRadius = v.kind === 'bike' ? 1.05 : 1.85;
    const totalDx = Math.sin(v.yaw) * v.speed * dt;
    const totalDz = Math.cos(v.yaw) * v.speed * dt;
    const steps = Math.max(1, Math.ceil(Math.hypot(totalDx, totalDz) / 0.45));
    let hitWall = false;

    for (let s = 0; s < steps; s++) {
      const col = this.resolveBuildingCollision(
        v.x + totalDx / steps,
        v.z + totalDz / steps,
        stepRadius,
        v.y,
      );
      v.x = col.x;
      v.z = col.z;
      if (col.hit) {
        hitWall = true;
        break;
      }
    }

    if (hitWall && Math.abs(v.speed) > 7) {
      soundEngine.playAction('crash');
      this.spawnBurst(v.x + Math.sin(v.yaw) * 1.6, v.y + 0.8, v.z + Math.cos(v.yaw) * 1.6, 0xfbbf24, 8, 10);
      this.damageVehicle(v, Math.abs(v.speed) * 0.35);
      v.speed = -v.speed * 0.28;
    } else if (hitWall) {
      v.speed *= 0.4;
    }

    // Drift tire smoke
    this.driftSmokeTimer -= dt;
    if (this.driftSmokeTimer <= 0 && ((handbrake && Math.abs(v.speed) > 9) || (Math.abs(steer) > 0.6 && Math.abs(v.speed) > 17))) {
      this.driftSmokeTimer = 0.08;
      this.spawnBurst(v.x - Math.sin(v.yaw) * 1.6, v.y + 0.25, v.z - Math.cos(v.yaw) * 1.6, 0xd1d5db, 2, 2.5, 2);
    }

    // Heavier grounded gravity (38 m/s^2)
    const groundY = this.getRampHeightAt(v.x, v.z);
    if (v.y <= groundY + 0.08 && groundY > 0.35 && Math.abs(v.speed) > 13) {
      v.vy = Math.max(v.vy, Math.abs(v.speed) * 0.38);
    }
    v.vy -= 38 * dt;
    v.y += v.vy * dt;
    if (v.y <= groundY) {
      if (this.airTime > 0.6 && v.y <= 0.15) {
        this.stats.stuntsLanded += 1;
        this.cash += 175;
        this.addRespect(45);
        soundEngine.playAction('pickup');
        this.showBanner(this.language === 'ar' ? 'نطة عالمية! +$175' : 'Stunt Jump Landed! +$175', 'gold', 2.5);
        if (this.activeMission?.id === 'stunt') {
          this.activeMission.progress = this.stats.stuntsLanded - this.missionStuntStartCount;
          if (this.activeMission.progress >= this.activeMission.total) {
            this.completeMission();
          }
        }
      }
      this.airTime = 0;
      v.y = groundY;
      v.vy = 0;
    } else {
      this.airTime += dt;
    }

    v.rig.group.position.set(v.x, v.y, v.z);
    v.rig.group.rotation.y = v.yaw;
    v.rig.group.rotation.x = v.y > 0.25 ? -v.vy * 0.02 : 0;
    v.rig.group.rotation.z = v.kind === 'bike' ? -steer * 0.32 * Math.min(1, Math.abs(v.speed) / 14) : 0;

    v.rig.wheels.forEach((w) => (w.rotation.x += v.speed * dt * 1.8));
    v.rig.frontSteerPivots.forEach((p) => (p.rotation.y = steer * 0.42));

    this.playerX = v.x;
    this.playerY = v.y;
    this.playerZ = v.z;
    this.playerYaw = v.yaw;

    soundEngine.updateEngine(true, Math.abs(v.speed) / v.maxSpeed, v.kind === 'bike');
  }

  private updateTrafficAndPolice(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    for (const v of this.vehicles) {
      if (v.isPolice && v.rig.sirenRed && v.rig.sirenBlue && !v.exploded) {
        v.flashTimer += dt * 10;
        const flip = Math.sin(v.flashTimer) > 0;
        const activeChase = !v.isTraffic || this.wantedStars > 0;
        v.rig.sirenRed.emissiveIntensity = activeChase && flip ? 2.2 : 0.15;
        v.rig.sirenBlue.emissiveIntensity = activeChase && !flip ? 2.2 : 0.15;
      }

      if (!v.exploded && v.hp < 50) {
        v.smokeTimer -= dt;
        if (v.smokeTimer <= 0) {
          v.smokeTimer = 0.14;
          const color = v.hp < 25 ? 0xf97316 : 0x334155;
          this.spawnBurst(v.x + Math.sin(v.yaw) * 1.4, v.y + 1.0, v.z + Math.cos(v.yaw) * 1.4, color, 2, 2.2, -3);
        }
      }

      if (v === this.drivenVehicle) continue;

      if (v.y > 0 || v.vy !== 0) {
        v.vy -= 38 * dt;
        v.y += v.vy * dt;
        if (v.y <= 0) {
          v.y = 0;
          v.vy = 0;
        }
        v.rig.group.position.y = v.y;
      }

      if (v.exploded) continue;

      if (v.isPolice && !v.isTraffic && this.wantedStars > 0) {
        const dx = px - v.x;
        const dz = pz - v.z;
        const dist = Math.hypot(dx, dz);
        const targetYaw = Math.atan2(dx, dz);
        let diff = targetYaw - v.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.yaw += THREE.MathUtils.clamp(diff, -2.2 * dt, 2.2 * dt);

        if (dist > 17) {
          v.speed = 20 + this.wantedStars * 1.4;
          const col = this.resolveBuildingCollision(
            v.x + Math.sin(v.yaw) * v.speed * dt,
            v.z + Math.cos(v.yaw) * v.speed * dt,
            1.8,
            v.y,
          );
          if (col.hit) v.yaw += 1.1 * dt;
          v.x = col.x;
          v.z = col.z;
          v.rig.group.position.set(v.x, v.y, v.z);
          v.rig.group.rotation.y = v.yaw;
          v.rig.wheels.forEach((w) => (w.rotation.x += v.speed * dt * 1.8));
        } else {
          v.speed *= 0.85;
          if (v.deployedCops < 2) {
            const activeCops = this.peds.filter((p) => p.isPolice && !p.dead).length;
            if (activeCops < 5) {
              v.deployedCops += 1;
              const side = v.deployedCops === 1 ? 2.4 : -2.4;
              this.spawnSingleNpc(300 + v.deployedCops, {
                isPolice: true,
                nearX: v.x + Math.cos(v.yaw) * side,
                nearZ: v.z - Math.sin(v.yaw) * side,
              });
            }
          }
        }
        continue;
      }

      if (v.isTraffic) {
        v.speed = 11.0;
        const nx = v.x + Math.sin(v.yaw) * v.speed * dt;
        const nz = v.z + Math.cos(v.yaw) * v.speed * dt;
        if (Math.abs(nx) > 116 || Math.abs(nz) > 116) {
          v.yaw += Math.PI;
          v.x = THREE.MathUtils.clamp(v.x, -114, 114);
          v.z = THREE.MathUtils.clamp(v.z, -114, 114);
        } else {
          const col = this.resolveBuildingCollision(nx, nz, 1.8, v.y);
          if (col.hit) v.yaw += Math.PI / 2;
          else {
            v.x = col.x;
            v.z = col.z;
          }
        }
        v.rig.group.position.set(v.x, v.y, v.z);
        v.rig.group.rotation.y = v.yaw;
        if ((v.x - px) * (v.x - px) + (v.z - pz) * (v.z - pz) < 85 * 85) {
          v.rig.wheels.forEach((w) => (w.rotation.x += v.speed * dt * 1.5));
        }
      }
    }
  }

  private updateBreakableProps(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();
    for (const pr of this.city.props) {
      if (pr.broken) {
        if (pr.life > 0) {
          pr.life -= dt;
          pr.vy -= 22 * dt;
          pr.mesh.position.x += pr.vx * dt;
          pr.mesh.position.y = Math.max(0.15, pr.mesh.position.y + pr.vy * dt);
          pr.mesh.position.z += pr.vz * dt;
          pr.mesh.rotation.x += 5 * dt;
          pr.mesh.rotation.z += 4 * dt;
        }
        continue;
      }
      if (this.drivenVehicle && Math.hypot(pr.x - px, pr.z - pz) < 2.2 && Math.abs(this.drivenVehicle.speed) > 4) {
        pr.broken = true;
        const dir = Math.atan2(pr.x - px, pr.z - pz);
        pr.vx = Math.sin(dir) * 10;
        pr.vy = 7;
        pr.vz = Math.cos(dir) * 10;
        soundEngine.playAction('crash');
        if (pr.kind === 'hydrant') {
          this.spawnBurst(pr.x, 0.8, pr.z, 0x38bdf8, 16, 9);
        }
      }
    }
  }

  private updateBuddyNpc(dt: number) {
    const buddy = this.buddyNpc;
    if (!buddy || this.drivenVehicle) return;

    const px = this.playerX;
    const pz = this.playerZ;
    buddy.rig.group.visible = true;

    if (!this.buddyActive) {
      const d = Math.hypot(buddy.x - px, buddy.z - pz);
      if (d < 8) {
        buddy.rig.group.rotation.y = Math.atan2(px - buddy.x, pz - buddy.z);
        if (d < 3.4 && this.buddyCalloutCooldown <= 0) {
          this.buddyCalloutCooldown = 14;
          this.speak(
            this.getBuddyName(),
            this.language === 'ar'
              ? 'أنا صاحبك عبقرينو! دوس G عشان أجي معاك وننضف الشوارع سوا.'
              : 'Press G anytime and I will roll with you as your co-op backup!',
            '#14b8a6',
            3.6,
          );
        }
      }
      return;
    }

    // Active Co-op Buddy: Follow player closely + engage nearby threats!
    const followTargetX = px - Math.cos(this.playerYaw) * 2.4 - Math.sin(this.playerYaw) * 1.4;
    const followTargetZ = pz + Math.sin(this.playerYaw) * 2.4 - Math.cos(this.playerYaw) * 1.4;
    const distToFollow = Math.hypot(followTargetX - buddy.x, followTargetZ - buddy.z);

    if (distToFollow > 32) {
      const col = this.resolveBuildingCollision(followTargetX, followTargetZ, 0.5);
      buddy.x = col.x;
      buddy.z = col.z;
    } else if (distToFollow > 1.3) {
      const moveYaw = Math.atan2(followTargetX - buddy.x, followTargetZ - buddy.z);
      const spd = distToFollow > 8 ? 9.5 : 6.4;
      const col = this.resolveBuildingCollision(
        buddy.x + Math.sin(moveYaw) * spd * dt,
        buddy.z + Math.cos(moveYaw) * spd * dt,
        0.48,
      );
      buddy.x = col.x;
      buddy.z = col.z;
      buddy.yaw = moveYaw;
      buddy.walkPhase += dt * spd * 1.5;
      const swing = Math.sin(buddy.walkPhase) * 0.65;
      buddy.rig.leftLeg.rotation.x = swing;
      buddy.rig.rightLeg.rotation.x = -swing;
    } else {
      buddy.rig.leftLeg.rotation.x = THREE.MathUtils.lerp(buddy.rig.leftLeg.rotation.x, 0, 0.2);
      buddy.rig.rightLeg.rotation.x = THREE.MathUtils.lerp(buddy.rig.rightLeg.rotation.x, 0, 0.2);
    }

    // Buddy Auto-Aim & Fire at closest active Hostile / Pursuing Police
    let targetEnemy: PedEntity | null = null;
    let bestD = 26;
    for (const ped of this.peds) {
      if (ped.dead) continue;
      if (ped.isHostile || (ped.isPolice && this.wantedStars > 0)) {
        const d = Math.hypot(ped.x - buddy.x, ped.z - buddy.z);
        if (d < bestD) {
          bestD = d;
          targetEnemy = ped;
        }
      }
    }

    buddy.shootCooldown -= dt;
    if (targetEnemy) {
      const aimYaw = Math.atan2(targetEnemy.x - buddy.x, targetEnemy.z - buddy.z);
      buddy.yaw = aimYaw;
      buddy.rig.rightArm.rotation.x = -1.45;
      if (buddy.shootCooldown <= 0) {
        buddy.shootCooldown = 0.45;
        this.spawnBurst(buddy.x + Math.sin(aimYaw) * 0.8, 1.32, buddy.z + Math.cos(aimYaw) * 0.8, 0x14b8a6, 2, 4);
        this.spawnPooledProjectile(
          buddy.x + Math.sin(aimYaw) * 0.85,
          1.32,
          buddy.z + Math.cos(aimYaw) * 0.85,
          Math.sin(aimYaw) * 52,
          Math.cos(aimYaw) * 52,
          aimYaw,
          0.95,
          24,
          0x14b8a6,
          false,
          false,
          true,
        );
        if (this.buddyCalloutCooldown <= 0) {
          this.buddyCalloutCooldown = 11;
          this.speak(
            this.getBuddyName(),
            this.language === 'ar' ? 'خد ساتر يا صاحبي! أنا بضرب معاك وبغطي ظهرك!' : 'Take cover partner, I got these guys covered!',
            '#06b6d4',
            3.2,
          );
        }
      }
    } else {
      buddy.rig.rightArm.rotation.x = THREE.MathUtils.lerp(buddy.rig.rightArm.rotation.x, -0.25, 0.2);
    }

    buddy.rig.group.position.set(buddy.x, 0, buddy.z);
    buddy.rig.group.rotation.y = buddy.yaw;
  }

  private updatePedestrians(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    if (this.partnerNpc) {
      const d = Math.hypot(this.partnerNpc.x - px, this.partnerNpc.z - pz);
      if (d < 12) {
        this.partnerNpc.rig.group.rotation.y = Math.atan2(px - this.partnerNpc.x, pz - this.partnerNpc.z);
      }
    }

    for (let i = this.peds.length - 1; i >= 0; i--) {
      const ped = this.peds[i];
      if (ped.dead) {
        if (ped.fallProgress < 1) {
          ped.fallProgress = Math.min(1, ped.fallProgress + dt * 2.8);
          ped.rig.group.rotation.x = (Math.PI / 2) * ped.fallProgress;
          ped.rig.group.position.y = 0.22 * ped.fallProgress;
        }
        ped.deadTimer -= dt;
        if (ped.deadTimer <= 0) {
          this.scene.remove(ped.rig.group);
          this.peds.splice(i, 1);
          if (this.peds.length < 18) {
            this.spawnSingleNpc(Math.floor(Math.random() * 100));
          }
        }
        continue;
      }

      const dToPlayer = Math.hypot(ped.x - px, ped.z - pz);

      const canShoot =
        (ped.isPolice && this.wantedStars > 0 && dToPlayer < 32) ||
        (ped.isHostile &&
          dToPlayer < 24 &&
          (this.activeMission?.id === 'sweep' || this.activeMission?.id === 'coop-hack' || this.wantedStars > 0));

      if (canShoot) {
        const targetYaw = Math.atan2(px - ped.x, pz - ped.z);
        ped.yaw = targetYaw;
        ped.rig.group.rotation.y = ped.yaw;
        ped.rig.rightArm.rotation.x = -1.45;
        ped.shootCooldown -= dt;
        if (ped.shootCooldown <= 0 && !this.isWasted) {
          ped.shootCooldown = ped.isPolice ? 1.25 : 1.65;
          this.spawnPooledProjectile(
            ped.x,
            1.32,
            ped.z,
            Math.sin(targetYaw) * 34,
            Math.cos(targetYaw) * 34,
            targetYaw,
            1.15,
            ped.isPolice ? 9 : 7,
            ped.isPolice ? 0x38bdf8 : 0xf43f5e,
            false,
            true,
            false,
          );
        }
        if (ped.isPolice && dToPlayer > 14) {
          const nx = ped.x + Math.sin(ped.yaw) * ped.speed * dt;
          const nz = ped.z + Math.cos(ped.yaw) * ped.speed * dt;
          const col = this.resolveBuildingCollision(nx, nz, 0.45);
          ped.x = col.x;
          ped.z = col.z;
          ped.walkPhase += dt * ped.speed * 3.5;
          const s = Math.sin(ped.walkPhase) * 0.6;
          ped.rig.leftLeg.rotation.x = s;
          ped.rig.rightLeg.rotation.x = -s;
          ped.rig.group.position.set(ped.x, 0, ped.z);
        }
        continue;
      }

      ped.turnTimer -= dt;
      if (ped.turnTimer <= 0) {
        ped.yaw += (Math.random() - 0.5) * 2.2;
        ped.turnTimer = 2.5 + Math.random() * 4;
      }

      if (this.drivenVehicle && dToPlayer < 2.2 && Math.abs(this.drivenVehicle.speed) > 9) {
        this.damagePed(ped, 100, Math.sin(this.drivenVehicle.yaw), Math.cos(this.drivenVehicle.yaw));
        soundEngine.playAction('crash');
        continue;
      }

      const moveSpeed = ped.fleeTimer > 0 ? ped.speed * 2.3 : ped.speed;
      if (ped.fleeTimer > 0) ped.fleeTimer -= dt;

      const nx = ped.x + Math.sin(ped.yaw) * moveSpeed * dt;
      const nz = ped.z + Math.cos(ped.yaw) * moveSpeed * dt;
      const col = this.resolveBuildingCollision(nx, nz, 0.45);
      if (col.hit || Math.abs(nx) > 120 || Math.abs(nz) > 120) {
        ped.yaw += Math.PI * 0.75;
      } else {
        ped.x = col.x;
        ped.z = col.z;
      }

      if (ped.rig.group.visible) {
        ped.walkPhase += dt * moveSpeed * 3.5;
        const s = Math.sin(ped.walkPhase) * 0.6;
        ped.rig.leftLeg.rotation.x = s;
        ped.rig.rightLeg.rotation.x = -s;
        ped.rig.leftArm.rotation.x = ped.fleeTimer > 0 ? -2.4 : -s * 0.6;
        ped.rig.rightArm.rotation.x = ped.fleeTimer > 0 ? -2.4 : ped.isHostile ? -1.1 : s * 0.6;
      }
      ped.rig.group.position.x = ped.x;
      ped.rig.group.position.z = ped.z;
      ped.rig.group.rotation.y = ped.yaw;
    }
  }

  private updateProjectiles(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const p = this.projectilePool[i];
      if (!p.active) continue;

      p.life -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);

      let hit = p.life <= 0;
      const wallCol = this.resolveBuildingCollision(p.x, p.z, 0.15);
      if (wallCol.hit) hit = true;

      if (!hit && p.fromEnemy) {
        if (Math.hypot(px - p.x, pz - p.z) < (this.drivenVehicle ? 2.0 : 0.9)) {
          hit = true;
          this.damagePlayer(p.damage);
        }
      } else if (!hit && !p.fromEnemy) {
        if (!p.fromBuddy) {
          for (const v of this.vehicles) {
            if (v === this.drivenVehicle || v.exploded) continue;
            if (Math.hypot(v.x - p.x, v.z - p.z) < (v.kind === 'bike' ? 1.1 : 1.9)) {
              hit = true;
              this.spawnBurst(p.x, p.y, p.z, 0xfbbf24, 4, 7);
              this.damageVehicle(v, p.damage);
              if (v.isPolice) this.addWanted(1);
              break;
            }
          }
        }
        if (!hit) {
          for (const ped of this.peds) {
            if (ped.dead) continue;
            if (p.fromBuddy && !ped.isHostile && !ped.isPolice) continue;
            if (Math.hypot(ped.x - p.x, ped.z - p.z) < 1.15) {
              hit = true;
              if (!p.explosive) {
                this.damagePed(ped, p.damage, p.vx * 0.02, p.vz * 0.02);
              }
              break;
            }
          }
        }
      }

      if (hit) {
        if (p.explosive) {
          this.triggerExplosion(p.x, p.z);
        }
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const pt = this.particlePool[i];
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        pt.mesh.visible = false;
        continue;
      }
      pt.vy -= pt.gravity * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y = Math.max(0.05, pt.mesh.position.y + pt.vy * dt);
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.scale.setScalar(Math.max(0.01, (pt.life / pt.maxLife) * 1.4));
    }
  }

  private updatePickupsAndMissions(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    for (let i = this.city.pickups.length - 1; i >= 0; i--) {
      const pk = this.city.pickups[i];
      if (pk.cooldown > 0) {
        pk.cooldown -= dt;
        pk.mesh.visible = pk.cooldown <= 0;
        continue;
      }
      pk.mesh.rotation.y += dt * 2.2;
      pk.mesh.position.y = (pk.temporary ? 0.65 : 1.15) + Math.sin(this.clock.elapsedTime * 3 + pk.x) * 0.15;

      if (Math.hypot(pk.x - px, pk.z - pz) < 2.4) {
        soundEngine.playAction('pickup');
        if (pk.kind === 'health') {
          this.health = Math.min(this.maxHealth, this.health + 45);
          this.showBanner(this.language === 'ar' ? '+45 صحة' : '+45 Health', 'success', 2);
        } else if (pk.kind === 'armor') {
          this.armor = Math.min(100, this.armor + 50);
          this.showBanner(this.language === 'ar' ? '+50 درع' : '+50 Armor', 'info', 2);
        } else if (pk.kind === 'cash') {
          const val = pk.value ?? 250;
          this.cash += val;
          this.showBanner(`+$${val}`, 'gold', 1.8);
        } else if (pk.kind === 'wanted') {
          this.wantedStars = 0;
          soundEngine.setPoliceSiren(false);
          this.showBanner(this.language === 'ar' ? 'اختفيت عن الشرطة!' : 'Wanted Level Cleared!', 'success', 2.5);
        }

        if (pk.temporary) {
          this.scene.remove(pk.mesh);
          this.city.pickups.splice(i, 1);
        } else {
          pk.cooldown = 18;
          pk.mesh.visible = false;
        }
      }
    }

    const pulse = 1 + Math.sin(this.clock.elapsedTime * 3.5) * 0.08;
    this.city.missionSpots.forEach((m) => {
      m.ringMesh.visible = !this.activeMission;
      m.ringMesh.scale.set(pulse, pulse, 1);
    });

    if (this.activeMission) {
      if (this.activeMission.timeLeft > 0) {
        this.activeMission.timeLeft -= dt;
        if (this.activeMission.timeLeft <= 0) {
          this.failMission(this.language === 'ar' ? 'الوقت خلص! حاول تاني يا بطل.' : 'Time ran out! Try again.');
          return;
        }
      }

      if (this.missionTargets.length > 0) {
        const current = this.missionTargets[this.missionCheckpointsDone];
        if (current) {
          current.marker.rotation.y += dt * 1.5;
          if (Math.hypot(current.x - px, current.z - pz) < 4.5) {
            current.marker.visible = false;
            this.missionCheckpointsDone += 1;
            this.activeMission.progress = this.missionCheckpointsDone;
            soundEngine.playAction('pickup');
            if (this.missionCheckpointsDone >= this.missionCheckpointsTotal) {
              this.completeMission();
            } else {
              this.missionTargets[this.missionCheckpointsDone].marker.visible = true;
            }
          }
        }
      }
    }
  }

  private updateWantedSystem(dt: number) {
    soundEngine.setPoliceSiren(this.wantedStars > 0 && !this.isWasted);
    if (this.wantedStars <= 0) {
      this.wantedHideTimer = 0;
      return;
    }
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();
    let nearCop = false;
    for (const v of this.vehicles) {
      if (v.isPolice && !v.isTraffic && !v.exploded && Math.hypot(v.x - px, v.z - pz) < 36) {
        nearCop = true;
        break;
      }
    }
    for (const p of this.peds) {
      if (p.isPolice && !p.dead && Math.hypot(p.x - px, p.z - pz) < 36) {
        nearCop = true;
        break;
      }
    }
    if (!nearCop) {
      this.wantedHideTimer += dt / 11;
      if (this.wantedHideTimer >= 1) {
        this.wantedStars = 0;
        this.wantedHideTimer = 0;
        soundEngine.setPoliceSiren(false);
        this.showBanner(this.language === 'ar' ? 'هربت من الشرطة بسلام!' : 'Escaped the Heat!', 'success', 2.5);
      }
    } else {
      this.wantedHideTimer = Math.max(0, this.wantedHideTimer - dt * 0.15);
    }
  }

  private damagePlayer(amt: number) {
    if (this.isWasted) return;
    if (this.armor > 0) {
      const absorb = Math.min(this.armor, amt);
      this.armor -= absorb;
      this.health -= amt - absorb;
    } else {
      this.health -= amt;
    }
    if (this.health <= 0) {
      this.health = 0;
      this.isWasted = true;
      soundEngine.stopEngine();
      soundEngine.setPoliceSiren(false);
      this.emitHud();
    }
  }

  private updateCamera(dt: number) {
    const px = this.getPlayerPosX();
    const py = this.drivenVehicle ? this.drivenVehicle.y : this.playerY;
    const pz = this.getPlayerPosZ();

    const inCar = Boolean(this.drivenVehicle);
    const speedRatio = this.drivenVehicle ? Math.min(1, Math.abs(this.drivenVehicle.speed) / 34) : 0;
    const targetFov = inCar ? 64 + speedRatio * 12 : 60;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
    this.camera.updateProjectionMatrix();

    const dist = inCar ? 9.4 + speedRatio * 1.5 : 5.6;
    const height = inCar ? 3.9 : 2.75;

    const camYaw = inCar && !this.draggingCam ? this.drivenVehicle!.yaw + Math.PI + this.cameraOrbitYaw * 0.35 : this.cameraOrbitYaw;
    const desiredX = px + Math.sin(camYaw) * dist;
    const desiredZ = pz + Math.cos(camYaw) * dist;
    const desiredY = py + height + Math.sin(this.cameraPitch) * 1.8;

    _vec3A.set(desiredX, desiredY, desiredZ);
    this.camera.position.lerp(_vec3A, 1 - Math.exp(-8 * dt));
    _vec3B.set(px, py + (inCar ? 1.1 : 1.35), pz);
    this.camera.lookAt(_vec3B);
  }

  private emitHud() {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    let nearbyVehiclePrompt: string | null = null;
    if (!this.drivenVehicle) {
      for (const v of this.vehicles) {
        if (!v.exploded && Math.hypot(v.x - px, v.z - pz) < 4.8) {
          nearbyVehiclePrompt = v.name;
          break;
        }
      }
    }

    let nearbyRestaurantPrompt: HudSnapshot['nearbyRestaurantPrompt'] = null;
    if (!this.drivenVehicle) {
      for (const r of this.city.restaurants) {
        if (Math.hypot(r.x - px, r.z - pz) < 3.4) {
          nearbyRestaurantPrompt = { name: r.name, cost: r.cost, heal: r.heal };
          break;
        }
      }
    }

    let availableMissionPrompt: HudSnapshot['availableMissionPrompt'] = null;
    if (!this.activeMission) {
      for (const m of this.city.missionSpots) {
        if (Math.hypot(m.x - px, m.z - pz) < 5.2) {
          availableMissionPrompt = { title: m.title, reward: m.reward, isStory: m.isStory, isCoop: m.isCoop };
          break;
        }
      }
    }

    const blips: MinimapBlip[] = [];
    this.vehicles.forEach((v) => {
      if (v === this.drivenVehicle || v.exploded) return;
      blips.push({
        x: v.x,
        z: v.z,
        type: v.isPolice && !v.isTraffic ? 'police' : 'vehicle',
      });
    });
    this.peds.forEach((ped) => {
      if (!ped.dead && (ped.isHostile || ped.isPolice)) {
        blips.push({ x: ped.x, z: ped.z, type: ped.isPolice ? 'police' : 'hostile' });
      }
    });
    if (this.buddyNpc && !this.drivenVehicle) {
      blips.push({ x: this.buddyNpc.x, z: this.buddyNpc.z, type: 'buddy' });
    }
    this.city.restaurants.forEach((r) => blips.push({ x: r.x, z: r.z, type: 'food' }));
    this.city.pickups.forEach((pk) => {
      if (pk.cooldown <= 0) blips.push({ x: pk.x, z: pk.z, type: 'pickup' });
    });
    if (!this.activeMission) {
      this.city.missionSpots.forEach((m) =>
        blips.push({ x: m.x, z: m.z, type: m.isStory ? 'story' : m.isCoop ? 'coop' : 'mission' }),
      );
    } else if (this.missionTargets[this.missionCheckpointsDone]) {
      const t = this.missionTargets[this.missionCheckpointsDone];
      blips.push({ x: t.x, z: t.z, type: 'target' });
    }

    this.onHudUpdate({
      health: Math.round(this.health),
      maxHealth: this.maxHealth,
      armor: Math.round(this.armor),
      cash: this.cash,
      respect: this.respect,
      level: this.currentLevel,
      wantedStars: this.wantedStars,
      inVehicle: Boolean(this.drivenVehicle),
      vehicleName: this.drivenVehicle?.name ?? '',
      vehicleKind: this.drivenVehicle?.kind ?? null,
      vehicleSpeedKmh: this.drivenVehicle ? Math.round(Math.abs(this.drivenVehicle.speed) * 3.8) : 0,
      vehicleHp: this.drivenVehicle ? Math.round(this.drivenVehicle.hp) : 100,
      activeWeapon: this.activeWeapon,
      radioStation: this.radioStation,
      timeOfDay: this.timeOfDay,
      storyChapter: this.storyChapter,
      buddyActive: this.buddyActive,
      completedMissionIds: [...this.completedMissionIds],
      activeMission: this.activeMission ? { ...this.activeMission } : null,
      availableMissionPrompt,
      nearbyRestaurantPrompt,
      nearbyVehiclePrompt,
      bannerMessage: this.bannerMessage,
      subtitle: this.subtitle,
      playerX: px,
      playerZ: pz,
      playerYaw: this.playerYaw,
      blips,
      buildingsForMap: this.city.buildings,
      isWasted: this.isWasted,
      stats: { ...this.stats },
    });
  }

  public dispose() {
    this.disposed = true;
    this.triggerAutoSave();
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    soundEngine.stopEngine();
    soundEngine.setPoliceSiren(false);

    // Properly dispose pooled geometries, materials, and all textures to prevent memory leaks
    this.sharedParticleGeo.dispose();
    this.sharedBulletGeo.dispose();
    this.sharedRocketGeo.dispose();
    this.particlePool.forEach((p) => (p.mesh.material as THREE.Material).dispose());
    this.projectilePool.forEach((p) => (p.mesh.material as THREE.Material).dispose());
    this.city.pool.dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
