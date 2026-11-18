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
  TimeOfDay,
  VehicleKind,
  WeaponId,
} from '../types/game';
import { createCityTextures } from './textures';
import { buildCityWorld, BuiltCity, ROAD_CENTERS, WORLD_LIMIT } from './city';
import { CharacterRig, createCharacterMesh, createPickupMesh, createVehicleMesh, VehicleRig } from './models';
import { soundEngine } from './audio';

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
  deadTimer: number;
  isHostile: boolean;
  isPolice: boolean;
  shootCooldown: number;
  fleeTimer: number;
  turnTimer: number;
}

interface ProjectileEntity {
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
}

interface ParticleBurst {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

const VEHICLE_NAMES: Record<VehicleKind, string> = {
  sports: 'Veloce GT',
  muscle: 'Dominator V8',
  police: 'KTA PD Interceptor',
  taxi: 'Bay Cab',
  suv: 'Titan 4x4',
  bike: 'Hayabusa R1',
};

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

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
  private city!: BuiltCity;

  private character: CharacterProfile;
  private language: Language;
  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onPauseRequest: () => void;

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
  private wantedStars = 0;
  private wantedHideTimer = 0;
  private isWasted = false;
  private actionCooldown = 0;
  private activeWeapon: WeaponId = 'pistol';
  private radioStation: RadioStationId = 'cairo';
  private timeOfDay: TimeOfDay = 'sunset';

  private vehicles: VehicleEntity[] = [];
  private peds: PedEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleBurst[] = [];
  private drivenVehicle: VehicleEntity | null = null;

  private cameraOrbitYaw = 0;
  private cameraPitch = 0.28;
  private draggingCam = false;
  private pointerDownX = 0;
  private pointerMoved = false;
  private keys = new Set<string>();
  private touchInput = { x: 0, y: 0, boost: false };
  private touchFiring = false;
  private mouseFiring = false;

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
    onHudUpdate: (snapshot: HudSnapshot) => void;
    onPauseRequest: () => void;
  }) {
    this.container = options.container;
    this.character = options.character;
    this.language = options.language;
    this.onHudUpdate = options.onHudUpdate;
    this.onPauseRequest = options.onPauseRequest;
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
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      62,
      (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight),
      0.2,
      460,
    );

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.setupLighting();
    const textures = createCityTextures(this.renderer);
    this.city = buildCityWorld(this.scene, textures);
    this.applyTimeOfDay(this.timeOfDay);

    this.spawnPlayer();
    this.spawnInitialVehicles();
    this.spawnPedestrians();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    soundEngine.setRadioStation(this.radioStation);
    this.speak(
      this.character.name[this.language],
      this.language === 'ar'
        ? 'يلا بينا يا معلم، المدينة كلها قدامنا النهارده!'
        : "Sunhaven Bay is wide open today. Let's make some noise!",
      this.character.accentHex,
      4.5,
    );
    this.emitHud();
    this.startLoop();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xfde68a, 0x1e293b, 0.78);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffd7a3, 1.85);
    this.sunLight.position.set(110, 95, 70);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 360;
    this.sunLight.shadow.camera.left = -155;
    this.sunLight.shadow.camera.right = 155;
    this.sunLight.shadow.camera.top = 155;
    this.sunLight.shadow.camera.bottom = -155;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
  }

  public applyTimeOfDay(mode: TimeOfDay) {
    this.timeOfDay = mode;
    if (mode === 'sunset') {
      const sky = 0xd97757;
      this.scene.background = new THREE.Color(sky);
      this.scene.fog = new THREE.FogExp2(sky, 0.0042);
      this.sunLight.color.setHex(0xffb36b);
      this.sunLight.intensity = 2.1;
      this.sunLight.position.set(130, 55, 45);
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.75;
    } else if (mode === 'day') {
      const sky = 0x7dd3fc;
      this.scene.background = new THREE.Color(sky);
      this.scene.fog = new THREE.FogExp2(sky, 0.0032);
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 2.3;
      this.sunLight.position.set(70, 140, 80);
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.85;
    } else {
      const sky = 0x090d1f;
      this.scene.background = new THREE.Color(sky);
      this.scene.fog = new THREE.FogExp2(sky, 0.0055);
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
    this.playerRig = createCharacterMesh(this.character.outfitColors);
    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.playerRig.group);
    this.syncEquippedWeaponMesh();
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
  ): VehicleEntity {
    const rig = createVehicleMesh(kind, color);
    rig.group.position.set(x, 0, z);
    rig.group.rotation.y = yaw;
    this.scene.add(rig.group);

    const spec = {
      sports: { maxSpeed: 39, accel: 27 },
      muscle: { maxSpeed: 35, accel: 25 },
      police: { maxSpeed: 36, accel: 25 },
      taxi: { maxSpeed: 29, accel: 19 },
      suv: { maxSpeed: 28, accel: 18 },
      bike: { maxSpeed: 43, accel: 32 },
    }[kind];

    const ent: VehicleEntity = {
      id,
      kind,
      name: VEHICLE_NAMES[kind],
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
      isTraffic,
      isPolice: kind === 'police',
      trafficDir,
      flashTimer: 0,
    };
    this.vehicles.push(ent);
    return ent;
  }

  private spawnInitialVehicles() {
    this.createVehicle('hero-sports', 'sports', 0xf97316, -19, -52, Math.PI / 2, false);
    this.createVehicle('hero-bike', 'bike', 0xef4444, -24, -46, Math.PI / 4, false);
    this.createVehicle('hero-muscle', 'muscle', 0x2563eb, 14, -52, -Math.PI / 2, false);
    this.createVehicle('hero-suv', 'suv', 0x10b981, 28, 72, 0, false);
    this.createVehicle('hero-taxi', 'taxi', 0xfacc15, -52, -16, 0, false);
    this.createVehicle('hero-sports-2', 'sports', 0xec4899, 84, -14, Math.PI, false);
    this.createVehicle('hero-bike-2', 'bike', 0x14b8a6, -84, -52, 0, false);

    const palette = [0xef4444, 0x3b82f6, 0x10b981, 0xeab308, 0xa855f7, 0xf8fafc, 0x64748b];
    const kinds: VehicleKind[] = ['taxi', 'suv', 'muscle', 'sports', 'bike'];
    for (let i = 0; i < 12; i++) {
      const roadVal = ROAD_CENTERS[i % ROAD_CENTERS.length];
      const along = -95 + ((i * 37) % 190);
      const horizontal = i % 2 === 0;
      const dir = horizontal ? (i % 4 === 0 ? 1 : 3) : i % 4 === 1 ? 0 : 2;
      const laneOffset = dir === 0 || dir === 3 ? -2.8 : 2.8;
      const x = horizontal ? along : roadVal + laneOffset;
      const z = horizontal ? roadVal + laneOffset : along;
      const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][dir];
      const kind = i === 11 ? 'police' : kinds[i % kinds.length];
      this.createVehicle(`traffic-${i}`, kind, palette[i % palette.length], x, z, yaw, true, dir);
    }
  }

  private spawnSingleNpc(idx: number, forceHostile = false, nearX?: number, nearZ?: number): PedEntity {
    const jacketColors = [0x0ea5e9, 0xf43f5e, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xe2e8f0];
    const pantsColors = [0x1e293b, 0x334155, 0x475569, 0x0f172a];
    const isHostile = forceHostile || idx % 5 === 0;

    let x = nearX;
    let z = nearZ;
    if (x === undefined || z === undefined) {
      const road = ROAD_CENTERS[idx % ROAD_CENTERS.length];
      const side = idx % 2 === 0 ? 7.6 : -7.6;
      const posAlong = -100 + ((idx * 29) % 200);
      const horizontal = idx % 3 !== 0;
      x = horizontal ? posAlong : road + side;
      z = horizontal ? road + side : posAlong;
    }

    const rig = createCharacterMesh({
      jacket: isHostile ? 0x7f1d1d : jacketColors[idx % jacketColors.length],
      shirt: isHostile ? 0x18181b : 0xf8fafc,
      pants: pantsColors[idx % pantsColors.length],
      skin: idx % 2 === 0 ? 0xd9a273 : 0xb57a4c,
      hair: 0x1c1917,
      sunglasses: idx % 4 === 0 || isHostile,
      isHostile,
    });
    if (isHostile) {
      rig.weaponMeshes.pistol.visible = true;
    }
    rig.group.position.set(x, 0, z);
    this.scene.add(rig.group);
    const ped: PedEntity = {
      id: `ped-${Date.now()}-${idx}`,
      rig,
      x,
      z,
      yaw: Math.random() * Math.PI * 2,
      speed: 2.1 + Math.random() * 1.1,
      walkPhase: Math.random() * 10,
      hp: isHostile ? 80 : 45,
      dead: false,
      deadTimer: 0,
      isHostile,
      isPolice: false,
      shootCooldown: 1.5,
      fleeTimer: 0,
      turnTimer: 2 + Math.random() * 4,
    };
    this.peds.push(ped);
    return ped;
  }

  private spawnPedestrians() {
    for (let i = 0; i < 24; i++) {
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
    else if (code === 'KeyE') this.tryStartNearbyMission();
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
      this.pointerMoved = false;
      this.mouseFiring = true;
      if (!this.drivenVehicle && e.pointerType !== 'touch') {
        this.triggerAction();
      }
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.draggingCam) return;
    const dx = e.clientX - this.pointerDownX;
    if (Math.abs(dx) > 4) this.pointerMoved = true;
    this.pointerDownX = e.clientX;
    this.cameraOrbitYaw -= dx * 0.007;
  };

  private handlePointerUp = () => {
    this.draggingCam = false;
    this.mouseFiring = false;
  };

  public setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.keys.clear();
      this.mouseFiring = false;
      this.touchFiring = false;
      soundEngine.stopEngine();
    }
  }

  public setLanguage(lang: Language) {
    this.language = lang;
    this.emitHud();
  }

  public setWeapon(w: WeaponId) {
    this.activeWeapon = w;
    this.syncEquippedWeaponMesh();
    this.emitHud();
  }

  public cycleWeapon() {
    const order: WeaponId[] = ['melee', 'pistol', 'smg', 'shotgun', 'rifle', 'rpg'];
    const next = order[(order.indexOf(this.activeWeapon) + 1) % order.length];
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

  public toggleVehicleEntry() {
    if (this.drivenVehicle) {
      const v = this.drivenVehicle;
      this.playerX = v.x - Math.cos(v.yaw) * 2.2;
      this.playerZ = v.z + Math.sin(v.yaw) * 2.2;
      this.playerY = 0;
      this.playerYaw = v.yaw;
      this.playerRig.group.visible = true;
      this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
      v.speed *= 0.6;
      this.drivenVehicle = null;
      soundEngine.playAction('door');
      soundEngine.stopEngine();
      this.emitHud();
      return;
    }

    let best: VehicleEntity | null = null;
    let bestDist = 4.8;
    for (const v of this.vehicles) {
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
        this.language === 'ar' ? 'يا عم انت بتاخد عربيتي كده عادي؟!' : 'Hey! You just took my ride!',
        '#f87171',
        3.2,
      );
    } else if (best.kind === 'sports' || best.kind === 'bike') {
      this.speak(
        this.character.name[this.language],
        this.language === 'ar' ? 'يا لهوي على السرعة دي! امسك نفسك.' : 'Oh yeah, now this is a real machine!',
        this.character.accentHex,
        3.0,
      );
    }

    if (!this.drivenIds.has(best.id)) {
      this.drivenIds.add(best.id);
      this.stats.carsDriven = this.drivenIds.size;
    }
    this.drivenVehicle = best;
    this.playerRig.group.visible = false;
    soundEngine.playAction('door');
    this.emitHud();
  }

  public triggerAction() {
    if (this.actionCooldown > 0 || this.isWasted || this.paused) return;

    if (this.drivenVehicle) {
      this.honkHorn();
      return;
    }

    soundEngine.playWeaponFire(this.activeWeapon);

    // Raise weapon arm & muzzle spark
    this.playerRig.rightArm.rotation.x = -1.45;

    if (this.activeWeapon === 'melee') {
      this.actionCooldown = 0.36;
      for (const ped of this.peds) {
        if (ped.dead) continue;
        const d = Math.hypot(ped.x - this.playerX, ped.z - this.playerZ);
        if (d < 2.6) {
          this.damagePed(ped, 35, Math.sin(this.playerYaw), Math.cos(this.playerYaw));
        }
      }
      return;
    }

    const specs: Record<Exclude<WeaponId, 'melee'>, { cd: number; speed: number; dmg: number; pellets: number; spread: number; color: number; explosive: boolean }> = {
      pistol: { cd: 0.28, speed: 52, dmg: 26, pellets: 1, spread: 0.03, color: 0xfef08a, explosive: false },
      smg: { cd: 0.1, speed: 55, dmg: 16, pellets: 1, spread: 0.08, color: 0xfbbf24, explosive: false },
      shotgun: { cd: 0.65, speed: 46, dmg: 22, pellets: 5, spread: 0.24, color: 0xf97316, explosive: false },
      rifle: { cd: 0.14, speed: 65, dmg: 24, pellets: 1, spread: 0.04, color: 0x38bdf8, explosive: false },
      rpg: { cd: 1.05, speed: 34, dmg: 120, pellets: 1, spread: 0, color: 0xef4444, explosive: true },
    };

    const s = specs[this.activeWeapon];
    this.actionCooldown = s.cd;

    const sx = this.playerX + Math.sin(this.playerYaw) * 0.95;
    const sz = this.playerZ + Math.cos(this.playerYaw) * 0.95;
    this.spawnBurst(sx, 1.32, sz, s.color, 3);

    for (let i = 0; i < s.pellets; i++) {
      const yaw = this.playerYaw + (Math.random() - 0.5) * s.spread;
      const mesh = new THREE.Mesh(
        s.explosive ? new THREE.SphereGeometry(0.24, 10, 10) : new THREE.BoxGeometry(0.1, 0.1, 0.45),
        new THREE.MeshBasicMaterial({ color: s.color }),
      );
      mesh.position.set(sx, 1.32, sz);
      mesh.rotation.y = yaw;
      this.scene.add(mesh);
      this.projectiles.push({
        mesh,
        x: sx,
        y: 1.32,
        z: sz,
        vx: Math.sin(yaw) * s.speed,
        vz: Math.cos(yaw) * s.speed,
        life: s.explosive ? 1.8 : 0.95,
        damage: s.dmg,
        explosive: s.explosive,
        fromEnemy: false,
      });
    }

    if (this.activeWeapon === 'rpg') {
      this.addWanted(1);
    }
  }

  private damagePed(ped: PedEntity, amount: number, dirX: number, dirZ: number) {
    if (ped.dead) return;
    ped.hp -= amount;
    this.spawnBurst(ped.x, 1.25, ped.z, 0xef4444, 6);

    if (ped.hp <= 0) {
      ped.dead = true;
      ped.deadTimer = 8.0;
      ped.rig.group.rotation.x = Math.PI / 2;
      ped.rig.group.position.y = 0.22;
      this.stats.takedowns += 1;
      this.respect += ped.isHostile ? 50 : 15;
      this.addWanted(ped.isHostile ? 0 : 1);

      // Drop collectible cash stack!
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
        value: ped.isHostile ? 140 : 65,
      });

      if (this.activeMission?.id === 'sweep' && ped.isHostile) {
        this.activeMission.progress += 1;
        if (this.activeMission.progress >= this.activeMission.total) {
          this.completeMission();
        }
      }
    } else {
      ped.x += dirX * 0.45;
      ped.z += dirZ * 0.45;
      if (!ped.isHostile) {
        ped.fleeTimer = 4.0;
        ped.yaw = Math.atan2(ped.x - this.playerX, ped.z - this.playerZ);
        this.addWanted(1);
      }
    }
  }

  private triggerExplosion(x: number, z: number) {
    soundEngine.playExplosion();
    this.spawnBurst(x, 1.2, z, 0xf97316, 22);
    this.spawnBurst(x, 1.8, z, 0xfef08a, 14);

    for (const ped of this.peds) {
      if (ped.dead) continue;
      const d = Math.hypot(ped.x - x, ped.z - z);
      if (d < 8.5) {
        this.damagePed(ped, 110, (ped.x - x) / (d + 0.1), (ped.z - z) / (d + 0.1));
      }
    }

    for (const v of this.vehicles) {
      if (v === this.drivenVehicle) continue;
      const d = Math.hypot(v.x - x, v.z - z);
      if (d < 9.5) {
        v.vy = 8.5;
        v.y = 0.25;
        v.speed *= 0.2;
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
            ? 'الكل يتحرك! المشتبه فيه معاه سلاح في وسط البلد!'
            : 'All units respond! Suspect armed and moving through Downtown!',
          '#38bdf8',
          3.8,
        );
      }
    }
  }

  private ensurePolicePursuit() {
    const policeCount = this.vehicles.filter((v) => v.isPolice && !v.isTraffic).length;
    const needed = Math.min(3, Math.ceil(this.wantedStars / 2));
    for (let i = policeCount; i < needed; i++) {
      const angle = Math.random() * Math.PI * 2;
      const px = THREE.MathUtils.clamp(this.getPlayerPosX() + Math.cos(angle) * 55, -WORLD_LIMIT, WORLD_LIMIT);
      const pz = THREE.MathUtils.clamp(this.getPlayerPosZ() + Math.sin(angle) * 55, -WORLD_LIMIT, WORLD_LIMIT);
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
        title: { en: 'Express Delivery Run', ar: 'توصيلة إكسبريس' },
        objective: { en: 'Reach all 3 golden checkpoints', ar: 'وصل لـ 3 نقاط التوصيل قبل الوقت' },
        progress: 0,
        total: 3,
        timeLeft: 75,
        rewardCash: 850,
      };
      this.speak(
        this.language === 'ar' ? 'المعلم هاني' : 'Uncle Hany',
        this.language === 'ar'
          ? 'اسمع يا بطل، الطرود دي لازم توصل قبل الزحمة. دوس بنزين!'
          : 'Listen up, kid — those crates need to clear 3 checkpoints fast. Hit the gas!',
        '#f59e0b',
        4.2,
      );
    } else if (id === 'sweep') {
      for (let i = 0; i < 5; i++) {
        this.spawnSingleNpc(100 + i, true, -28 + (Math.random() - 0.5) * 48, 28 + (Math.random() - 0.5) * 48);
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
        this.language === 'ar'
          ? 'العصابة رجعت الحارة؟ تمام... وقت الجد دلوقتي.'
          : 'Red-bandana crew is back on our turf? Time to clean house.',
        this.character.accentHex,
        4.2,
      );
    } else if (id === 'stunt') {
      this.missionStuntStartCount = this.stats.stuntsLanded;
      this.activeMission = {
        id,
        title: { en: 'Bay Stunt Show', ar: 'عرض نطات الكورنيش' },
        objective: { en: 'Land 2 vehicle ramp jumps', ar: 'نط بمركبة مرتين من على الرامب' },
        progress: 0,
        total: 2,
        timeLeft: 80,
        rewardCash: 950,
      };
      this.speak(
        this.language === 'ar' ? 'نور' : 'Nour',
        this.language === 'ar'
          ? 'الجمهور مستني عرض! عايزين نشوفك طاير في السما.'
          : 'Crowds are watching! Hit those ramps at full nitro!',
        '#14b8a6',
        4.0,
      );
    } else if (id === 'vip') {
      this.spawnMissionCheckpoints([{ x: 112, z: -28 }], 0x3b82f6);
      this.activeMission = {
        id,
        title: { en: 'VIP Coastal Drive', ar: 'توصيلة VIP للكورنيش' },
        objective: { en: 'Drive to the Beachfront Pier beacon', ar: 'وصل لنقطة الكورنيش بالعربية' },
        progress: 0,
        total: 1,
        timeLeft: 60,
        rewardCash: 800,
      };
      this.speak(
        this.language === 'ar' ? 'طارق' : 'Tarek',
        this.language === 'ar'
          ? 'الباشا مستعجل على المرسى، سوق بنضافة ووصلنا هناك.'
          : 'The VIP is waiting at the Marina Pier. Keep it smooth and fast.',
        '#3b82f6',
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
        new THREE.CylinderGeometry(3.2, 3.2, 7.5, 20, 1, true),
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
    const reward = Math.round(this.activeMission.rewardCash * this.character.stats.cashBonus);
    this.cash += reward;
    this.respect += 150;
    this.stats.missionsDone += 1;
    soundEngine.playAction('mission');
    this.showBanner(
      this.language === 'ar' ? `عاش يا بطل! +$${reward}` : `Mission Passed! +$${reward}`,
      'success',
      4,
    );
    this.speak(
      this.character.name[this.language],
      this.language === 'ar' ? 'شغل نضيف! الفلوس نزلت في الجيب.' : 'Clean work. Cash in the pocket!',
      this.character.accentHex,
      3.5,
    );
    this.activeMission = null;
    this.clearMissionMarkers();
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

  private spawnBurst(x: number, y: number, z: number, color: number, count: number) {
    const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 11,
        vy: 2.5 + Math.random() * 7,
        vz: (Math.random() - 0.5) * 11,
        life: 0.5 + Math.random() * 0.4,
      });
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
      this.language === 'ar' ? 'الحمد لله على السلامة... راجعين أقوى!' : 'Back on my feet. Nobody keeps me down for long.',
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

  private resolveBuildingCollision(x: number, z: number, radius: number): { x: number; z: number; hit: boolean } {
    let rx = x;
    let rz = z;
    let hit = false;
    for (const b of this.city.buildings) {
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
    rx = THREE.MathUtils.clamp(rx, -WORLD_LIMIT, WORLD_LIMIT);
    rz = THREE.MathUtils.clamp(rz, -WORLD_LIMIT, WORLD_LIMIT);
    return { x: rx, z: rz, hit };
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
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerMessage = null;
    }
    if (this.subtitleTimer > 0) {
      this.subtitleTimer -= dt;
      if (this.subtitleTimer <= 0) this.subtitle = null;
    }

    if (this.keys.has('KeyQ')) this.cameraOrbitYaw += 1.9 * dt;

    // Auto-fire for rapid weapons (SMG / Rifle) when holding Fire/Mouse
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
    this.updatePedestrians(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updatePickupsAndMissions(dt);
    this.updateWantedSystem(dt);
    this.updateCamera(dt);

    this.city.waterMesh.position.y = -0.25 + Math.sin(this.clock.elapsedTime * 1.4) * 0.05;

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.08) {
      this.hudEmitTimer = 0;
      this.emitHud();
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
    const baseSpeed = (sprinting ? 12.0 : 7.0) * this.character.stats.speedMultiplier;

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

      const col = this.resolveBuildingCollision(this.playerX + wx * baseSpeed * dt, this.playerZ + wz * baseSpeed * dt, 0.55);
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
    this.playerVy -= 22 * dt;
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
    const topSpeed = v.maxSpeed * this.character.stats.speedMultiplier * (nitro ? 1.25 : 1.0);
    const accel = v.accel * (nitro ? 1.4 : 1.0);

    if (throttle > 0) v.speed = Math.min(topSpeed, v.speed + accel * dt);
    else if (throttle < 0) v.speed = Math.max(-topSpeed * 0.4, v.speed - accel * 1.25 * dt);
    else v.speed *= Math.pow(0.28, dt);

    if (handbrake) v.speed *= Math.pow(0.18, dt);

    const steerRate =
      (handbrake ? 2.8 : 2.1) *
      this.character.stats.handlingMultiplier *
      THREE.MathUtils.clamp(Math.abs(v.speed) / 8, 0.28, 1.0);
    if (Math.abs(v.speed) > 0.4) {
      v.yaw += steer * steerRate * (v.speed >= 0 ? 1 : -1) * dt;
    }

    const vx = Math.sin(v.yaw) * v.speed;
    const vz = Math.cos(v.yaw) * v.speed;
    const col = this.resolveBuildingCollision(v.x + vx * dt, v.z + vz * dt, v.kind === 'bike' ? 0.85 : 1.45);
    if (col.hit && Math.abs(v.speed) > 10) {
      soundEngine.playAction('crash');
      v.speed *= -0.3;
    }
    v.x = col.x;
    v.z = col.z;

    const groundY = this.getRampHeightAt(v.x, v.z);
    if (v.y <= groundY + 0.08 && groundY > 0.3 && Math.abs(v.speed) > 14) {
      v.vy = Math.max(v.vy, Math.abs(v.speed) * 0.36);
    }
    v.vy -= 22 * dt;
    v.y += v.vy * dt;
    if (v.y <= groundY) {
      if (this.airTime > 0.65 && v.y <= 0.15) {
        this.stats.stuntsLanded += 1;
        this.cash += 175;
        this.respect += 45;
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
    v.rig.group.rotation.x = v.y > 0.2 ? -v.vy * 0.025 : 0;
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
      if (v.isPolice && v.rig.sirenRed && v.rig.sirenBlue) {
        v.flashTimer += dt * 10;
        const flip = Math.sin(v.flashTimer) > 0;
        const activeChase = !v.isTraffic || this.wantedStars > 0;
        v.rig.sirenRed.emissiveIntensity = activeChase && flip ? 2.2 : 0.15;
        v.rig.sirenBlue.emissiveIntensity = activeChase && !flip ? 2.2 : 0.15;
      }

      if (v === this.drivenVehicle) {
        v.y = Math.max(0, v.y);
        continue;
      }

      // Gravity for parked/exploded cars
      if (v.y > 0 || v.vy !== 0) {
        v.vy -= 22 * dt;
        v.y += v.vy * dt;
        if (v.y <= 0) {
          v.y = 0;
          v.vy = 0;
        }
        v.rig.group.position.y = v.y;
      }

      if (v.isPolice && !v.isTraffic && this.wantedStars > 0) {
        const dx = px - v.x;
        const dz = pz - v.z;
        const dist = Math.hypot(dx, dz);
        const targetYaw = Math.atan2(dx, dz);
        let diff = targetYaw - v.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.yaw += THREE.MathUtils.clamp(diff, -2.2 * dt, 2.2 * dt);
        v.speed = dist > 6.5 ? 21 + this.wantedStars * 1.8 : 2;

        const col = this.resolveBuildingCollision(
          v.x + Math.sin(v.yaw) * v.speed * dt,
          v.z + Math.cos(v.yaw) * v.speed * dt,
          1.45,
        );
        if (col.hit) v.yaw += 0.9 * dt;
        v.x = col.x;
        v.z = col.z;
        v.rig.group.position.set(v.x, v.y, v.z);
        v.rig.group.rotation.y = v.yaw;
        v.rig.wheels.forEach((w) => (w.rotation.x += v.speed * dt * 1.8));

        if (dist < 3.6) {
          this.damagePlayer(14 * dt);
        }
        continue;
      }

      if (v.isTraffic) {
        v.speed = 11.5;
        const nx = v.x + Math.sin(v.yaw) * v.speed * dt;
        const nz = v.z + Math.cos(v.yaw) * v.speed * dt;
        if (Math.abs(nx) > 116 || Math.abs(nz) > 116) {
          v.yaw += Math.PI;
          v.x = THREE.MathUtils.clamp(v.x, -114, 114);
          v.z = THREE.MathUtils.clamp(v.z, -114, 114);
        } else {
          const col = this.resolveBuildingCollision(nx, nz, 1.4);
          if (col.hit) v.yaw += Math.PI / 2;
          else {
            v.x = col.x;
            v.z = col.z;
          }
        }
        v.rig.group.position.set(v.x, v.y, v.z);
        v.rig.group.rotation.y = v.yaw;
        v.rig.wheels.forEach((w) => (w.rotation.x += v.speed * dt * 1.5));
      }

      if (this.drivenVehicle && Math.hypot(v.x - this.drivenVehicle.x, v.z - this.drivenVehicle.z) < 3.2) {
        const pushAngle = Math.atan2(v.x - this.drivenVehicle.x, v.z - this.drivenVehicle.z);
        v.x += Math.sin(pushAngle) * 1.1;
        v.z += Math.cos(pushAngle) * 1.1;
        if (Math.abs(this.drivenVehicle.speed) > 10) {
          soundEngine.playAction('crash');
          this.drivenVehicle.speed *= 0.65;
          if (v.isPolice) this.addWanted(1);
        }
      }
    }
  }

  private updatePedestrians(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    for (let i = this.peds.length - 1; i >= 0; i--) {
      const ped = this.peds[i];
      if (ped.dead) {
        ped.deadTimer -= dt;
        if (ped.deadTimer <= 0) {
          this.scene.remove(ped.rig.group);
          this.peds.splice(i, 1);
          if (this.peds.length < 24) {
            this.spawnSingleNpc(Math.floor(Math.random() * 100));
          }
        }
        continue;
      }

      const dToPlayer = Math.hypot(ped.x - px, ped.z - pz);

      // Hostile gang members shoot if close & provoked or player has wanted level / mission
      if (ped.isHostile && dToPlayer < 22 && (this.activeMission?.id === 'sweep' || this.wantedStars > 0)) {
        const targetYaw = Math.atan2(px - ped.x, pz - ped.z);
        ped.yaw = targetYaw;
        ped.shootCooldown -= dt;
        if (ped.shootCooldown <= 0 && !this.isWasted) {
          ped.shootCooldown = 1.6 + Math.random() * 0.8;
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.4),
            new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
          );
          mesh.position.set(ped.x, 1.3, ped.z);
          this.scene.add(mesh);
          this.projectiles.push({
            mesh,
            x: ped.x,
            y: 1.3,
            z: ped.z,
            vx: Math.sin(targetYaw) * 32,
            vz: Math.cos(targetYaw) * 32,
            life: 1.1,
            damage: 8,
            explosive: false,
            fromEnemy: true,
          });
        }
      }

      ped.turnTimer -= dt;
      if (ped.turnTimer <= 0) {
        ped.yaw += (Math.random() - 0.5) * 2.2;
        ped.turnTimer = 2.5 + Math.random() * 4;
      }

      // Car ramming knocks out NPC
      if (this.drivenVehicle && dToPlayer < 2.2 && Math.abs(this.drivenVehicle.speed) > 9) {
        this.damagePed(ped, 100, Math.sin(this.drivenVehicle.yaw), Math.cos(this.drivenVehicle.yaw));
        soundEngine.playAction('crash');
        continue;
      }

      const moveSpeed = ped.fleeTimer > 0 ? ped.speed * 2.1 : ped.speed;
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

      ped.walkPhase += dt * moveSpeed * 3.5;
      const s = Math.sin(ped.walkPhase) * 0.6;
      ped.rig.leftLeg.rotation.x = s;
      ped.rig.rightLeg.rotation.x = -s;
      ped.rig.leftArm.rotation.x = -s * 0.6;
      ped.rig.rightArm.rotation.x = ped.isHostile ? -1.1 : s * 0.6;
      ped.rig.group.position.x = ped.x;
      ped.rig.group.position.z = ped.z;
      ped.rig.group.rotation.y = ped.yaw;
    }
  }

  private updateProjectiles(dt: number) {
    const px = this.getPlayerPosX();
    const pz = this.getPlayerPosZ();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
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
        for (const ped of this.peds) {
          if (ped.dead) continue;
          if (Math.hypot(ped.x - p.x, ped.z - p.z) < 1.15) {
            hit = true;
            if (!p.explosive) {
              this.damagePed(ped, p.damage, p.vx * 0.02, p.vz * 0.02);
            }
            break;
          }
        }
      }

      if (hit) {
        if (p.explosive) {
          this.triggerExplosion(p.x, p.z);
        }
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vy -= 14 * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.scale.setScalar(Math.max(0.01, pt.life * 1.5));
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
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

    this.city.missionSpots.forEach((m) => {
      m.ringMesh.visible = !this.activeMission;
      const pulse = 1 + Math.sin(this.clock.elapsedTime * 3.5) * 0.08;
      m.ringMesh.scale.set(pulse, pulse, 1);
    });

    if (this.activeMission) {
      if (this.activeMission.timeLeft > 0) {
        this.activeMission.timeLeft -= dt;
        if (this.activeMission.timeLeft <= 0) {
          this.failMission(this.language === 'ar' ? 'الوقت خلص! حاول تاني.' : 'Time ran out! Try again.');
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
      if (v.isPolice && !v.isTraffic && Math.hypot(v.x - px, v.z - pz) < 34) {
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
        this.showBanner(this.language === 'ar' ? 'هربت من الشرطة!' : 'Escaped the Heat!', 'success', 2.5);
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
    const speedRatio = this.drivenVehicle ? Math.min(1, Math.abs(this.drivenVehicle.speed) / 38) : 0;
    const targetFov = inCar ? 64 + speedRatio * 14 : 60;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
    this.camera.updateProjectionMatrix();

    const dist = inCar ? 9.4 + speedRatio * 1.8 : 5.6;
    const height = inCar ? 4.0 : 2.85;

    const camYaw = inCar && !this.draggingCam ? this.drivenVehicle!.yaw + Math.PI + this.cameraOrbitYaw * 0.25 : this.cameraOrbitYaw;
    const desiredX = px + Math.sin(camYaw) * dist;
    const desiredZ = pz + Math.cos(camYaw) * dist;
    const desiredY = py + height + Math.sin(this.cameraPitch) * 1.4;

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
        if (Math.hypot(v.x - px, v.z - pz) < 4.8) {
          nearbyVehiclePrompt = v.name;
          break;
        }
      }
    }

    let availableMissionPrompt: HudSnapshot['availableMissionPrompt'] = null;
    if (!this.activeMission) {
      for (const m of this.city.missionSpots) {
        if (Math.hypot(m.x - px, m.z - pz) < 5.2) {
          availableMissionPrompt = { title: m.title, reward: m.reward };
          break;
        }
      }
    }

    const blips: MinimapBlip[] = [];
    this.vehicles.forEach((v) => {
      if (v === this.drivenVehicle) return;
      blips.push({
        x: v.x,
        z: v.z,
        type: v.isPolice && !v.isTraffic ? 'police' : 'vehicle',
      });
    });
    this.peds.forEach((ped) => {
      if (!ped.dead && ped.isHostile) {
        blips.push({ x: ped.x, z: ped.z, type: 'hostile' });
      }
    });
    this.city.pickups.forEach((pk) => {
      if (pk.cooldown <= 0) blips.push({ x: pk.x, z: pk.z, type: 'pickup' });
    });
    if (!this.activeMission) {
      this.city.missionSpots.forEach((m) => blips.push({ x: m.x, z: m.z, type: 'mission' }));
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
      wantedStars: this.wantedStars,
      inVehicle: Boolean(this.drivenVehicle),
      vehicleName: this.drivenVehicle?.name ?? '',
      vehicleKind: this.drivenVehicle?.kind ?? null,
      vehicleSpeedKmh: this.drivenVehicle ? Math.round(Math.abs(this.drivenVehicle.speed) * 4.2) : 0,
      vehicleHp: this.drivenVehicle ? Math.round(this.drivenVehicle.hp) : 100,
      activeWeapon: this.activeWeapon,
      radioStation: this.radioStation,
      timeOfDay: this.timeOfDay,
      activeMission: this.activeMission ? { ...this.activeMission } : null,
      availableMissionPrompt,
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
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
