import * as THREE from 'three';
import { CityTextures } from './textures';
import {
  createAspectBillboard,
  createAspectTexturedPlane,
  createBreakableProp,
  createCafeSet,
  createEgyptFlagPole,
  createHouseLOD,
  createPalmTreeLOD,
  createParkTreeLOD,
  createPickupMesh,
  createRestaurantMesh,
  createStreetFestiveBanner,
  createStreetLampLOD,
  createStuntRamp,
  createTrafficLight,
  createWallBanner,
  ModelAssetPool,
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

export interface RestaurantSpot {
  id: string;
  name: { en: string; ar: string };
  x: number;
  z: number;
  cost: number;
  heal: number;
  ringMesh: THREE.Mesh;
}

export interface BreakablePropEntity {
  kind: 'hydrant' | 'trash' | 'cone' | 'bench';
  x: number;
  z: number;
  mesh: THREE.Group;
  broken: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export interface MissionSpot {
  id: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  x: number;
  z: number;
  reward: number;
  color: number;
  isStory?: boolean;
  isCoop?: boolean;
  ringMesh: THREE.Mesh;
}

export interface BuiltCity {
  buildings: BuildingCollider[];
  ramps: RampCollider[];
  pickups: WorldPickup[];
  restaurants: RestaurantSpot[];
  props: BreakablePropEntity[];
  missionSpots: MissionSpot[];
  lampBulbMats: THREE.MeshStandardMaterial[];
  buildingMats: THREE.MeshStandardMaterial[];
  neonMats: THREE.MeshStandardMaterial[];
  lods: THREE.LOD[];
  flagUniforms: Array<{ value: number }>;
  waterMesh: THREE.Mesh;
  pool: ModelAssetPool;
}

export function buildCityWorld(scene: THREE.Scene, textures: CityTextures): BuiltCity {
  const pool = new ModelAssetPool();
  const buildings: BuildingCollider[] = [];
  const ramps: RampCollider[] = [];
  const pickups: WorldPickup[] = [];
  const restaurants: RestaurantSpot[] = [];
  const props: BreakablePropEntity[] = [];
  const missionSpots: MissionSpot[] = [];
  const lampBulbMats: THREE.MeshStandardMaterial[] = [];
  const neonMats: THREE.MeshStandardMaterial[] = [];
  const lods: THREE.LOD[] = [];
  const flagUniforms: Array<{ value: number }> = [];

  const buildingMats = textures.facades.map((f) =>
    pool.trackMat(
      new THREE.MeshStandardMaterial({
        map: f.map,
        emissiveMap: f.emissiveMap,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.75,
        roughness: 0.65,
        metalness: 0.15,
      }),
    ),
  );

  // Base terrain
  const baseGround = new THREE.Mesh(
    pool.trackGeo(new THREE.PlaneGeometry(900, 900)),
    pool.trackMat(new THREE.MeshStandardMaterial({ color: 0x263529, roughness: 0.95 })),
  );
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.set(-80, -0.05, 0);
  baseGround.receiveShadow = true;
  scene.add(baseGround);

  // Beach & Ocean
  const sandMesh = new THREE.Mesh(
    pool.trackGeo(new THREE.PlaneGeometry(46, 800)),
    pool.trackMat(new THREE.MeshStandardMaterial({ map: textures.sand, roughness: 0.92 })),
  );
  sandMesh.rotation.x = -Math.PI / 2;
  sandMesh.position.set(140, -0.02, 0);
  sandMesh.receiveShadow = true;
  scene.add(sandMesh);

  const waterMesh = new THREE.Mesh(
    pool.trackGeo(new THREE.PlaneGeometry(600, 900)),
    pool.trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.water,
        roughness: 0.16,
        metalness: 0.38,
      }),
    ),
  );
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(450, -0.25, 0);
  scene.add(waterMesh);

  // Waterfront boardwalk + umbrellas
  const boardwalk = new THREE.Mesh(
    pool.trackGeo(new THREE.BoxGeometry(7, 0.25, 250)),
    pool.trackMat(new THREE.MeshStandardMaterial({ color: 0x926239, roughness: 0.85 })),
  );
  boardwalk.position.set(123.5, 0.08, 0);
  boardwalk.receiveShadow = true;
  scene.add(boardwalk);

  [-68, -42, -16, 16, 42, 68].forEach((cz, idx) => {
    const cafe = createCafeSet(idx % 2 === 0 ? 0xf59e0b : 0x0d9488);
    cafe.position.set(123.5, 0.2, cz);
    scene.add(cafe);
  });

  // Roads (shared PlaneGeometries & Materials)
  const roadMatH = pool.trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.roadH,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  const roadMatV = pool.trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.roadV,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  const interMat = pool.trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.intersection,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );

  const roadHGeo = pool.trackGeo(new THREE.PlaneGeometry(44, ROAD_WIDTH));
  const roadVGeo = pool.trackGeo(new THREE.PlaneGeometry(ROAD_WIDTH, 44));
  const interGeo = pool.trackGeo(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_WIDTH));

  for (const rz of ROAD_CENTERS) {
    for (const bx of BLOCK_CENTERS) {
      const seg = new THREE.Mesh(roadHGeo, roadMatH);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(bx, 0.02, rz);
      seg.receiveShadow = true;
      scene.add(seg);
    }
  }
  for (const rx of ROAD_CENTERS) {
    for (const bz of BLOCK_CENTERS) {
      const seg = new THREE.Mesh(roadVGeo, roadMatV);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(rx, 0.02, bz);
      seg.receiveShadow = true;
      scene.add(seg);
    }
  }
  for (const rx of ROAD_CENTERS) {
    for (const rz of ROAD_CENTERS) {
      const inter = new THREE.Mesh(interGeo, interMat);
      inter.rotation.x = -Math.PI / 2;
      inter.position.set(rx, 0.03, rz);
      inter.receiveShadow = true;
      scene.add(inter);

      if (Math.abs(rx) <= 56 && Math.abs(rz) <= 56) {
        const tl = createTrafficLight(pool);
        tl.position.set(rx - 7.5, 0.2, rz - 7.5);
        scene.add(tl);
      }
    }
  }

  // Festive Cairo Street Banners along Main Boulevards (عيد.png & festive photo)
  const festivePlacements = [
    { slot: textures.brandAssets.eidBanner, x: -28, z: -56, ry: Math.PI / 2 },
    { slot: textures.brandAssets.festiveBanner, x: 28, z: -56, ry: Math.PI / 2 },
    { slot: textures.brandAssets.eidBanner, x: 56, z: -28, ry: 0 },
    { slot: textures.brandAssets.festiveBanner, x: -56, z: 28, ry: 0 },
  ];
  festivePlacements.forEach((fp) => {
    const arch = createStreetFestiveBanner(fp.slot, 12.6, 2.5, pool);
    arch.position.set(fp.x, 0.1, fp.z);
    arch.rotation.y = fp.ry;
    scene.add(arch);
  });

  // Sidewalks, Curbs, Blocks & Street Props
  const sidewalkMat = pool.trackMat(new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 0.85 }));
  const curbMat = pool.trackMat(new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }));
  const grassMat = pool.trackMat(new THREE.MeshStandardMaterial({ map: textures.grass, roughness: 0.9 }));
  const roofMat = pool.trackMat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }));
  const fenceMat = pool.trackMat(new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.82 }));
  const padGeo = pool.trackGeo(new THREE.BoxGeometry(44, 0.24, 44));
  const curbGeo = pool.trackGeo(new THREE.BoxGeometry(44.4, 0.16, 44.4));

  const neonColors = [0xf59e0b, 0x14b8a6, 0xec4899, 0x38bdf8];
  const houseTints = [0xfef3c7, 0xfecdd3, 0xdbeafe, 0xd1fae5];

  const addProp = (kind: BreakablePropEntity['kind'], x: number, z: number, ry = 0) => {
    const mesh = createBreakableProp(kind, pool);
    mesh.position.set(x, 0.2, z);
    mesh.rotation.y = ry;
    scene.add(mesh);
    props.push({ kind, x, z, mesh, broken: false, vx: 0, vy: 0, vz: 0, life: 5 });
  };

  BLOCK_CENTERS.forEach((bx, ix) => {
    BLOCK_CENTERS.forEach((bz, iz) => {
      const pad = new THREE.Mesh(padGeo, sidewalkMat);
      pad.position.set(bx, 0.08, bz);
      pad.receiveShadow = true;
      scene.add(pad);

      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(bx, 0.06, bz);
      scene.add(curb);

      // LOD Streetlamps + Poster-1 / Poster-2 on poles!
      [
        { dx: -20, dz: -20, ry: -Math.PI / 4, poster: (ix + iz) % 2 === 0 ? textures.brandAssets.poster1 : textures.brandAssets.poster2 },
        { dx: 20, dz: 20, ry: (3 * Math.PI) / 4, poster: (ix + iz) % 2 === 0 ? textures.brandAssets.poster2 : textures.brandAssets.poster1 },
      ].forEach((lp) => {
        const { lod, bulbMat } = createStreetLampLOD(pool, lp.poster);
        lod.position.set(bx + lp.dx, 0.2, bz + lp.dz);
        lod.rotation.y = lp.ry;
        scene.add(lod);
        lods.push(lod);
        lampBulbMats.push(bulbMat);
      });

      addProp((ix + iz) % 2 === 0 ? 'hydrant' : 'trash', bx - 19, bz + 15);
      addProp((ix + iz) % 2 === 0 ? 'cone' : 'bench', bx + 18, bz - 16, Math.PI / 2);

      // 1. Main Liberty Square & Fountain Park (-28, -28) -> Raised Egyptian Flag!
      if (ix === 1 && iz === 1) {
        const lawn = new THREE.Mesh(new THREE.BoxGeometry(38, 0.08, 38), grassMat);
        lawn.position.set(bx, 0.22, bz);
        lawn.receiveShadow = true;
        scene.add(lawn);

        const basin = new THREE.Mesh(
          new THREE.CylinderGeometry(5.5, 6.0, 0.7, 16),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 }),
        );
        basin.position.set(bx, 0.55, bz);
        const poolWater = new THREE.Mesh(
          new THREE.CylinderGeometry(4.8, 4.8, 0.2, 16),
          new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.4 }),
        );
        poolWater.position.set(bx, 0.86, bz);
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
        scene.add(basin, poolWater, spire);
        buildings.push({ x: bx, z: bz, w: 11, d: 11, h: 3 });

        // Prominent Egyptian Flagpole in the Main Square!
        const squareFlag = createEgyptFlagPole(textures.egyptFlag, 1.35, flagUniforms, pool);
        squareFlag.position.set(bx, 0.26, bz - 11);
        scene.add(squareFlag);

        // Square Fence Sign + Wall Poster
        const wallFence = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 0.4), fenceMat);
        wallFence.position.set(bx - 12, 1.4, bz + 17);
        scene.add(wallFence);
        const sqAd = createWallBanner(textures.brandAssets.bannerSquare, 2.1, true);
        sqAd.position.set(bx - 12, 1.45, bz + 17);
        scene.add(sqAd);

        [
          [-14, -14],
          [14, -14],
          [-14, 14],
          [14, 14],
        ].forEach(([tx, tz]) => {
          const tree = createParkTreeLOD(1.1, pool);
          tree.position.set(bx + tx, 0.24, bz + tz);
          scene.add(tree);
          lods.push(tree);
        });

        addProp('bench', bx - 9, bz - 5, 0);
        addProp('bench', bx + 9, bz + 5, Math.PI);
        return;
      }

      // 2. City School ("مدرسة عبقرينو الثانوية") at (-28, -84) -> Egyptian Flag + Square Fence Banners
      if (ix === 1 && iz === 0) {
        const yard = new THREE.Mesh(new THREE.BoxGeometry(40, 0.08, 40), sidewalkMat);
        yard.position.set(bx, 0.22, bz);
        yard.receiveShadow = true;
        scene.add(yard);

        const schoolWallMat = pool.trackMat(new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.72 }));
        const schoolMain = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 12), schoolWallMat);
        schoolMain.position.set(bx, 4.7, bz - 8);
        schoolMain.castShadow = true;
        schoolMain.receiveShadow = true;
        scene.add(schoolMain);
        buildings.push({ x: bx, z: bz - 8, w: 26, d: 12, h: 9, isHouse: true });

        // School Entrance + Egyptian Flag in Courtyard
        const schoolFlag = createEgyptFlagPole(textures.egyptFlag, 1.25, flagUniforms, pool);
        schoolFlag.position.set(bx, 0.26, bz + 6);
        scene.add(schoolFlag);

        // School Front Wall Fence + Square Banner + Posters
        const frontFence = new THREE.Mesh(new THREE.BoxGeometry(34, 2.2, 0.45), fenceMat);
        frontFence.position.set(bx, 1.3, bz + 17.5);
        scene.add(frontFence);

        const fenceAd1 = createWallBanner(textures.brandAssets.bannerSquare, 2.1, true);
        fenceAd1.position.set(bx - 10, 1.4, bz + 17.5);
        const fenceAd2 = createWallBanner(textures.brandAssets.poster1, 2.0, true);
        fenceAd2.position.set(bx + 10, 1.4, bz + 17.5);
        scene.add(fenceAd1, fenceAd2);

        // Rooftop OG Banner on School Main Building
        const schoolRoofAd = createAspectBillboard(textures.brandAssets.ogBanner, 3.2, pool, false);
        schoolRoofAd.position.set(bx, 9.2, bz - 2.5);
        scene.add(schoolRoofAd);

        const schoolPalm = createPalmTreeLOD(1.05, pool);
        schoolPalm.position.set(bx - 14, 0.24, bz + 8);
        scene.add(schoolPalm);
        lods.push(schoolPalm);
        return;
      }

      // 3. Government Office Complex ("المجمع الحكومي") at (-84, 84) -> Prominent Egyptian Flags!
      if (ix === 0 && iz === 3) {
        const plaza = new THREE.Mesh(new THREE.BoxGeometry(40, 0.08, 40), sidewalkMat);
        plaza.position.set(bx, 0.22, bz);
        plaza.receiveShadow = true;
        scene.add(plaza);

        const govMat = pool.trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.1 }));
        const govBody = new THREE.Mesh(new THREE.BoxGeometry(24, 15, 18), govMat);
        govBody.position.set(bx, 7.7, bz - 3);
        govBody.castShadow = true;
        govBody.receiveShadow = true;
        scene.add(govBody);
        buildings.push({ x: bx, z: bz - 3, w: 24, d: 18, h: 15 });

        // Classical Columns
        const colGeo = pool.trackGeo(new THREE.CylinderGeometry(0.45, 0.5, 9, 8));
        for (let cx = -8; cx <= 8; cx += 4) {
          const col = new THREE.Mesh(colGeo, govMat);
          col.position.set(bx + cx, 4.7, bz + 6.4);
          scene.add(col);
        }

        // Rooftop Flag + Twin Plaza Egyptian Flags
        const roofFlag = createEgyptFlagPole(textures.egyptFlag, 1.25, flagUniforms, pool);
        roofFlag.position.set(bx, 15.2, bz - 3);
        const plazaFlagL = createEgyptFlagPole(textures.egyptFlag, 1.1, flagUniforms, pool);
        plazaFlagL.position.set(bx - 11, 0.26, bz + 12);
        const plazaFlagR = createEgyptFlagPole(textures.egyptFlag, 1.1, flagUniforms, pool);
        plazaFlagR.position.set(bx + 11, 0.26, bz + 12);
        scene.add(roofFlag, plazaFlagL, plazaFlagR);

        // Street Poster on Government Side Wall
        const govBanner = createWallBanner(textures.brandAssets.bannerSquare, 3.2, false);
        govBanner.position.set(bx + 12.1, 5.0, bz - 3);
        govBanner.rotation.y = Math.PI / 2;
        scene.add(govBanner);
        return;
      }

      // 4. Residential Coastal Houses & Villas
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
          const houseLod = createHouseLOD(textures.houseWall, textures.roofTile, tint, hp.twoStory, pool);
          houseLod.position.set(bx + hp.dx, 0.25, bz + hp.dz);
          houseLod.rotation.y = hp.rot;
          scene.add(houseLod);
          lods.push(houseLod);
          buildings.push({ x: bx + hp.dx, z: bz + hp.dz, w: 11.6, d: 10.2, h: 7, isHouse: true });
        });

        const palm = createPalmTreeLOD(0.95, pool);
        palm.position.set(bx, 0.25, bz);
        scene.add(palm);
        lods.push(palm);
        return;
      }

      // 5. Stunt Arena & Armory Lot at (28, 84) -> Giant OG Banner & Festive Square
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

        const bbOg = createAspectBillboard(textures.brandAssets.ogBanner, 3.6, pool, true);
        bbOg.position.set(bx, 0.24, bz - 16);
        scene.add(bbOg);
        addProp('cone', bx - 14, bz + 8);
        addProp('cone', bx + 14, bz + 8);
        return;
      }

      // 6. Aseela's Corniche Lounge & Waterfront Square at (84, -28)
      if (ix === 3 && iz === 1) {
        const plaza = new THREE.Mesh(
          new THREE.BoxGeometry(38, 0.08, 38),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 }),
        );
        plaza.position.set(bx, 0.22, bz);
        plaza.receiveShadow = true;
        scene.add(plaza);

        const rest = createRestaurantMesh(0xec4899, 'كافيه أصيلة على الكورنيش', textures.brandAssets.logoE);
        rest.position.set(bx - 8, 0.24, bz - 10);
        scene.add(rest);
        buildings.push({ x: bx - 8, z: bz - 10, w: 8.8, d: 6.8, h: 4.5, isHouse: true });

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.7, 2.2, 20),
          new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(bx - 8, 0.28, bz - 2.5);
        scene.add(ring);
        restaurants.push({
          id: 'aseela-cafe',
          name: { en: "Aseela's Corniche Café", ar: 'كافيه أصيلة على الكورنيش' },
          x: bx - 8,
          z: bz - 2.5,
          cost: 40,
          heal: 55,
          ringMesh: ring,
        });

        // Waterfront Egyptian Flagpole + Festive Photo Stand
        const waterFlag = createEgyptFlagPole(textures.egyptFlag, 1.25, flagUniforms, pool);
        waterFlag.position.set(bx + 12, 0.26, bz - 10);
        scene.add(waterFlag);

        const ramp = createStuntRamp();
        ramp.position.set(bx + 8, 0.24, bz + 4);
        ramp.rotation.y = Math.PI / 2;
        scene.add(ramp);
        ramps.push({ x: bx + 8, z: bz + 4, yaw: Math.PI / 2, width: 5.5, length: 7.5, height: 2.3 });

        const palm1 = createPalmTreeLOD(1.2, pool);
        palm1.position.set(bx - 12, 0.24, bz + 12);
        scene.add(palm1);
        lods.push(palm1);
        return;
      }

      // 7. Koshary El-Sultan Storefront at (28, -28)
      if (ix === 2 && iz === 1) {
        const rest = createRestaurantMesh(0xf59e0b, 'كشري السلطان', textures.brandAssets.logoA);
        rest.position.set(bx - 9, 0.22, bz - 8);
        scene.add(rest);
        buildings.push({ x: bx - 9, z: bz - 8, w: 8.8, d: 6.8, h: 4.5, isHouse: true });

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.7, 2.2, 20),
          new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(bx - 9, 0.26, bz - 0.5);
        scene.add(ring);
        restaurants.push({
          id: 'sultan-koshary',
          name: { en: 'Koshary El-Sultan', ar: 'كشري السلطان' },
          x: bx - 9,
          z: bz - 0.5,
          cost: 35,
          heal: 60,
          ringMesh: ring,
        });

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(16, 26, 20), buildingMats[0]);
        mesh.position.set(bx + 10, 0.2 + 13, bz + 4);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        buildings.push({ x: bx + 10, z: bz + 4, w: 16, d: 20, h: 26 });

        // Wide OG Banner + Posters on skyscraper facade
        const ogFacade = createAspectTexturedPlane(textures.brandAssets.ogBanner, 5.2, { polygonOffset: true });
        ogFacade.position.set(bx + 10, 12, bz - 6.08);
        ogFacade.rotation.y = Math.PI;
        const pWall = createAspectTexturedPlane(textures.brandAssets.poster1, 4.2, { polygonOffset: true });
        pWall.position.set(bx + 1.9, 6.5, bz + 4);
        pWall.rotation.y = -Math.PI / 2;
        scene.add(ogFacade, pWall);
        return;
      }

      // 8. Bay Shawarma & Grill Plaza at (-28, 28)
      if (ix === 1 && iz === 2) {
        const rest = createRestaurantMesh(0xef4444, 'شاورما الباي', textures.brandAssets.logoE);
        rest.position.set(bx + 8, 0.22, bz - 8);
        scene.add(rest);
        buildings.push({ x: bx + 8, z: bz - 8, w: 8.8, d: 6.8, h: 4.5, isHouse: true });

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.7, 2.2, 20),
          new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(bx + 8, 0.26, bz - 0.5);
        scene.add(ring);
        restaurants.push({
          id: 'bay-shawarma',
          name: { en: 'Bay Shawarma & Grill', ar: 'شاورما ومشويات الباي' },
          x: bx + 8,
          z: bz - 0.5,
          cost: 45,
          heal: 70,
          ringMesh: ring,
        });

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 22, 24), buildingMats[2]);
        mesh.position.set(bx - 10, 0.2 + 11, bz + 3);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        buildings.push({ x: bx - 10, z: bz + 3, w: 15, d: 24, h: 22 });

        // Festive Banner + Poster 2 on Tower Wall
        const wallFest = createAspectTexturedPlane(textures.brandAssets.festiveBanner, 4.5, { polygonOffset: true });
        wallFest.position.set(bx - 2.4, 8, bz + 3);
        wallFest.rotation.y = Math.PI / 2;
        const wallPoster2 = createAspectTexturedPlane(textures.brandAssets.poster2, 4.2, { polygonOffset: true });
        wallPoster2.position.set(bx - 10, 7, bz - 9.08);
        wallPoster2.rotation.y = Math.PI;
        scene.add(wallFest, wallPoster2);
        return;
      }

      // 9. Downtown High-Rises with Giant Rooftop OG Banners, Square Wall Signs & A/E Shop Logos
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

        if (b.h >= 26) {
          const neonColor = neonColors[(ix + iz + bIdx) % neonColors.length];
          const neonMat = pool.trackMat(
            new THREE.MeshStandardMaterial({
              color: neonColor,
              emissive: neonColor,
              emissiveIntensity: 1.1,
              roughness: 0.2,
            }),
          );
          neonMats.push(neonMat);
          const trim = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.65, 0.35, b.d + 0.65), neonMat);
          trim.position.set(bx + b.dx, 0.2 + b.h - 0.3, bz + b.dz);
          scene.add(trim);
        }

        // Attach street-level storefront signs (A.png, E.png, bannerSquare, poster1/2) & rooftop billboards!
        if (bIdx === 0) {
          const storeLogo = (ix + iz) % 2 === 0 ? textures.brandAssets.logoA : textures.brandAssets.logoE;
          const shopSign = createAspectTexturedPlane(storeLogo, 2.5, { polygonOffset: true });
          shopSign.position.set(bx + b.dx, 3.0, bz + b.dz + b.d / 2 + 0.08);
          scene.add(shopSign);

          const wallSquare = createAspectTexturedPlane(textures.brandAssets.bannerSquare, 4.0, { polygonOffset: true });
          wallSquare.position.set(bx + b.dx + b.w / 2 + 0.08, 6.5, bz + b.dz);
          wallSquare.rotation.y = Math.PI / 2;
          scene.add(wallSquare);

          if (b.h >= 28) {
            const roofOg = createAspectBillboard(textures.brandAssets.ogBanner, 4.2, pool, false);
            roofOg.position.set(bx + b.dx, 0.8 + b.h, bz + b.dz);
            scene.add(roofOg);
          }
        } else if (bIdx === 1) {
          const posterSlot = (ix + iz) % 2 === 0 ? textures.brandAssets.poster1 : textures.brandAssets.poster2;
          const wallPoster = createAspectTexturedPlane(posterSlot, 3.8, { polygonOffset: true });
          wallPoster.position.set(bx + b.dx, 5.2, bz + b.dz - b.d / 2 - 0.08);
          wallPoster.rotation.y = Math.PI;
          scene.add(wallPoster);
        }

        buildings.push({ x: bx + b.dx, z: bz + b.dz, w: b.w, d: b.d, h: b.h });
      });

      if (ix === 2 && iz === 0) {
        const bb = createAspectBillboard(textures.brandAssets.ogBanner, 3.8, pool, true);
        bb.position.set(bx, 0.24, bz + 18);
        scene.add(bb);
      }
      if (ix === 0 && iz === 2) {
        const bbFest = createAspectBillboard(textures.brandAssets.festiveBanner, 3.8, pool, true);
        bbFest.position.set(bx, 0.24, bz - 17);
        scene.add(bbFest);
      }
    });
  });

  // Beach palms & perimeter forest using LOD
  for (let z = -115; z <= 115; z += 22) {
    const palm = createPalmTreeLOD(0.95 + (Math.abs(z) % 5) * 0.08, pool);
    palm.position.set(129, 0.0, z);
    scene.add(palm);
    lods.push(palm);
  }
  for (let i = -140; i <= 140; i += 24) {
    const pNorth = createParkTreeLOD(1.2, pool);
    pNorth.position.set(i, 0, -138 - (Math.abs(i) % 7));
    const pSouth = createParkTreeLOD(1.25, pool);
    pSouth.position.set(i, 0, 138 + (Math.abs(i) % 7));
    const pWest = createPalmTreeLOD(1.15, pool);
    pWest.position.set(-138 - (Math.abs(i) % 6), 0, i);
    scene.add(pNorth, pSouth, pWest);
    lods.push(pNorth, pSouth, pWest);
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

  // Story (Aseela) + Co-op Buddy (Abqarino) + Side Missions
  const missionConfigs: Array<Omit<MissionSpot, 'ringMesh'>> = [
    {
      id: 'story',
      title: { en: 'Story: Meet Aseela', ar: 'القصة: ميعاد مع أصيلة' },
      description: {
        en: 'Meet Aseela at her Corniche Café before the rival gang arrives.',
        ar: 'قابل أصيلة عند كافيه الكورنيش قبل ما العصابة توصل لها.',
      },
      x: -20,
      z: -56,
      reward: 1500,
      color: 0xec4899,
      isStory: true,
    },
    {
      id: 'coop-hack',
      title: { en: 'Co-op with Abqarino: Raid & Hack', ar: 'مهمة مشتركة: عملية عبقرينو' },
      description: {
        en: 'Team up with Abqarino side-by-side to raid the rival gang compound!',
        ar: 'انزل كتف في كتف مع صاحبك عبقرينو، اقتحموا المطبعة وهكروا السيرفر واضربوا العصابة!',
      },
      x: -36,
      z: -56,
      reward: 1850,
      color: 0x06b6d4,
      isCoop: true,
    },
    {
      id: 'delivery',
      title: { en: 'Express Delivery Run', ar: 'توصيلة إكسبريس في الزحمة' },
      description: { en: 'Hit 3 city checkpoints before time runs out.', ar: 'عدي على 3 نقاط توصيل بعربية قبل الوقت ما يخلص.' },
      x: 0,
      z: -56,
      reward: 850,
      color: 0xf59e0b,
    },
    {
      id: 'sweep',
      title: { en: 'Neighborhood Sweep', ar: 'تطهير الحارة' },
      description: { en: 'Take out 5 armed gang troublemakers in the city!', ar: 'اتعامل مع 5 من بلطجية الشوارع المسلحين!' },
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
      color: 0x14b8a6,
    },
  ];

  missionConfigs.forEach((mc) => {
    const ringGeo = pool.trackGeo(new THREE.RingGeometry(2.4, 3.0, 24));
    const ringMat = pool.trackMat(
      new THREE.MeshBasicMaterial({
        color: mc.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      }),
    );
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(mc.x, 0.14, mc.z);
    scene.add(ringMesh);
    missionSpots.push({ ...mc, ringMesh });
  });

  return {
    buildings,
    ramps,
    pickups,
    restaurants,
    props,
    missionSpots,
    lampBulbMats,
    buildingMats,
    neonMats,
    lods,
    flagUniforms,
    waterMesh,
    pool,
  };
}
