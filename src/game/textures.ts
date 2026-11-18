import * as THREE from 'three';

export type BrandAssetKey =
  | 'bannerSquare'
  | 'ogBanner'
  | 'poster1'
  | 'poster2'
  | 'eidBanner'
  | 'festiveBanner'
  | 'logoA'
  | 'logoE';

export interface BrandAssetSlot {
  key: BrandAssetKey;
  texture: THREE.Texture;
  aspect: number;
  isTransparent: boolean;
  onAspectReady: Array<(actualAspect: number) => void>;
}

export interface CityTextures {
  roadH: THREE.CanvasTexture;
  roadV: THREE.CanvasTexture;
  intersection: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  water: THREE.CanvasTexture;
  sand: THREE.CanvasTexture;
  roofTile: THREE.CanvasTexture;
  houseWall: THREE.CanvasTexture;
  egyptFlag: THREE.CanvasTexture;
  billboards: THREE.CanvasTexture[];
  facades: Array<{ map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture }>;
  brandAssets: Record<BrandAssetKey, BrandAssetSlot>;
  dispose: () => void;
}

const MAX_EXTERNAL_TEX_DIM = 512;

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  isColor = true,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

function makeRoadCanvas(vertical: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#22252d';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i++) {
    const v = 28 + ((i * 7) % 20);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  ctx.save();
  if (!vertical) {
    ctx.translate(128, 128);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-128, -128);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(10, 0, 4, 256);
  ctx.fillRect(242, 0, 4, 256);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(123, 0, 4, 256);
  ctx.fillRect(129, 0, 4, 256);

  ctx.fillStyle = '#e2e8f0';
  for (let y = 12; y < 256; y += 44) {
    ctx.fillRect(66, y, 3, 24);
    ctx.fillRect(187, y, 3, 24);
  }
  ctx.restore();
  return c;
}

function makeIntersectionCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#23262f';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#f1f5f9';
  for (let i = 24; i <= 216; i += 24) {
    ctx.fillRect(i, 6, 12, 24);
    ctx.fillRect(i, 226, 12, 24);
    ctx.fillRect(6, i, 24, 12);
    ctx.fillRect(226, i, 24, 12);
  }
  return c;
}

function makeSidewalkCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#858a94';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#646974';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 128; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, x);
    ctx.lineTo(128, x);
    ctx.stroke();
  }
  return c;
}

function makeGrassCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2d5a36';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 650; i++) {
    const g = 75 + (i % 45);
    ctx.fillStyle = `rgb(36, ${g}, 44)`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
  }
  return c;
}

function makeWaterCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, '#0c4a6e');
  grad.addColorStop(0.5, '#0369a1');
  grad.addColorStop(1, '#0284c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
  ctx.lineWidth = 2;
  for (let y = 16; y < 128; y += 32) {
    ctx.beginPath();
    for (let x = 0; x <= 128; x += 16) {
      const wy = y + Math.sin((x / 128) * Math.PI * 4) * 3;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  return c;
}

function makeSandCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d6b683';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    const r = 200 + (i % 25);
    const g = 170 + (i % 22);
    const b = 120 + (i % 18);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  return c;
}

function makeRoofTileCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, y, 128, 3);
    for (let x = y % 32 === 0 ? 0 : 8; x < 128; x += 16) {
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(x + 2, y + 4, 12, 10);
    }
  }
  return c;
}

function makeHouseWallCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#efe5d8';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 360; i++) {
    const v = 225 + (i % 18);
    ctx.fillStyle = `rgb(${v},${v - 10},${v - 22})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  return c;
}

function makeEgyptFlagCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 300;
  c.height = 200;
  const ctx = c.getContext('2d')!;

  // Red, White, Black stripes
  ctx.fillStyle = '#ce1126';
  ctx.fillRect(0, 0, 300, 67);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 67, 300, 66);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 133, 300, 67);

  // Stylized Golden Eagle of Saladin centered on the white stripe
  ctx.save();
  ctx.translate(150, 100);
  ctx.fillStyle = '#c09300';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.5;

  // Wings
  ctx.beginPath();
  ctx.moveTo(-22, -12);
  ctx.lineTo(-6, -16);
  ctx.lineTo(0, -24);
  ctx.lineTo(6, -16);
  ctx.lineTo(22, -12);
  ctx.lineTo(18, 12);
  ctx.lineTo(7, 8);
  ctx.lineTo(4, 22);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-7, 8);
  ctx.lineTo(-18, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner shield highlight
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-5, -10, 10, 20);
  ctx.fillStyle = '#ce1126';
  ctx.fillRect(-3, -8, 6, 16);
  ctx.restore();

  return c;
}

function makeBillboardCanvas(title: string, subtitle: string, bg: string, accent: string, w = 512, h = 256): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = accent;
  ctx.font = `bold ${Math.round(h * 0.22)}px Cairo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, h * 0.48);
  ctx.fillStyle = '#f8fafc';
  ctx.font = `bold ${Math.round(h * 0.12)}px Cairo, sans-serif`;
  ctx.fillText(subtitle, w / 2, h * 0.72);
  return c;
}

function makeFacadePair(
  wallColor: string,
  trimColor: string,
  litColors: string[],
  cols: number,
  rows: number,
): { colorCanvas: HTMLCanvasElement; emissiveCanvas: HTMLCanvasElement } {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 256;
  colorCanvas.height = 512;
  const ctx = colorCanvas.getContext('2d')!;

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = 256;
  emissiveCanvas.height = 512;
  const eCtx = emissiveCanvas.getContext('2d')!;

  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, 256, 512);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, 256, 512);

  ctx.fillStyle = trimColor;
  const rowH = 512 / rows;
  const colW = 256 / cols;
  for (let r = 0; r < rows; r++) {
    ctx.fillRect(0, r * rowH, 256, 4);
  }

  for (let r = 1; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = c * colW + 8;
      const wy = r * rowH + 10;
      const ww = colW - 16;
      const wh = rowH - 18;
      const isLit = (r * 7 + c * 11) % 3 !== 0;
      const litColor = litColors[(r + c) % litColors.length];

      ctx.fillStyle = isLit ? litColor : '#1e293b';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wy, ww, wh);

      if (isLit) {
        eCtx.fillStyle = litColor;
        eCtx.fillRect(wx, wy, ww, wh);
      }
    }
  }

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 512 - rowH, 256, rowH);
  ctx.fillStyle = litColors[0];
  ctx.fillRect(18, 512 - rowH + 10, 220, rowH - 16);
  eCtx.fillStyle = litColors[0];
  eCtx.fillRect(18, 512 - rowH + 10, 220, rowH - 16);

  return { colorCanvas, emissiveCanvas };
}

function compressImageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const nw = img.naturalWidth || 256;
  const nh = img.naturalHeight || 256;
  const scale = Math.min(1, MAX_EXTERNAL_TEX_DIM / Math.max(nw, nh));
  const w = Math.max(32, Math.round(nw * scale));
  const h = Math.max(32, Math.round(nh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export function createCityTextures(renderer: THREE.WebGLRenderer): CityTextures {
  const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy() || 1);
  let disposed = false;

  const facadeConfigs = [
    { wall: '#334155', trim: '#1e293b', lits: ['#fef08a', '#bae6fd', '#fde68a'], cols: 4, rows: 10 },
    { wall: '#9a6b53', trim: '#7c523e', lits: ['#fde68a', '#fed7aa', '#fef3c7'], cols: 4, rows: 8 },
    { wall: '#475569', trim: '#0f172a', lits: ['#67e8f9', '#fef08a', '#f9a8d4'], cols: 5, rows: 12 },
    { wall: '#c29b70', trim: '#9c7853', lits: ['#fef08a', '#fde047', '#fffbeb'], cols: 3, rows: 7 },
  ];

  const facades = facadeConfigs.map((cfg) => {
    const { colorCanvas, emissiveCanvas } = makeFacadePair(cfg.wall, cfg.trim, cfg.lits, cfg.cols, cfg.rows);
    return {
      map: finalizeTexture(colorCanvas, aniso, true, 1, 1),
      emissiveMap: finalizeTexture(emissiveCanvas, aniso, true, 1, 1),
    };
  });

  const billboards = [
    finalizeTexture(makeBillboardCanvas('معرض كيمو موتورز', 'أحدث العربيات والموتوسيكلات', '#09090b', '#f59e0b', 512, 192), aniso, true, 1, 1),
    finalizeTexture(makeBillboardCanvas('كافيه أصيلة على الكورنيش', 'أجمد قهوة وقاعدة بحر', '#0f172a', '#14b8a6', 512, 192), aniso, true, 1, 1),
    finalizeTexture(makeBillboardCanvas('ورشة عبقرينو للتعديل', 'تزويد سرعة · رشاشات · RPG', '#18181b', '#ef4444', 512, 192), aniso, true, 1, 1),
  ];

  const externalSpecs: Array<{
    key: BrandAssetKey;
    url: string;
    defaultAspect: number;
    isTransparent: boolean;
    fallbackTitle: string;
    fallbackSub: string;
    bg: string;
    accent: string;
  }> = [
    {
      key: 'bannerSquare',
      url: 'https://elhad-elmomtaz.vercel.app/banner-square.jpg',
      defaultAspect: 1.0,
      isTransparent: false,
      fallbackTitle: 'الحد الممتاز',
      fallbackSub: 'أقوى العروض في المدينة',
      bg: '#0f172a',
      accent: '#f59e0b',
    },
    {
      key: 'ogBanner',
      url: 'https://elhad-elmomtaz.vercel.app/og-banner.jpg',
      defaultAspect: 1.9,
      isTransparent: false,
      fallbackTitle: 'الحد الممتاز',
      fallbackSub: 'الأصل والجودة في كل شارع',
      bg: '#111827',
      accent: '#14b8a6',
    },
    {
      key: 'poster1',
      url: 'https://elhad-elmomtaz.vercel.app/poster-1.jpg',
      defaultAspect: 0.75,
      isTransparent: false,
      fallbackTitle: 'بوستر 1',
      fallbackSub: 'أقوى الفعاليات',
      bg: '#1e1b4b',
      accent: '#f59e0b',
    },
    {
      key: 'poster2',
      url: 'https://elhad-elmomtaz.vercel.app/poster-2.jpg',
      defaultAspect: 0.75,
      isTransparent: false,
      fallbackTitle: 'بوستر 2',
      fallbackSub: 'حفلات الشارع',
      bg: '#1f2937',
      accent: '#ec4899',
    },
    {
      key: 'eidBanner',
      url: encodeURI('https://kemo-omar.github.io/abqarino/عيد.png'),
      defaultAspect: 1.6,
      isTransparent: true,
      fallbackTitle: 'عيد سعيد',
      fallbackSub: 'فرحة الحارة ولمة الصحاب',
      bg: '#064e3b',
      accent: '#facc15',
    },
    {
      key: 'festiveBanner',
      url: 'https://kemo-omar.github.io/abqarino/673742557_932429899680884_3278553830736109598_n.jpg',
      defaultAspect: 1.33,
      isTransparent: false,
      fallbackTitle: 'احتفالات عبقرينو',
      fallbackSub: 'فرحة وأجواء مصرية أصيلة',
      bg: '#312e81',
      accent: '#38bdf8',
    },
    {
      key: 'logoA',
      url: 'https://kemo-omar.github.io/Kareem/A.png',
      defaultAspect: 1.0,
      isTransparent: true,
      fallbackTitle: 'A',
      fallbackSub: 'KAREEM',
      bg: '#09090b',
      accent: '#f59e0b',
    },
    {
      key: 'logoE',
      url: 'https://kemo-omar.github.io/Kareem/E.png',
      defaultAspect: 1.0,
      isTransparent: true,
      fallbackTitle: 'E',
      fallbackSub: 'KAREEM',
      bg: '#09090b',
      accent: '#14b8a6',
    },
  ];

  const brandAssets = {} as Record<BrandAssetKey, BrandAssetSlot>;

  externalSpecs.forEach((spec) => {
    const fw = Math.round(256 * Math.min(2, Math.max(0.65, spec.defaultAspect)));
    const fh = 256;
    const fallbackCanvas = makeBillboardCanvas(spec.fallbackTitle, spec.fallbackSub, spec.bg, spec.accent, fw, fh);
    const tex = new THREE.CanvasTexture(fallbackCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;

    const slot: BrandAssetSlot = {
      key: spec.key,
      texture: tex,
      aspect: spec.defaultAspect,
      isTransparent: spec.isTransparent,
      onAspectReady: [],
    };
    brandAssets[spec.key] = slot;

    // Async background load with downscale compression & exact aspect sync
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (disposed || !img.naturalWidth || !img.naturalHeight) return;
      const actualAspect = THREE.MathUtils.clamp(img.naturalWidth / img.naturalHeight, 0.35, 3.6);
      slot.aspect = actualAspect;

      try {
        const compressed = compressImageToCanvas(img);
        tex.image = compressed;
      } catch {
        tex.image = img;
      }
      tex.needsUpdate = true;

      slot.onAspectReady.forEach((cb) => cb(actualAspect));
    };
    img.onerror = () => {
      // Keep clean procedural fallback canvas without breaking WebGL
    };
    img.src = spec.url;
  });

  const roadH = finalizeTexture(makeRoadCanvas(false), aniso, true, 1, 1);
  const roadV = finalizeTexture(makeRoadCanvas(true), aniso, true, 1, 1);
  const intersection = finalizeTexture(makeIntersectionCanvas(), aniso, true, 1, 1);
  const sidewalk = finalizeTexture(makeSidewalkCanvas(), aniso, true, 4, 4);
  const grass = finalizeTexture(makeGrassCanvas(), aniso, true, 3, 3);
  const water = finalizeTexture(makeWaterCanvas(), aniso, true, 16, 16);
  const sand = finalizeTexture(makeSandCanvas(), aniso, true, 8, 8);
  const roofTile = finalizeTexture(makeRoofTileCanvas(), aniso, true, 3, 3);
  const houseWall = finalizeTexture(makeHouseWallCanvas(), aniso, true, 2, 2);
  const egyptFlag = finalizeTexture(makeEgyptFlagCanvas(), aniso, true, 1, 1);
  egyptFlag.wrapS = THREE.ClampToEdgeWrapping;
  egyptFlag.wrapT = THREE.ClampToEdgeWrapping;

  const dispose = () => {
    disposed = true;
    roadH.dispose();
    roadV.dispose();
    intersection.dispose();
    sidewalk.dispose();
    grass.dispose();
    water.dispose();
    sand.dispose();
    roofTile.dispose();
    houseWall.dispose();
    egyptFlag.dispose();
    billboards.forEach((b) => b.dispose());
    facades.forEach((f) => {
      f.map.dispose();
      f.emissiveMap.dispose();
    });
    Object.values(brandAssets).forEach((s) => {
      s.onAspectReady.length = 0;
      s.texture.dispose();
    });
  };

  return {
    roadH,
    roadV,
    intersection,
    sidewalk,
    grass,
    water,
    sand,
    roofTile,
    houseWall,
    egyptFlag,
    billboards,
    facades,
    brandAssets,
    dispose,
  };
}
