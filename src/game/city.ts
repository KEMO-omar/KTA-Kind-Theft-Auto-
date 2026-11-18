import * as THREE from 'three';
import { CityTextures } from './textures';
import {
  createBillboard,
  createCafeSet,
  createHouseMesh,
  createPalmTree,
  createParkTree,
  createPickupMesh,
  createStreetLamp,
  createStuntRamp,
  createTrafficLight,
} from './models';

export const ROAD_CENTERS = [-112, -56, 0, 56, 112];
export const BLOCK_CENTERS = [-84, -28, 28, 84];
export const ROAD_WIDTH = 12;
export const WORLD_LIMIT = 132;

export interface BuildingCollider {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  isHouse?: boolean;
}

export interface RampCollider {
  x: number;
  z: number;
  yaw: number;
  width: number;
  length: number;
  height: number;
}

export interface WorldPickup {
  id: string;
  kind: 'health' | 'armor' | 'cash' | 'wanted';
  x: number;
  z: number;
  mesh: THREE.Group;
  cooldown: number;
  temporary?: boolean;
  value?: number;
}

export interface MissionSpot {
  id: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  x: number;
  z: number;
  reward: number;
  color: number;
  ringMesh: THREE.Mesh;
}

export interface BuiltCity {
  buildings: BuildingCollider[];
  ramps: RampCollider[];
  pickups: WorldPickup[];
  missionSpots: MissionSpot[];
  lampBulbMats: THREE.MeshStandardMaterial[];
  buildingMats: THREE.MeshStandardMaterial[];
  neonMats: THREE.MeshStandardMaterial[];
  waterMesh: THREE.Mesh;
}

export function buildCityWorld(scene: THREE.Scene, textures: CityTextures): BuiltCity {
  const buildings: BuildingCollider[] = [];
  const ramps: RampCollider[] = [];
  const pickups: WorldPickup[] = [];
  const missionSpots: MissionSpot[] = [];
  const lampBulbMats: THREE.MeshStandardMaterial[] = [];
  const neonMats: THREE.MeshStandardMaterial[] = [];

  const buildingMats = textures.facades.map(
    (f) =>
      new THREE.MeshStandardMaterial({
        map: f.map,
        emissiveMap: f.emissiveMap,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.75,
        roughness: 0.65,
        metalness: 0.15,
      }),
  );

  // Base terrain extending to horizon
  const baseGround = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ color: 0x263529, roughness: 0.95 }),
  );
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.set(-80, -0.05, 0);
  baseGround.receiveShadow = true;
  scene.add(baseGround);

  // Beach & Ocean Bay (East side)
  const sandMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 800),
    new THREE.MeshStandardMaterial({ map: textures.sand, roughness: 0.92 }),
  );
  sandMesh.rotation.x = -Math.PI / 2;
  sandMesh.position.set(140, -0.02, 0);
  sandMesh.receiveShadow = true;
  scene.add(sandMesh);

  const waterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 900),
    new THREE.MeshStandardMaterial({
      map: textures.water,
      roughness: 0.16,
      metalness: 0.38,
    }),
  );
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(450, -0.25, 0);
  scene.add(waterMesh);

  // Waterfront boardwalk + Cafe seating along the beach
  const boardwalk = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.25, 250),
    new THREE.MeshStandardMaterial({ color: 0x926239, roughness: 0.85 }),
  );
  boardwalk.position.set(123.5, 0.08, 0);
  boardwalk.receiveShadow = true;
  scene.add(boardwalk);

  [-68, -42, -16, 16, 42, 68].forEach((cz, idx) => {
    const cafe = createCafeSet(idx % 2 === 0 ? 0xf59e0b : 0x0d9488);
    cafe.position.set(123.5, 0.2, cz);
    scene.add(cafe);
  });

  // Road Grid
  const roadMatH = new THREE.MeshStandardMaterial({
    map: textures.roadH,
    roughness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const roadMatV = new THREE.MeshStandardMaterial({
    map: textures.roadV,
    roughness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const interMat = new THREE.MeshStandardMaterial({
    map: textures.intersection,
    roughness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  for (const rz of ROAD_CENTERS) {
    for (const bx of BLOCK_CENTERS) {
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(44, ROAD_WIDTH), roadMatH);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(bx, 0.02, rz);
      seg.receiveShadow = true;
      scene.add(seg);
    }
  }
  for (const rx of ROAD_CENTERS) {
    for (const bz of BLOCK_CENTERS) {
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, 44), roadMatV);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(rx, 0.02, bz);
      seg.receiveShadow = true;
      scene.add(seg);
    }
  }
  for (const rx of ROAD_CENTERS) {
    for (const rz of ROAD_CENTERS) {
      const inter = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_WIDTH), interMat);
      inter.rotation.x = -Math.PI / 2;
      inter.position.set(rx, 0.03, rz);
      inter.receiveShadow = true;
      scene.add(inter);

      // Traffic lights at inner intersections
      if (Math.abs(rx) <= 56 && Math.abs(rz) <= 56) {
        const tl = createTrafficLight();
        tl.position.set(rx - 7.5, 0.2, rz - 7.5);
        scene.add(tl);
      }
    }
  }

  // Sidewalks & City Blocks
  const sidewalkMat = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 0.85 });
  const grassMat = new THREE.MeshStandardMaterial({ map: textures.grass, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const neonColors = [0xf59e0b, 0x14b8a6, 0xec4899, 0x38bdf8];
  const houseTints = [0xfef3c7, 0xfecdd3, 0xdbeafe, 0xd1fae5];

  BLOCK_CENTERS.forEach((bx, ix) => {
    BLOCK_CENTERS.forEach((bz, iz) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(44, 0.24, 44), sidewalkMat);
      pad.position.set(bx, 0.08, bz);
      pad.receiveShadow = true;
      scene.add(pad);

      // Streetlamps
      [
        { dx: -20, dz: -20, ry: -Math.PI / 4 },
        { dx: 20, dz: 20, ry: (3 * Math.PI) / 4 },
      ].forEach((lp) => {
        const lamp = createStreetLamp();
        lamp.group.position.set(bx + lp.dx, 0.2, bz + lp.dz);
        lamp.group.rotation.y = lp.ry;
        scene.add(lamp.group);
        lampBulbMats.push(lamp.bulbMat);
      });

      // 1. Central Kindness Park (-28, -28)
      if (ix === 1 && iz === 1) {
        const lawn = new THREE.Mesh(new THREE.BoxGeometry(38, 0.08, 38), grassMat);
        lawn.position.set(bx, 0.22, bz);
        lawn.receiveShadow = true;
        scene.add(lawn);

        const basin = new THREE.Mesh(
          new THREE.CylinderGeometry(5.5, 6.0, 0.7, 20),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 }),
        );
        basin.position.set(bx, 0.55, bz);
        basin.castShadow = true;
        const pool = new THREE.Mesh(
          new THREE.CylinderGeometry(4.8, 4.8, 0.2, 20),
          new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.4 }),
        );
        pool.position.set(bx, 0.86, bz);
        const spire = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.4, 0),
          new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2,
          }),
        );
        spire.position.set(bx, 2.4, bz);
        scene.add(basin, pool, spire);
        buildings.push({ x: bx, z: bz, w: 11, d: 11, h: 3 });

        [
          [-14, -14],
          [14, -14],
          [-14, 14],
          [14, 14],
        ].forEach(([tx, tz]) => {
          const tree = createParkTree(1.1);
          tree.position.set(bx + tx, 0.24, bz + tz);
          scene.add(tree);
        });

        const cafe1 = createCafeSet(0x14b8a6);
        cafe1.position.set(bx - 11, 0.24, bz);
        const cafe2 = createCafeSet(0xf59e0b);
        cafe2.position.set(bx + 11, 0.24, bz);
        scene.add(cafe1, cafe2);
        return;
      }

      // 2. Residential Coastal Houses & Villas Neighborhood (ix === 0 || (ix === 3 && iz === 0))
      if ((ix === 0 && (iz === 0 || iz === 1)) || (ix === 3 && iz === 0)) {
        const yard = new THREE.Mesh(new THREE.BoxGeometry(39, 0.08, 39), grassMat);
        yard.position.set(bx, 0.22, bz);
        yard.receiveShadow = true;
        scene.add(yard);

        const housePositions = [
          { dx: -10, dz: -10, rot: 0, twoStory: true },
          { dx: 10, dz: -10, rot: 0, twoStory: false },
          { dx: -10, dz: 10, rot: Math.PI, twoStory: false },
          { dx: 10, dz: 10, rot: Math.PI, twoStory: true },
        ];
        housePositions.forEach((hp, hIdx) => {
          const tint = houseTints[(ix + iz + hIdx) % houseTints.length];
          const house = createHouseMesh(textures.houseWall, textures.roofTile, tint, hp.twoStory);
          house.position.set(bx + hp.dx, 0.25, bz + hp.dz);
          house.rotation.y = hp.rot;
          scene.add(house);
          buildings.push({ x: bx + hp.dx, z: bz + hp.dz, w: 11.6, d: 10.2, h: 7, isHouse: true });
        });

        const palm = createPalmTree(0.95);
        palm.position.set(bx, 0.25, bz);
        scene.add(palm);
        return;
      }

      // 3. Stunt Arena & Armory Lot at (28, 84)
      if (ix === 2 && iz === 3) {
        const lot = new THREE.Mesh(
          new THREE.BoxGeometry(40, 0.06, 40),
          new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 }),
        );
        lot.position.set(bx, 0.22, bz);
        lot.receiveShadow = true;
        scene.add(lot);

        const ramp1 = createStuntRamp();
        ramp1.position.set(bx - 8, 0.24, bz);
        ramp1.rotation.y = 0;
        scene.add(ramp1);
        ramps.push({ x: bx - 8, z: bz, yaw: 0, width: 5.5, length: 7.5, height: 2.3 });

        const ramp2 = createStuntRamp();
        ramp2.position.set(bx + 8, 0.24, bz);
        ramp2.rotation.y = Math.PI;
        scene.add(ramp2);
        ramps.push({ x: bx + 8, z: bz, yaw: Math.PI, width: 5.5, length: 7.5, height: 2.3 });

        const bb = createBillboard(textures.billboards[2]);
        bb.position.set(bx, 0.24, bz - 16);
        scene.add(bb);
        return;
      }

      // 4. Waterfront Stunt Plaza at (84, -28)
      if (ix === 3 && iz === 1) {
        const plaza = new THREE.Mesh(
          new THREE.BoxGeometry(38, 0.08, 38),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 }),
        );
        plaza.position.set(bx, 0.22, bz);
        plaza.receiveShadow = true;
        scene.add(plaza);

        const ramp = createStuntRamp();
        ramp.position.set(bx + 6, 0.24, bz);
        ramp.rotation.y = Math.PI / 2;
        scene.add(ramp);
        ramps.push({ x: bx + 6, z: bz, yaw: Math.PI / 2, width: 5.5, length: 7.5, height: 2.3 });

        const bb = createBillboard(textures.billboards[1]);
        bb.position.set(bx - 10, 0.24, bz - 12);
        bb.rotation.y = Math.PI / 4;
        scene.add(bb);

        const palm1 = createPalmTree(1.2);
        palm1.position.set(bx - 12, 0.24, bz + 12);
        scene.add(palm1);
        return;
      }

      // 5. Downtown High-Rise & Commercial Blocks
      const seed = (ix * 7 + iz * 13) % 4;
      const subLayouts = [
        [
          { dx: -9.5, dz: -9.5, w: 15, d: 15, h: 28 + ((ix + iz) % 3) * 8 },
          { dx: 9.5, dz: -9.5, w: 15, d: 15, h: 18 + (ix % 2) * 7 },
          { dx: 0, dz: 9.5, w: 32, d: 14, h: 14 + (iz % 3) * 5 },
        ],
        [
          { dx: -9.5, dz: 0, w: 15, d: 32, h: 22 + (iz % 3) * 9 },
          { dx: 9.5, dz: -9.5, w: 15, d: 15, h: 36 },
          { dx: 9.5, dz: 9.5, w: 15, d: 15, h: 16 },
        ],
        [{ dx: 0, dz: 0, w: 26, d: 26, h: 34 + ((ix * iz) % 3) * 10 }],
        [
          { dx: -9.5, dz: -9.5, w: 15, d: 15, h: 20 },
          { dx: 9.5, dz: 9.5, w: 15, d: 15, h: 26 },
          { dx: -9.5, dz: 9.5, w: 15, d: 15, h: 14 },
          { dx: 9.5, dz: -9.5, w: 15, d: 15, h: 32 },
        ],
      ][seed];

      subLayouts.forEach((b, bIdx) => {
        const matIdx = (ix + iz + bIdx) % buildingMats.length;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), buildingMats[matIdx]);
        mesh.position.set(bx + b.dx, 0.2 + b.h / 2, bz + b.dz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.5, 0.6, b.d + 0.5), roofMat);
        cap.position.set(bx + b.dx, 0.2 + b.h + 0.3, bz + b.dz);
        scene.add(cap);

        // Rooftop HVAC unit detail
        const hvac = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 1.4, 2.6),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.4 }),
        );
        hvac.position.set(bx + b.dx - 2, 0.2 + b.h + 1.1, bz + b.dz + 1.5);
        scene.add(hvac);

        if (b.h >= 26) {
          const neonColor = neonColors[(ix + iz + bIdx) % neonColors.length];
          const neonMat = new THREE.MeshStandardMaterial({
            color: neonColor,
            emissive: neonColor,
            emissiveIntensity: 1.1,
            roughness: 0.2,
          });
          neonMats.push(neonMat);
          const trim = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.65, 0.35, b.d + 0.65), neonMat);
          trim.position.set(bx + b.dx, 0.2 + b.h - 0.3, bz + b.dz);
          scene.add(trim);
        }

        buildings.push({ x: bx + b.dx, z: bz + b.dz, w: b.w, d: b.d, h: b.h });
      });

      if (ix === 2 && iz === 0) {
        const bb = createBillboard(textures.billboards[0]);
        bb.position.set(bx, 0.24, bz + 18);
        scene.add(bb);
      }
    });
  });

  // Palm trees along beach & outer forest border
  for (let z = -115; z <= 115; z += 22) {
    const palm = createPalmTree(0.95 + (Math.abs(z) % 5) * 0.08);
    palm.position.set(129, 0.0, z);
    scene.add(palm);
  }
  for (let i = -140; i <= 140; i += 20) {
    const pNorth = createParkTree(1.2);
    pNorth.position.set(i, 0, -138 - (Math.abs(i) % 7));
    const pSouth = createParkTree(1.25);
    pSouth.position.set(i, 0, 138 + (Math.abs(i) % 7));
    const pWest = createPalmTree(1.15);
    pWest.position.set(-138 - (Math.abs(i) % 6), 0, i);
    scene.add(pNorth, pSouth, pWest);
  }

  // Pickups
  const pickupDefs: Array<{ id: string; kind: WorldPickup['kind']; x: number; z: number }> = [
    { id: 'p-hp-1', kind: 'health', x: -28, z: -40 },
    { id: 'p-arm-1', kind: 'armor', x: -28, z: -16 },
    { id: 'p-cash-1', kind: 'cash', x: 0, z: 0 },
    { id: 'p-cash-2', kind: 'cash', x: 84, z: -28 },
    { id: 'p-cash-3', kind: 'cash', x: 28, z: 84 },
    { id: 'p-want-1', kind: 'wanted', x: -56, z: 56 },
    { id: 'p-hp-2', kind: 'health', x: 56, z: -56 },
    { id: 'p-arm-2', kind: 'armor', x: 28, z: 68 },
  ];

  pickupDefs.forEach((pd) => {
    const mesh = createPickupMesh(pd.kind);
    mesh.position.set(pd.x, 1.15, pd.z);
    scene.add(mesh);
    pickups.push({ ...pd, mesh, cooldown: 0 });
  });

  // Mission Spots
  const missionConfigs = [
    {
      id: 'delivery',
      title: { en: 'Express Delivery Run', ar: 'توصيلة إكسبريس' },
      description: { en: 'Hit 3 city checkpoints before time runs out.', ar: 'عدي على 3 نقاط توصيل بعربية قبل الوقت ما يخلص.' },
      x: 0,
      z: -56,
      reward: 850,
      color: 0xf59e0b,
    },
    {
      id: 'sweep',
      title: { en: 'Neighborhood Sweep', ar: 'تطهير الحارة' },
      description: { en: 'Take out 5 armed gang troublemakers in the city!', ar: 'اتعامل مع 5 من عصابات الشوارع المسلحة في المدينة!' },
      x: -28,
      z: -12,
      reward: 1100,
      color: 0xef4444,
    },
    {
      id: 'stunt',
      title: { en: 'Bay Stunt Show', ar: 'عرض نطات الكورنيش' },
      description: { en: 'Land 2 vehicle ramp jumps at high speed!', ar: 'نط بعربية أو موتوسيكل مرتين من على الرامب!' },
      x: 28,
      z: 62,
      reward: 950,
      color: 0xec4899,
    },
    {
      id: 'vip',
      title: { en: 'VIP Coastal Drive', ar: 'توصيلة VIP للكورنيش' },
      description: { en: 'Grab a ride and reach the Beachfront Pier safely.', ar: 'اركب أي مركبة ووصل لنقطة الكورنيش بأمان.' },
      x: -56,
      z: 0,
      reward: 800,
      color: 0x3b82f6,
    },
  ];

  missionConfigs.forEach((mc) => {
    const ringGeo = new THREE.RingGeometry(2.4, 3.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: mc.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(mc.x, 0.12, mc.z);
    scene.add(ringMesh);
    missionSpots.push({ ...mc, ringMesh });
  });

  return {
    buildings,
    ramps,
    pickups,
    missionSpots,
    lampBulbMats,
    buildingMats,
    neonMats,
    waterMesh,
  };
}
