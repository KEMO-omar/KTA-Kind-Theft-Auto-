import * as THREE from 'three';
import { VehicleKind, WeaponId } from '../types/game';
import { BrandAssetSlot } from './textures';

export interface VehicleRig {
  group: THREE.Group;
  wheels: THREE.Group[];
  frontSteerPivots: THREE.Group[];
  headlights: THREE.MeshStandardMaterial;
  taillights: THREE.MeshStandardMaterial;
  bodyMat: THREE.MeshPhysicalMaterial;
  sirenRed?: THREE.MeshStandardMaterial;
  sirenBlue?: THREE.MeshStandardMaterial;
}

export interface CharacterRig {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Group;
  weaponMount: THREE.Group;
  weaponMeshes: Record<WeaponId, THREE.Group>;
}

/**
 * Shared Geometry & Material Pool so repeated trees, lamps, traffic lights,
 * wheels, contact shadows, and props share GPU buffers & draw state for 60+ FPS.
 */
export class ModelAssetPool {
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];

  public tireMat: THREE.MeshStandardMaterial;
  public rimMat: THREE.MeshStandardMaterial;
  public caliperMat: THREE.MeshStandardMaterial;
  public chromeMat: THREE.MeshStandardMaterial;
  public darkMetalMat: THREE.MeshStandardMaterial;
  public shadowMat: THREE.MeshBasicMaterial;
  public trunkMat: THREE.MeshStandardMaterial;
  public palmLeafMat: THREE.MeshStandardMaterial;
  public canopyMat: THREE.MeshStandardMaterial;
  public redHydrantMat: THREE.MeshStandardMaterial;
  public trashMat: THREE.MeshStandardMaterial;
  public coneOrangeMat: THREE.MeshStandardMaterial;
  public coneWhiteMat: THREE.MeshStandardMaterial;
  public woodMat: THREE.MeshStandardMaterial;
  public billboardFrameMat: THREE.MeshStandardMaterial;

  public shadowGeo: THREE.CircleGeometry;
  public sphere8Geo: THREE.SphereGeometry;
  public lampBaseGeo: THREE.CylinderGeometry;
  public lampPoleGeo: THREE.CylinderGeometry;
  public lampArmGeo: THREE.BoxGeometry;
  public lampHeadGeo: THREE.BoxGeometry;
  public lampBulbGeo: THREE.BoxGeometry;
  public parkTrunkGeo: THREE.CylinderGeometry;
  public parkCanopy1Geo: THREE.DodecahedronGeometry;
  public parkCanopy2Geo: THREE.DodecahedronGeometry;
  public palmLowTrunkGeo: THREE.CylinderGeometry;
  public palmLowCrownGeo: THREE.ConeGeometry;

  constructor() {
    this.tireMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88, metalness: 0.08 }));
    this.rimMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 }));
    this.caliperMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.6 }));
    this.chromeMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.92 }));
    this.darkMetalMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 }));
    this.shadowMat = this.trackMat(
      new THREE.MeshBasicMaterial({ color: 0x050507, transparent: true, opacity: 0.4, depthWrite: false }),
    );
    this.trunkMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.9 }));
    this.palmLeafMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.65, side: THREE.DoubleSide }));
    this.canopyMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.78 }));
    this.redHydrantMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.4 }));
    this.trashMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.65 }));
    this.coneOrangeMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 }));
    this.coneWhiteMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }));
    this.woodMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 }));
    this.billboardFrameMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.75 }));

    this.shadowGeo = this.trackGeo(new THREE.CircleGeometry(1, 16));
    this.shadowGeo.rotateX(-Math.PI / 2);
    this.sphere8Geo = this.trackGeo(new THREE.SphereGeometry(0.09, 6, 6));

    this.lampBaseGeo = this.trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 0.6, 6));
    this.lampPoleGeo = this.trackGeo(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 6));
    this.lampArmGeo = this.trackGeo(new THREE.BoxGeometry(1.3, 0.1, 0.1));
    this.lampHeadGeo = this.trackGeo(new THREE.BoxGeometry(0.45, 0.14, 0.28));
    this.lampBulbGeo = this.trackGeo(new THREE.BoxGeometry(0.36, 0.08, 0.22));

    this.parkTrunkGeo = this.trackGeo(new THREE.CylinderGeometry(0.24, 0.34, 2.4, 6));
    this.parkCanopy1Geo = this.trackGeo(new THREE.DodecahedronGeometry(1.5, 0));
    this.parkCanopy2Geo = this.trackGeo(new THREE.DodecahedronGeometry(1.15, 0));
    this.palmLowTrunkGeo = this.trackGeo(new THREE.CylinderGeometry(0.18, 0.28, 6.2, 6));
    this.palmLowCrownGeo = this.trackGeo(new THREE.ConeGeometry(2.1, 1.8, 6));
  }

  public trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geos.push(g);
    return g;
  }

  public trackMat<T extends THREE.Material>(m: T): T {
    this.mats.push(m);
    return m;
  }

  public dispose() {
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.geos = [];
    this.mats = [];
  }
}

export function createContactShadow(rx: number, rz: number, pool?: ModelAssetPool): THREE.Mesh {
  const geo =
    pool?.shadowGeo ??
    (() => {
      const g = new THREE.CircleGeometry(1, 16);
      g.rotateX(-Math.PI / 2);
      return g;
    })();
  const mat =
    pool?.shadowMat ??
    new THREE.MeshBasicMaterial({
      color: 0x050507,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(rx, 1, rz);
  m.position.y = 0.04;
  return m;
}

function makeWheel(radius: number, width: number, pool?: ModelAssetPool): THREE.Group {
  const wheel = new THREE.Group();
  const tireMat = pool?.tireMat ?? new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88, metalness: 0.08 });
  const rimMat = pool?.rimMat ?? new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 });
  const caliperMat = pool?.caliperMat ?? new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.6 });

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), tireMat);
  tire.rotation.z = Math.PI / 2;

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 12), rimMat);
  rim.rotation.z = Math.PI / 2;

  const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.03, radius * 1.12, 0.055), rimMat);
  const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.03, 0.055, radius * 1.12), rimMat);

  const caliper = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, radius * 0.34, radius * 0.34), caliperMat);
  caliper.position.set(0, radius * 0.15, radius * 0.18);

  wheel.add(tire, rim, spoke1, spoke2, caliper);
  return wheel;
}

export function createWeaponMesh(id: WeaponId): THREE.Group {
  const g = new THREE.Group();
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
  const gunSteel = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.68, metalness: 0.05 });
  const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.55, metalness: 0.35 });

  if (id === 'melee') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.24, 8), darkMetal);
    handle.position.y = 0.12;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.024, 0.56, 8), woodMat);
    barrel.position.y = 0.5;
    g.add(handle, barrel);
    g.rotation.x = Math.PI / 3;
  } else if (id === 'pistol') {
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.07), darkMetal);
    grip.position.set(0, -0.04, 0);
    grip.rotation.x = 0.2;
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.065, 0.24), gunSteel);
    slide.position.set(0, 0.04, 0.08);
    g.add(grip, slide);
  } else if (id === 'smg') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.3), darkMetal);
    body.position.set(0, 0.03, 0.08);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.19, 0.055), gunSteel);
    mag.position.set(0, -0.09, 0.1);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.15, 6), gunSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, 0.28);
    g.add(body, mag, barrel);
  } else if (id === 'shotgun') {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.26), woodMat);
    stock.position.set(0, 0.01, -0.05);
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.095, 0.28), darkMetal);
    receiver.position.set(0, 0.03, 0.15);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 6), gunSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.06, 0.44);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.18, 6), woodMat);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, 0.02, 0.4);
    g.add(stock, receiver, barrel, pump);
  } else if (id === 'rifle') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.1, 0.42), darkMetal);
    body.position.set(0, 0.03, 0.15);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), gunSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.045, 0.48);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.075), darkMetal);
    mag.position.set(0, -0.08, 0.2);
    mag.rotation.x = 0.22;
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 6), gunSteel);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.105, 0.15);
    g.add(body, barrel, mag, scope);
  } else if (id === 'rpg') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.05, 8), oliveMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0.12, 0.25);
    const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
    warhead.rotation.x = Math.PI / 2;
    warhead.position.set(0, 0.12, 0.85);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), darkMetal);
    grip.position.set(0, 0.01, 0.28);
    g.add(tube, warhead, grip);
  }
  return g;
}

/**
 * Helper: Creates an aspect-ratio locked Plane mesh bound to a BrandAssetSlot.
 * When the remote texture finishes loading, width scales automatically to preserve naturalWidth / naturalHeight.
 */
export function createAspectTexturedPlane(
  slot: BrandAssetSlot,
  height: number,
  options?: { doubleSided?: boolean; polygonOffset?: boolean },
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: slot.texture,
    transparent: slot.isTransparent,
    alphaTest: slot.isTransparent ? 0.12 : 0,
    side: options?.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    polygonOffset: Boolean(options?.polygonOffset),
    polygonOffsetFactor: options?.polygonOffset ? -1 : 0,
    polygonOffsetUnits: options?.polygonOffset ? -1 : 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.scale.set(height * slot.aspect, height, 1);

  slot.onAspectReady.push((actualAspect) => {
    mesh.scale.x = height * actualAspect;
  });

  return mesh;
}

export function createVehicleMesh(
  kind: VehicleKind,
  primaryColor: number,
  pool?: ModelAssetPool,
  brandSlot?: BrandAssetSlot,
): VehicleRig {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: kind === 'police' ? 0x0f172a : kind === 'taxi' ? 0xfacc15 : primaryColor,
    roughness: 0.18,
    metalness: 0.58,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: kind === 'police' ? 0xf8fafc : 0x18181b,
    roughness: 0.42,
    metalness: 0.45,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x090d16,
    roughness: 0.06,
    metalness: 0.2,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.78,
  });

  const chromeMat = pool?.chromeMat ?? new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.14, metalness: 0.94 });
  const headlights = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfef08a,
    emissiveIntensity: 0.8,
    roughness: 0.18,
  });
  const taillights = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  // Superbike 2-wheel build
  if (kind === 'bike') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 1.55), bodyMat);
    frame.position.set(0, 0.65, 0);
    frame.castShadow = true;

    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.65), bodyMat);
    tank.position.set(0, 0.94, 0.18);
    tank.rotation.x = 0.15;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.72), secondaryMat);
    seat.position.set(0, 0.88, -0.38);

    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.55), bodyMat);
    cowl.position.set(0, 0.95, 0.68);
    cowl.rotation.x = -0.35;

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.06), glassMat);
    screen.position.set(0, 1.14, 0.62);
    screen.rotation.x = -0.45;

    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 6), chromeMat);
    fork.position.set(0, 0.68, 0.78);
    fork.rotation.x = 0.28;

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.78, 6), secondaryMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.05, 0.52);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.75, 8), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.24, 0.42, -0.45);

    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), headlights);
    hl.position.set(0, 0.9, 0.95);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.08), taillights);
    tl.position.set(0, 0.86, -0.82);

    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0.34, 0.88);
    const fw = makeWheel(0.34, 0.16, pool);
    frontPivot.add(fw);

    const rearPivot = new THREE.Group();
    rearPivot.position.set(0, 0.34, -0.78);
    const rw = makeWheel(0.34, 0.2, pool);
    rearPivot.add(rw);

    group.add(createContactShadow(0.5, 1.25, pool));
    group.add(frame, tank, seat, cowl, screen, fork, handlebar, exhaust, hl, tl, frontPivot, rearPivot);
    return {
      group,
      wheels: [fw, rw],
      frontSteerPivots: [frontPivot],
      headlights,
      taillights,
      bodyMat,
    };
  }

  const isSuv = kind === 'suv';
  const isSports = kind === 'sports';
  const isMuscle = kind === 'muscle';

  const bodyW = isSuv ? 2.18 : 2.04;
  const bodyL = isSports ? 4.45 : isSuv ? 4.6 : 4.48;
  const bodyH = isSuv ? 0.82 : isSports ? 0.52 : 0.64;
  const chassisY = isSuv ? 0.78 : 0.56;

  // Main Chassis & Sculpted Hood
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), bodyMat);
  chassis.position.y = chassisY;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, 0.1, bodyL * 0.34), bodyMat);
  hood.position.set(0, chassisY + bodyH * 0.5 + 0.02, bodyL * 0.3);
  hood.rotation.x = 0.05;
  group.add(hood);

  // Cabin + Pillars
  const cabinW = bodyW * 0.85;
  const cabinL = isSuv ? 2.65 : isSports ? 1.88 : 2.18;
  const cabinH = isSuv ? 0.72 : isSports ? 0.48 : 0.56;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinW, cabinH, cabinL),
    kind === 'police' ? secondaryMat : bodyMat,
  );
  cabin.position.set(0, chassisY + bodyH * 0.5 + cabinH * 0.45, isSports ? -0.18 : -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Police doors or Muscle stripes
  if (kind === 'police') {
    const doorBand = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.03, bodyH * 0.92, 1.9), secondaryMat);
    doorBand.position.set(0, chassisY, 0);
    group.add(doorBand);
  } else if (isMuscle) {
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, bodyL - 0.12), stripeMat);
    s1.position.set(-0.22, chassisY + bodyH * 0.5 + 0.08, 0);
    const s2 = s1.clone();
    s2.position.x = 0.22;
    group.add(s1, s2);
  }

  // Brand decals (A.png / E.png) on doors & hood for non-police vehicles
  if (brandSlot && kind !== 'police') {
    const decalL = createAspectTexturedPlane(brandSlot, bodyH * 0.75, { polygonOffset: true });
    decalL.position.set(-bodyW * 0.5 - 0.015, chassisY, 0.1);
    decalL.rotation.y = -Math.PI / 2;

    const decalR = createAspectTexturedPlane(brandSlot, bodyH * 0.75, { polygonOffset: true });
    decalR.position.set(bodyW * 0.5 + 0.015, chassisY, 0.1);
    decalR.rotation.y = Math.PI / 2;

    const hoodDecal = createAspectTexturedPlane(brandSlot, 0.78, { polygonOffset: true });
    hoodDecal.position.set(0, chassisY + bodyH * 0.5 + 0.085, bodyL * 0.31);
    hoodDecal.rotation.x = -Math.PI / 2 + 0.05;

    group.add(decalL, decalR, hoodDecal);
  }

  // Front Grille & License Plate
  const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.56, bodyH * 0.45, 0.08), secondaryMat);
  grille.position.set(0, chassisY - 0.05, bodyL * 0.5 + 0.02);
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.16, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }),
  );
  plate.position.set(0, chassisY - 0.16, -bodyL * 0.5 - 0.03);
  group.add(grille, plate);

  // Side Mirrors
  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.14), bodyMat);
  mirrorL.position.set(-bodyW * 0.54, chassisY + bodyH * 0.5 + 0.1, cabin.position.z + cabinL * 0.35);
  const mirrorR = mirrorL.clone();
  mirrorR.position.x = bodyW * 0.54;
  group.add(mirrorL, mirrorR);

  // Windshields & Side Glass
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.88, cabinH * 0.78, 0.08), glassMat);
  frontGlass.position.set(0, cabin.position.y + 0.02, cabin.position.z + cabinL * 0.5 + 0.01);
  frontGlass.rotation.x = -0.32;
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.88, cabinH * 0.78, 0.08), glassMat);
  rearGlass.position.set(0, cabin.position.y + 0.02, cabin.position.z - cabinL * 0.5 - 0.01);
  rearGlass.rotation.x = 0.28;
  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW + 0.03, cabinH * 0.65, cabinL * 0.78), glassMat);
  sideGlass.position.copy(cabin.position);
  group.add(frontGlass, rearGlass, sideGlass);

  // Bumpers & Dual Exhausts
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.06, 0.2, 0.16), chromeMat);
  frontBumper.position.set(0, chassisY - bodyH * 0.28, bodyL * 0.5 + 0.05);
  const rearBumper = frontBumper.clone();
  rearBumper.position.z = -bodyL * 0.5 - 0.05;
  const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 6), chromeMat);
  exL.rotation.x = Math.PI / 2;
  exL.position.set(-0.55, chassisY - bodyH * 0.35, -bodyL * 0.5 - 0.08);
  const exR = exL.clone();
  exR.position.x = 0.55;
  group.add(frontBumper, rearBumper, exL, exR);

  // Headlights & Taillights
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.08), headlights);
  hlL.position.set(-bodyW * 0.34, chassisY + 0.04, bodyL * 0.5 + 0.02);
  const hlR = hlL.clone();
  hlR.position.x = bodyW * 0.34;
  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.08), taillights);
  tlL.position.set(-bodyW * 0.34, chassisY + 0.06, -bodyL * 0.5 - 0.02);
  const tlR = tlL.clone();
  tlR.position.x = bodyW * 0.34;
  group.add(hlL, hlR, tlL, tlR);

  let sirenRed: THREE.MeshStandardMaterial | undefined;
  let sirenBlue: THREE.MeshStandardMaterial | undefined;

  if (isSports) {
    const pL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.14), secondaryMat);
    pL.position.set(-0.66, chassisY + bodyH * 0.5 + 0.13, -bodyL * 0.44);
    const pR = pL.clone();
    pR.position.x = 0.66;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.94, 0.06, 0.36), bodyMat);
    wing.position.set(0, chassisY + bodyH * 0.5 + 0.27, -bodyL * 0.45);
    group.add(pL, pR, wing);
  } else if (isMuscle) {
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.95), chromeMat);
    scoop.position.set(0, chassisY + bodyH * 0.5 + 0.09, 1.12);
    group.add(scoop);
  } else if (kind === 'taxi') {
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.34), signMat);
    sign.position.set(0, cabin.position.y + cabinH * 0.5 + 0.11, 0.1);
    group.add(sign);
  } else if (kind === 'police') {
    sirenRed = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    sirenBlue = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });
    const barCenter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), secondaryMat);
    barCenter.position.set(0, cabin.position.y + cabinH * 0.5 + 0.08, 0);
    const barR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.28), sirenRed);
    barR.position.set(-0.38, barCenter.position.y, 0);
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.28), sirenBlue);
    barB.position.set(0.38, barCenter.position.y, 0);
    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.4, 0.2), secondaryMat);
    pushBar.position.set(0, chassisY - 0.04, bodyL * 0.5 + 0.14);
    group.add(barCenter, barR, barB, pushBar);
  } else if (isSuv) {
    const rackL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, cabinL * 0.85), secondaryMat);
    rackL.position.set(-cabinW * 0.4, cabin.position.y + cabinH * 0.5 + 0.05, cabin.position.z);
    const rackR = rackL.clone();
    rackR.position.x = cabinW * 0.4;
    const spare = makeWheel(0.36, 0.22, pool);
    spare.rotation.y = Math.PI / 2;
    spare.position.set(0, chassisY + 0.18, -bodyL * 0.5 - 0.14);
    group.add(rackL, rackR, spare);
  }

  // Wheels
  const wheelR = isSuv ? 0.44 : 0.36;
  const wheelW = isSuv ? 0.3 : 0.25;
  const wheelX = bodyW * 0.5 + 0.02;
  const frontZ = bodyL * 0.32;
  const rearZ = -bodyL * 0.32;

  const wheels: THREE.Group[] = [];
  const frontSteerPivots: THREE.Group[] = [];

  [
    { x: -wheelX, z: frontZ, front: true },
    { x: wheelX, z: frontZ, front: true },
    { x: -wheelX, z: rearZ, front: false },
    { x: wheelX, z: rearZ, front: false },
  ].forEach((pos) => {
    const pivot = new THREE.Group();
    pivot.position.set(pos.x, wheelR, pos.z);
    const w = makeWheel(wheelR, wheelW, pool);
    pivot.add(w);
    group.add(pivot);
    wheels.push(w);
    if (pos.front) frontSteerPivots.push(pivot);
  });

  group.add(createContactShadow(bodyW * 0.65, bodyL * 0.56, pool));
  return { group, wheels, frontSteerPivots, headlights, taillights, bodyMat, sirenRed, sirenBlue };
}

export function createCharacterMesh(cfg: {
  jacket: number;
  shirt: number;
  pants: number;
  skin: number;
  hair: number;
  sunglasses?: boolean;
  isPolice?: boolean;
  isHostile?: boolean;
  castShadow?: boolean;
}): CharacterRig {
  const group = new THREE.Group();
  const useShadow = cfg.castShadow ?? false;

  const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.62 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: cfg.jacket, roughness: 0.52, metalness: 0.08 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: cfg.shirt, roughness: 0.68 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pants, roughness: 0.78 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const shoeSoleMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: cfg.hair, roughness: 0.82 });

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.22, 10), pantsMat);
  pelvis.position.y = 0.88;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.21, 0.56, 10), jacketMat);
  torso.scale.set(1.12, 1, 0.65);
  torso.position.y = 1.24;
  torso.castShadow = useShadow;
  group.add(torso);

  const chestV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.46, 0.28), shirtMat);
  chestV.position.set(0, 1.25, 0.04);
  group.add(chestV);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.06, 10), shoeSoleMat);
  belt.scale.set(1.08, 1, 0.68);
  belt.position.y = 0.96;
  group.add(belt);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.14, 8), skinMat);
  neck.position.y = 1.56;
  group.add(neck);

  const head = new THREE.Group();
  head.position.set(0, 1.72, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.175, 12, 10), skinMat);
  skull.scale.set(0.92, 1.08, 0.96);
  skull.castShadow = useShadow;

  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.095, 0.14, 8), skinMat);
  jaw.position.set(0, -0.09, 0.02);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.05), skinMat);
  nose.position.set(0, -0.01, 0.17);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), skinMat);
  earL.position.set(-0.16, 0, 0);
  const earR = earL.clone();
  earR.position.x = 0.16;

  head.add(skull, jaw, nose, earL, earR);

  if (cfg.isPolice) {
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.1, 10), capMat);
    capTop.position.set(0, 0.14, 0);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.14), shoeSoleMat);
    visor.position.set(0, 0.1, 0.16);
    head.add(capTop, visor);
  } else {
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.182, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    hairTop.position.set(0, 0.03, -0.01);
    head.add(hairTop);
  }

  if (cfg.sunglasses) {
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.12, metalness: 0.85 });
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.04), shadeMat);
    lensL.position.set(-0.06, 0.03, 0.16);
    const lensR = lensL.clone();
    lensR.position.x = 0.06;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.03), shadeMat);
    bridge.position.set(0, 0.04, 0.165);
    head.add(lensL, lensR, bridge);
  } else {
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), eyeMat);
    eyeL.position.set(-0.058, 0.03, 0.158);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.058;
    head.add(eyeL, eyeR);
  }

  if (cfg.isHostile) {
    const bandana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.14, 0.08, 10),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 }),
    );
    bandana.position.set(0, -0.07, 0.02);
    head.add(bandana);
  }
  group.add(head);

  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.31, 1.46, 0);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.28, 8), jacketMat);
    upper.position.y = -0.14;
    upper.castShadow = useShadow;

    const forearmPivot = new THREE.Group();
    forearmPivot.position.y = -0.28;
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.25, 8), jacketMat);
    forearm.position.y = -0.125;

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), skinMat);
    hand.position.y = -0.27;

    forearmPivot.add(forearm, hand);
    shoulder.add(upper, forearmPivot);
    group.add(shoulder);
    return { shoulder, forearmPivot };
  };

  const armL = makeArm(-1);
  const armR = makeArm(1);

  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.27, 0.04);
  armR.forearmPivot.add(weaponMount);

  const weaponMeshes: Record<WeaponId, THREE.Group> = {
    melee: createWeaponMesh('melee'),
    pistol: createWeaponMesh('pistol'),
    smg: createWeaponMesh('smg'),
    shotgun: createWeaponMesh('shotgun'),
    rifle: createWeaponMesh('rifle'),
    rpg: createWeaponMesh('rpg'),
  };
  (Object.keys(weaponMeshes) as WeaponId[]).forEach((wid) => {
    weaponMeshes[wid].visible = false;
    weaponMount.add(weaponMeshes[wid]);
  });

  const makeLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, 0.84, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.38, 8), pantsMat);
    thigh.position.y = -0.19;
    thigh.castShadow = useShadow;

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.36, 8), pantsMat);
    shin.position.y = -0.55;

    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoeMat);
    sneaker.position.set(0, -0.78, 0.04);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.035, 0.27), shoeSoleMat);
    sole.position.set(0, -0.82, 0.04);

    hip.add(thigh, shin, sneaker, sole);
    group.add(hip);
    return hip;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  return {
    group,
    leftArm: armL.shoulder,
    rightArm: armR.shoulder,
    leftForearm: armL.forearmPivot,
    rightForearm: armR.forearmPivot,
    leftLeg,
    rightLeg,
    head,
    weaponMount,
    weaponMeshes,
  };
}

/**
 * LOD House Builder:
 * Level 0 (<68m): Full villa with roof, door, porch, garage, glowing windows, garden hedge
 * Level 1 (68m-155m): Lightweight 2-mesh box + hip roof proxy
 * Level 2 (>155m): Culled empty Group
 */
export function createHouseLOD(
  wallTex: THREE.CanvasTexture,
  roofTex: THREE.CanvasTexture,
  tintColor: number,
  twoStory = true,
  pool?: ModelAssetPool,
): THREE.LOD {
  const lod = new THREE.LOD();
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: tintColor, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.72 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.65 });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.88 });
  if (pool) {
    pool.trackMat(wallMat);
    pool.trackMat(roofMat);
    pool.trackMat(trimMat);
    pool.trackMat(doorMat);
    pool.trackMat(winMat);
    pool.trackMat(hedgeMat);
  }

  const w = 11.5;
  const d = 10.0;
  const h = twoStory ? 6.6 : 4.0;
  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const roofGeo = new THREE.ConeGeometry(8.6, 2.8, 4);
  if (pool) {
    pool.trackGeo(bodyGeo);
    pool.trackGeo(roofGeo);
  }

  // LOD 0: High Detail
  const high = new THREE.Group();
  const body = new THREE.Mesh(bodyGeo, wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  high.add(body);

  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + 1.4;
  high.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.18), doorMat);
  door.position.set(-1.5, 1.2, d / 2 + 0.05);
  const porch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 1.8), trimMat);
  porch.position.set(-1.5, 2.7, d / 2 + 0.8);
  high.add(door, porch);

  const garage = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.5, 0.16), trimMat);
  garage.position.set(2.8, 1.25, d / 2 + 0.06);
  high.add(garage);

  [-3.8, 0.5].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 0.15), winMat);
    win.position.set(wx, 1.7, d / 2 + 0.06);
    high.add(win);
    if (twoStory) {
      const win2 = win.clone();
      win2.position.y = 4.6;
      high.add(win2);
    }
  });
  const hedgeL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 0.7), hedgeMat);
  hedgeL.position.set(-3.8, 0.4, d / 2 + 1.4);
  high.add(hedgeL);

  // LOD 1: Low Detail Proxy
  const med = new THREE.Group();
  const mBody = new THREE.Mesh(bodyGeo, wallMat);
  mBody.position.y = h / 2;
  const mRoof = new THREE.Mesh(roofGeo, roofMat);
  mRoof.rotation.y = Math.PI / 4;
  mRoof.position.y = h + 1.4;
  med.add(mBody, mRoof);

  lod.addLevel(high, 0);
  lod.addLevel(med, 68);
  lod.addLevel(new THREE.Group(), 155);
  return lod;
}

export function createTrafficLight(pool: ModelAssetPool): THREE.Group {
  const g = new THREE.Group();
  const metal = pool.darkMetalMat;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 4.8, 6), metal);
  pole.position.y = 2.4;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), metal);
  arm.position.set(1.1, 4.7, 0);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.9, 0.3), metal);
  box.position.set(2.1, 4.5, 0);

  const red = new THREE.Mesh(pool.sphere8Geo, pool.trackMat(new THREE.MeshBasicMaterial({ color: 0xef4444 })));
  red.position.set(2.1, 4.76, 0.15);
  const amber = new THREE.Mesh(pool.sphere8Geo, pool.trackMat(new THREE.MeshBasicMaterial({ color: 0xf59e0b })));
  amber.position.set(2.1, 4.5, 0.15);
  const green = new THREE.Mesh(pool.sphere8Geo, pool.trackMat(new THREE.MeshBasicMaterial({ color: 0x22c55e })));
  green.position.set(2.1, 4.24, 0.15);

  g.add(pole, arm, box, red, amber, green);
  return g;
}

/**
 * Giant Roadside / Rooftop Billboard synchronized cleanly to BrandAssetSlot aspect ratio.
 */
export function createAspectBillboard(
  slot: BrandAssetSlot,
  displayHeight = 3.8,
  pool?: ModelAssetPool,
  withPoles = true,
): THREE.Group {
  const g = new THREE.Group();
  const frameMat = pool?.billboardFrameMat ?? new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
  const cy = withPoles ? 6.4 : displayHeight / 2 + 0.3;

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.32), frameMat);
  frame.position.y = cy;
  frame.scale.set(displayHeight * slot.aspect + 0.45, displayHeight + 0.4, 1);

  const face = createAspectTexturedPlane(slot, displayHeight);
  face.position.set(0, cy, 0.18);

  const faceBack = createAspectTexturedPlane(slot, displayHeight);
  faceBack.rotation.y = Math.PI;
  faceBack.position.set(0, cy, -0.18);

  slot.onAspectReady.push((actualAspect) => {
    frame.scale.x = displayHeight * actualAspect + 0.45;
  });

  if (withPoles) {
    const pGeo = new THREE.CylinderGeometry(0.18, 0.22, cy - displayHeight / 2, 6);
    const p1 = new THREE.Mesh(pGeo, frameMat);
    p1.position.set(-2.4, (cy - displayHeight / 2) / 2, 0);
    const p2 = p1.clone();
    p2.position.x = 2.4;
    g.add(p1, p2);
  }

  g.add(frame, face, faceBack);
  return g;
}

/**
 * Wall-mounted or Fence-mounted Square/Poster/Banner Sign with backing border + exact aspect sync.
 */
export function createWallBanner(slot: BrandAssetSlot, targetHeight: number, doubleSided = false): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 }),
  );
  frame.scale.set(targetHeight * slot.aspect + 0.2, targetHeight + 0.2, 1);

  const front = createAspectTexturedPlane(slot, targetHeight, { polygonOffset: true });
  front.position.z = 0.06;
  g.add(frame, front);

  if (doubleSided) {
    const back = createAspectTexturedPlane(slot, targetHeight, { polygonOffset: true });
    back.rotation.y = Math.PI;
    back.position.z = -0.06;
    g.add(back);
  }

  slot.onAspectReady.push((actualAspect) => {
    frame.scale.x = targetHeight * actualAspect + 0.2;
  });

  return g;
}

/**
 * Festive Street Banner Arch (e.g. عيد.png & festive street sign) spanning boulevard walkways.
 */
export function createStreetFestiveBanner(slot: BrandAssetSlot, widthSpan = 9.5, bannerHeight = 2.6, pool?: ModelAssetPool): THREE.Group {
  const g = new THREE.Group();
  const poleMat = pool?.chromeMat ?? new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 });
  const poleH = 6.2;
  const pGeo = new THREE.CylinderGeometry(0.1, 0.13, poleH, 6);
  const pL = new THREE.Mesh(pGeo, poleMat);
  pL.position.set(-widthSpan / 2, poleH / 2, 0);
  const pR = new THREE.Mesh(pGeo, poleMat);
  pR.position.set(widthSpan / 2, poleH / 2, 0);

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, widthSpan + 0.3, 6), poleMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = poleH - 0.15;

  const face = createAspectTexturedPlane(slot, bannerHeight, { doubleSided: true });
  face.position.set(0, poleH - bannerHeight * 0.5 - 0.2, 0);

  g.add(pL, pR, bar, face);
  return g;
}

/**
 * Animated Waving Egyptian Flag Pole (GPU Vertex Shader on MeshStandardMaterial -> 0% CPU cost).
 */
export function createEgyptFlagPole(
  flagTex: THREE.CanvasTexture,
  scale = 1,
  flagUniformsOut: Array<{ value: number }>,
  pool?: ModelAssetPool,
): THREE.Group {
  const g = new THREE.Group();
  const poleMat = pool?.chromeMat ?? new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.88 });
  const baseMat = pool?.darkMetalMat ?? new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

  const poleH = 8.6;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.45, 8), baseMat);
  plinth.position.y = 0.225;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, poleH, 8), poleMat);
  pole.position.y = poleH / 2;

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), goldMat);
  finial.position.y = poleH + 0.1;

  // Subdivided flag fabric anchored at x = 0 (uv.x = 0)
  const flagW = 3.3;
  const flagH = 2.15;
  const flagGeo = new THREE.PlaneGeometry(flagW, flagH, 12, 4);
  flagGeo.translate(flagW / 2 + 0.08, 0, 0);

  const timeUniform = { value: 0 };
  flagUniformsOut.push(timeUniform);

  const flagMat = new THREE.MeshStandardMaterial({
    map: flagTex,
    roughness: 0.65,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  flagMat.onBeforeCompile = (shader) => {
    shader.uniforms.uFlagTime = timeUniform;
    shader.vertexShader = 'uniform float uFlagTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float pinWeight = clamp(uv.x, 0.0, 1.0);
      float wave = sin(uv.x * 7.5 - uFlagTime * 4.6) * 0.22 + cos(uv.y * 4.0 - uFlagTime * 3.0) * 0.06;
      transformed.z += wave * pinWeight;
      transformed.y += sin(uv.x * 5.0 - uFlagTime * 3.8) * 0.08 * pinWeight;
      `,
    );
  };

  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0, poleH - flagH / 2 - 0.25, 0);

  g.add(plinth, pole, finial, flagMesh);
  g.scale.setScalar(scale);
  return g;
}

export function createCafeSet(umbrellaColor: number): THREE.Group {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const umbMat = new THREE.MeshStandardMaterial({ color: umbrellaColor, roughness: 0.65, side: THREE.DoubleSide });

  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 10), tableMat);
  table.position.y = 0.78;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.3, 6), poleMat);
  leg.position.y = 1.15;
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.65, 7), umbMat);
  umb.position.y = 2.35;
  g.add(table, leg, umb);
  return g;
}

/**
 * LOD Palm Tree:
 * 0-52m: 5 trunk segs + 7 fronds
 * 52-130m: 2-mesh simplified palm
 * 130m+: hidden
 */
export function createPalmTreeLOD(scale = 1, pool?: ModelAssetPool): THREE.LOD {
  const lod = new THREE.LOD();
  const trunkMat = pool?.trunkMat ?? new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.9 });
  const leafMat = pool?.palmLeafMat ?? new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.65, side: THREE.DoubleSide });

  const high = new THREE.Group();
  const segs = 5;
  let y = 0;
  let leanX = 0;
  for (let i = 0; i < segs; i++) {
    const rBottom = 0.26 - i * 0.025;
    const rTop = 0.23 - i * 0.025;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, 1.35, 6), trunkMat);
    seg.position.set(leanX, y + 0.65, 0);
    seg.rotation.z = -0.05 * i;
    high.add(seg);
    y += 1.25;
    leanX += 0.11 * i;
  }

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const frondPivot = new THREE.Group();
    frondPivot.position.set(leanX, y, 0);
    frondPivot.rotation.y = angle;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.7, 4), leafMat);
    frond.rotation.x = Math.PI * 0.64;
    frond.position.set(0, -0.15, 1.3);
    frond.scale.set(1, 1, 0.25);
    frondPivot.add(frond);
    high.add(frondPivot);
  }

  const med = new THREE.Group();
  const mTrunk = new THREE.Mesh(pool?.palmLowTrunkGeo ?? new THREE.CylinderGeometry(0.18, 0.28, 6.2, 6), trunkMat);
  mTrunk.position.y = 3.1;
  const mCrown = new THREE.Mesh(pool?.palmLowCrownGeo ?? new THREE.ConeGeometry(2.1, 1.8, 6), leafMat);
  mCrown.position.y = 6.2;
  med.add(mTrunk, mCrown);

  lod.addLevel(high, 0);
  lod.addLevel(med, 52);
  lod.addLevel(new THREE.Group(), 132);
  lod.scale.setScalar(scale);
  return lod;
}

/**
 * LOD Park Tree:
 * 0-52m: trunk + 2 dodecahedrons
 * 52-130m: low-poly 1-sphere canopy
 * 130m+: hidden
 */
export function createParkTreeLOD(scale = 1, pool?: ModelAssetPool): THREE.LOD {
  const lod = new THREE.LOD();
  const trunkMat = pool?.trunkMat ?? new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const canopyMat = pool?.canopyMat ?? new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.78 });

  const high = new THREE.Group();
  const trunk = new THREE.Mesh(pool?.parkTrunkGeo ?? new THREE.CylinderGeometry(0.24, 0.34, 2.4, 6), trunkMat);
  trunk.position.y = 1.2;
  const c1 = new THREE.Mesh(pool?.parkCanopy1Geo ?? new THREE.DodecahedronGeometry(1.5, 0), canopyMat);
  c1.position.y = 3.1;
  const c2 = new THREE.Mesh(pool?.parkCanopy2Geo ?? new THREE.DodecahedronGeometry(1.15, 0), canopyMat);
  c2.position.set(0.7, 3.6, 0.4);
  high.add(trunk, c1, c2);

  const med = new THREE.Group();
  const mTrunk = new THREE.Mesh(pool?.parkTrunkGeo ?? new THREE.CylinderGeometry(0.24, 0.34, 2.4, 6), trunkMat);
  mTrunk.position.y = 1.2;
  const mCanopy = new THREE.Mesh(pool?.parkCanopy1Geo ?? new THREE.DodecahedronGeometry(1.5, 0), canopyMat);
  mCanopy.position.y = 3.2;
  med.add(mTrunk, mCanopy);

  lod.addLevel(high, 0);
  lod.addLevel(med, 52);
  lod.addLevel(new THREE.Group(), 132);
  lod.scale.setScalar(scale);
  return lod;
}

/**
 * LOD Street Lamp with optional Poster attached on the pole.
 */
export function createStreetLampLOD(
  pool: ModelAssetPool,
  posterSlot?: BrandAssetSlot,
): { lod: THREE.LOD; bulbMat: THREE.MeshStandardMaterial } {
  const lod = new THREE.LOD();
  const poleMat = pool.darkMetalMat;
  const bulbMat = pool.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    }),
  );

  const high = new THREE.Group();
  const base = new THREE.Mesh(pool.lampBaseGeo, poleMat);
  base.position.y = 0.3;
  const pole = new THREE.Mesh(pool.lampPoleGeo, poleMat);
  pole.position.y = 2.9;
  const arm = new THREE.Mesh(pool.lampArmGeo, poleMat);
  arm.position.set(0.55, 5.45, 0);
  const head = new THREE.Mesh(pool.lampHeadGeo, poleMat);
  head.position.set(1.1, 5.42, 0);
  const bulb = new THREE.Mesh(pool.lampBulbGeo, bulbMat);
  bulb.position.set(1.1, 5.34, 0);
  high.add(base, pole, arm, head, bulb);

  if (posterSlot) {
    const poster = createWallBanner(posterSlot, 1.35, true);
    poster.position.set(0, 2.8, 0.14);
    high.add(poster);
  }

  const med = new THREE.Group();
  const mPole = new THREE.Mesh(pool.lampPoleGeo, poleMat);
  mPole.position.y = 2.9;
  med.add(mPole);

  lod.addLevel(high, 0);
  lod.addLevel(med, 55);
  lod.addLevel(new THREE.Group(), 125);
  return { lod, bulbMat };
}

export function createStuntRamp(): THREE.Group {
  const group = new THREE.Group();
  const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.3 });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(7.5, 0);
  shape.lineTo(7.5, 2.3);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 5.5, bevelEnabled: false });
  geo.center();
  const wedge = new THREE.Mesh(geo, rampMat);
  wedge.rotation.y = -Math.PI / 2;
  wedge.position.y = 1.15;
  wedge.receiveShadow = true;

  const arrow = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 4.6), stripeMat);
  arrow.position.set(0, 1.28, 0.1);
  arrow.rotation.x = -0.3;

  group.add(wedge, arrow);
  return group;
}

export function createPickupMesh(kind: 'health' | 'armor' | 'cash' | 'wanted'): THREE.Group {
  const group = new THREE.Group();
  const colorMap = {
    health: 0x22c55e,
    armor: 0x3b82f6,
    cash: 0xfacc15,
    wanted: 0xa855f7,
  };
  const mat = new THREE.MeshStandardMaterial({
    color: colorMap[kind],
    emissive: colorMap[kind],
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.4,
  });

  if (kind === 'health') {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.3), mat);
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.3), mat);
    group.add(v, h);
  } else if (kind === 'cash') {
    const coin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.42), mat);
    group.add(coin);
  } else if (kind === 'armor') {
    const shield = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), mat);
    group.add(shield);
  } else {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 6, 16), mat);
    group.add(star, ring);
  }
  return group;
}

export function createRestaurantMesh(
  accentColor: number,
  labelText: string,
  shopLogoSlot?: BrandAssetSlot,
): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const awningMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.55 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.4, 6.5), wallMat);
  body.position.y = 2.2;
  body.castShadow = true;
  body.receiveShadow = true;

  const glass = new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.2, 0.2), glassMat);
  glass.position.set(0, 1.4, 3.28);

  const awning = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.35, 2.2), awningMat);
  awning.position.set(0, 2.85, 4.1);
  awning.rotation.x = 0.22;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labelText, 128, 40);
  const signTex = new THREE.CanvasTexture(c);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.3), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(0, 3.8, 3.3);

  if (shopLogoSlot) {
    const logoLeft = createAspectTexturedPlane(shopLogoSlot, 1.4, { polygonOffset: true });
    logoLeft.position.set(-4.3, 2.4, 0);
    logoLeft.rotation.y = -Math.PI / 2;
    const logoRight = createAspectTexturedPlane(shopLogoSlot, 1.4, { polygonOffset: true });
    logoRight.position.set(4.3, 2.4, 0);
    logoRight.rotation.y = Math.PI / 2;
    g.add(logoLeft, logoRight);
  }

  const cafe1 = createCafeSet(accentColor);
  cafe1.position.set(-2.4, 0, 5.4);
  const cafe2 = createCafeSet(accentColor);
  cafe2.position.set(2.4, 0, 5.4);

  g.add(body, glass, awning, sign, cafe1, cafe2);
  return g;
}

export function createBreakableProp(kind: 'hydrant' | 'trash' | 'cone' | 'bench', pool?: ModelAssetPool): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'hydrant') {
    const red = pool?.redHydrantMat ?? new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.72, 8), red);
    body.position.y = 0.36;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), red);
    cap.position.y = 0.74;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.48, 6), red);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.y = 0.5;
    g.add(body, cap, nozzle);
  } else if (kind === 'trash') {
    const mat = pool?.trashMat ?? new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.65 });
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.9, 8), mat);
    bin.position.y = 0.45;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 8), mat);
    lid.position.y = 0.92;
    g.add(bin, lid);
  } else if (kind === 'cone') {
    const orange = pool?.coneOrangeMat ?? new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
    const white = pool?.coneWhiteMat ?? new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), orange);
    base.position.y = 0.03;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 8), orange);
    cone.position.y = 0.34;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 8), white);
    stripe.position.y = 0.34;
    g.add(base, cone, stripe);
  } else {
    const wood = pool?.woodMat ?? new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 });
    const iron = pool?.darkMetalMat ?? new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.55), wood);
    seat.position.y = 0.48;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 0.08), wood);
    back.position.set(0, 0.75, -0.24);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.48, 0.5), iron);
    legL.position.set(-0.7, 0.24, 0);
    const legR = legL.clone();
    legR.position.x = 0.7;
    g.add(seat, back, legL, legR);
  }
  return g;
}
