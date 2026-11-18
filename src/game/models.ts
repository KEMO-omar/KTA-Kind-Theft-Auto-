import * as THREE from 'three';
import { VehicleKind, WeaponId } from '../types/game';

export interface VehicleRig {
  group: THREE.Group;
  wheels: THREE.Group[];
  frontSteerPivots: THREE.Group[];
  headlights: THREE.MeshStandardMaterial;
  taillights: THREE.MeshStandardMaterial;
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

function makeWheel(radius: number, width: number): THREE.Group {
  const wheel = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88, metalness: 0.08 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.6 });

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 20), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 14), rimMat);
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
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.024, 0.56, 10), woodMat);
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
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.15, 8), gunSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, 0.28);
    g.add(body, mag, barrel);
  } else if (id === 'shotgun') {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.26), woodMat);
    stock.position.set(0, 0.01, -0.05);
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.095, 0.28), darkMetal);
    receiver.position.set(0, 0.03, 0.15);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 8), gunSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.06, 0.44);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.18, 8), woodMat);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, 0.02, 0.4);
    g.add(stock, receiver, barrel, pump);
  } else if (id === 'rifle') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.1, 0.42), darkMetal);
    body.position.set(0, 0.03, 0.15);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), gunSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.045, 0.48);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.075), darkMetal);
    mag.position.set(0, -0.08, 0.2);
    mag.rotation.x = 0.22;
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8), gunSteel);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.105, 0.15);
    g.add(body, barrel, mag, scope);
  } else if (id === 'rpg') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.05, 12), oliveMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0.12, 0.25);
    const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 10), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
    warhead.rotation.x = Math.PI / 2;
    warhead.position.set(0, 0.12, 0.85);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), darkMetal);
    grip.position.set(0, 0.01, 0.28);
    g.add(tube, warhead, grip);
  }
  return g;
}

export function createVehicleMesh(kind: VehicleKind, primaryColor: number): VehicleRig {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: kind === 'police' ? 0x0f172a : kind === 'taxi' ? 0xfacc15 : primaryColor,
    roughness: 0.18,
    metalness: 0.58,
    clearcoat: 0.92,
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

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.14, metalness: 0.94 });
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

    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8), chromeMat);
    fork.position.set(0, 0.68, 0.78);
    fork.rotation.x = 0.28;

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.78, 8), secondaryMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.05, 0.52);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.75, 10), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.24, 0.42, -0.45);

    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), headlights);
    hl.position.set(0, 0.9, 0.95);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.08), taillights);
    tl.position.set(0, 0.86, -0.82);

    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0.34, 0.88);
    const fw = makeWheel(0.34, 0.16);
    frontPivot.add(fw);

    const rearPivot = new THREE.Group();
    rearPivot.position.set(0, 0.34, -0.78);
    const rw = makeWheel(0.34, 0.2);
    rearPivot.add(rw);

    group.add(frame, tank, seat, cowl, screen, fork, handlebar, exhaust, hl, tl, frontPivot, rearPivot);
    return {
      group,
      wheels: [fw, rw],
      frontSteerPivots: [frontPivot],
      headlights,
      taillights,
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
  const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8), chromeMat);
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

  // Signature Gear
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
    const spare = makeWheel(0.36, 0.22);
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
    const w = makeWheel(wheelR, wheelW);
    pivot.add(w);
    group.add(pivot);
    wheels.push(w);
    if (pos.front) frontSteerPivots.push(pivot);
  });

  return { group, wheels, frontSteerPivots, headlights, taillights, sirenRed, sirenBlue };
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
}): CharacterRig {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.62 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: cfg.jacket, roughness: 0.52, metalness: 0.08 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: cfg.shirt, roughness: 0.68 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pants, roughness: 0.78 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const shoeSoleMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: cfg.hair, roughness: 0.82 });

  // Pelvis / Hips
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.22, 12), pantsMat);
  pelvis.position.y = 0.88;
  group.add(pelvis);

  // Sculpted Torso (Chest + Jacket Collar + Belt)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.21, 0.56, 12), jacketMat);
  torso.scale.set(1.12, 1, 0.65);
  torso.position.y = 1.24;
  torso.castShadow = true;
  group.add(torso);

  const chestV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.46, 0.28), shirtMat);
  chestV.position.set(0, 1.25, 0.04);
  group.add(chestV);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.06, 12), shoeSoleMat);
  belt.scale.set(1.08, 1, 0.68);
  belt.position.y = 0.96;
  group.add(belt);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.14, 10), skinMat);
  neck.position.y = 1.56;
  group.add(neck);

  // Sculpted Rounded Head + Ears + Hair/Cap/Sunglasses
  const head = new THREE.Group();
  head.position.set(0, 1.72, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 12), skinMat);
  skull.scale.set(0.92, 1.08, 0.96);
  skull.castShadow = true;

  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.095, 0.14, 10), skinMat);
  jaw.position.set(0, -0.09, 0.02);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.05), skinMat);
  nose.position.set(0, -0.01, 0.17);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), skinMat);
  earL.position.set(-0.16, 0, 0);
  const earR = earL.clone();
  earR.position.x = 0.16;

  head.add(skull, jaw, nose, earL, earR);

  if (cfg.isPolice) {
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.1, 12), capMat);
    capTop.position.set(0, 0.14, 0);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.14), shoeSoleMat);
    visor.position.set(0, 0.1, 0.16);
    head.add(capTop, visor);
  } else {
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.182, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
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
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    eyeL.position.set(-0.058, 0.03, 0.158);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.058;
    head.add(eyeL, eyeR);
  }

  if (cfg.isHostile) {
    const bandana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.14, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 }),
    );
    bandana.position.set(0, -0.07, 0.02);
    head.add(bandana);
  }
  group.add(head);

  // Articulated Arms (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand)
  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.31, 1.46, 0);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.28, 10), jacketMat);
    upper.position.y = -0.14;
    upper.castShadow = true;

    const forearmPivot = new THREE.Group();
    forearmPivot.position.y = -0.28;
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.25, 10), jacketMat);
    forearm.position.y = -0.125;
    forearm.castShadow = true;

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat);
    hand.position.y = -0.27;

    forearmPivot.add(forearm, hand);
    shoulder.add(upper, forearmPivot);
    group.add(shoulder);
    return { shoulder, forearmPivot };
  };

  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Weapon Mount attached to Right Hand
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

  // Articulated Legs (Hip -> Thigh -> Shin -> Sneaker)
  const makeLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, 0.84, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.38, 10), pantsMat);
    thigh.position.y = -0.19;
    thigh.castShadow = true;

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.36, 10), pantsMat);
    shin.position.y = -0.55;
    shin.castShadow = true;

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

export function createHouseMesh(
  wallTex: THREE.CanvasTexture,
  roofTex: THREE.CanvasTexture,
  tintColor: number,
  twoStory = true,
): THREE.Group {
  const house = new THREE.Group();
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

  const w = 11.5;
  const d = 10.0;
  const h = twoStory ? 6.6 : 4.0;

  // Main House Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  // Pitched Hip Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(8.6, 2.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + 1.4;
  roof.castShadow = true;
  house.add(roof);

  // Front Door + Porch Canopy
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.18), doorMat);
  door.position.set(-1.5, 1.2, d / 2 + 0.05);
  const porch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 1.8), trimMat);
  porch.position.set(-1.5, 2.7, d / 2 + 0.8);
  house.add(door, porch);

  // Garage Door
  const garage = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2.5, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.5 }),
  );
  garage.position.set(2.8, 1.25, d / 2 + 0.06);
  house.add(garage);

  // Glowing Windows (Front & Back & Upper Floor)
  [-3.8, 0.5].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 0.15), winMat);
    win.position.set(wx, 1.7, d / 2 + 0.06);
    house.add(win);
    if (twoStory) {
      const win2 = win.clone();
      win2.position.y = 4.6;
      house.add(win2);
    }
  });
  if (twoStory) {
    const winG = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 0.15), winMat);
    winG.position.set(2.8, 4.6, d / 2 + 0.06);
    house.add(winG);
  }

  // Garden Hedges
  const hedgeL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 0.7), hedgeMat);
  hedgeL.position.set(-3.8, 0.4, d / 2 + 1.4);
  house.add(hedgeL);

  return house;
}

export function createTrafficLight(): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 4.8, 8), metal);
  pole.position.y = 2.4;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), metal);
  arm.position.set(1.1, 4.7, 0);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.9, 0.3), metal);
  box.position.set(2.1, 4.5, 0);

  const red = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  );
  red.position.set(2.1, 4.76, 0.15);
  const amber = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
  );
  amber.position.set(2.1, 4.5, 0.15);
  const green = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x22c55e }),
  );
  green.position.set(2.1, 4.24, 0.15);

  g.add(pole, arm, box, red, amber, green);
  return g;
}

export function createBillboard(tex: THREE.CanvasTexture): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6, 8), metal);
  p1.position.set(-3.2, 3, 0);
  const p2 = p1.clone();
  p2.position.x = 3.2;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(9.2, 3.6, 0.35), metal);
  frame.position.y = 6.5;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 3.2),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.set(0, 6.5, 0.19);
  const faceBack = face.clone();
  faceBack.rotation.y = Math.PI;
  faceBack.position.z = -0.19;
  g.add(p1, p2, frame, face, faceBack);
  return g;
}

export function createCafeSet(umbrellaColor: number): THREE.Group {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const umbMat = new THREE.MeshStandardMaterial({ color: umbrellaColor, roughness: 0.65, side: THREE.DoubleSide });

  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), tableMat);
  table.position.y = 0.78;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.3, 8), poleMat);
  leg.position.y = 1.15;
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.65, 8), umbMat);
  umb.position.y = 2.35;
  g.add(table, leg, umb);
  return g;
}

export function createPalmTree(scale = 1): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.65, side: THREE.DoubleSide });

  const segs = 5;
  let y = 0;
  let leanX = 0;
  for (let i = 0; i < segs; i++) {
    const rBottom = 0.26 - i * 0.025;
    const rTop = 0.23 - i * 0.025;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, 1.35, 8), trunkMat);
    seg.position.set(leanX, y + 0.65, 0);
    seg.rotation.z = -0.05 * i;
    seg.castShadow = true;
    tree.add(seg);
    y += 1.25;
    leanX += 0.11 * i;
  }

  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const frondPivot = new THREE.Group();
    frondPivot.position.set(leanX, y, 0);
    frondPivot.rotation.y = angle;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.7, 5), leafMat);
    frond.rotation.x = Math.PI * 0.64;
    frond.position.set(0, -0.15, 1.3);
    frond.scale.set(1, 1, 0.25);
    frond.castShadow = true;
    frondPivot.add(frond);
    tree.add(frondPivot);
  }

  tree.scale.setScalar(scale);
  return tree;
}

export function createParkTree(scale = 1): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.78 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 2.4, 8), trunkMat);
  trunk.position.y = 1.2;
  trunk.castShadow = true;

  const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), canopyMat);
  c1.position.y = 3.1;
  c1.castShadow = true;

  const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), canopyMat);
  c2.position.set(0.7, 3.6, 0.4);
  c2.castShadow = true;

  tree.add(trunk, c1, c2);
  tree.scale.setScalar(scale);
  return tree;
}

export function createStreetLamp(): { group: THREE.Group; bulbMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.6, 8), poleMat);
  base.position.y = 0.3;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 8), poleMat);
  pole.position.y = 2.9;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.1), poleMat);
  arm.position.set(0.55, 5.45, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.28), poleMat);
  head.position.set(1.1, 5.42, 0);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.22), bulbMat);
  bulb.position.set(1.1, 5.34, 0);

  group.add(base, pole, arm, head, bulb);
  return { group, bulbMat };
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
  wedge.castShadow = true;
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
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 20), mat);
    group.add(star, ring);
  }
  return group;
}
