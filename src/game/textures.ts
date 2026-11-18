import * as THREE from 'three';

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
  billboards: THREE.CanvasTexture[];
  facades: Array<{ map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture }>;
}

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

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 28 + Math.floor(Math.random() * 22);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    ctx.fillRect(x, y, 2, 2);
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

  for (let i = 0; i < 1400; i++) {
    const v = 30 + Math.floor(Math.random() * 18);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

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
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#858a94';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const v = 120 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  ctx.strokeStyle = '#646974';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  return c;
}

function makeGrassCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2d5a36';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const g = 75 + Math.floor(Math.random() * 48);
    ctx.fillStyle = `rgb(36, ${g}, 44)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  return c;
}

function makeWaterCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#0c4a6e');
  grad.addColorStop(0.5, '#0369a1');
  grad.addColorStop(1, '#0284c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
  ctx.lineWidth = 2;
  for (let y = 16; y < 256; y += 32) {
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wy = y + Math.sin((x / 256) * Math.PI * 4) * 4;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  return c;
}

function makeSandCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d6b683';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const r = 200 + Math.floor(Math.random() * 30);
    const g = 170 + Math.floor(Math.random() * 25);
    const b = 120 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
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
    for (let x = (y % 32 === 0 ? 0 : 8); x < 128; x += 16) {
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
  for (let i = 0; i < 600; i++) {
    const v = 225 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgb(${v},${v - 10},${v - 22})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  return c;
}

function makeBillboardCanvas(title: string, subtitle: string, bg: string, accent: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 176);
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 98);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(subtitle, 256, 144);
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
      const isLit = Math.random() > 0.36;
      const litColor = litColors[Math.floor(Math.random() * litColors.length)];

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

export function createCityTextures(renderer: THREE.WebGLRenderer): CityTextures {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

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
    finalizeTexture(makeBillboardCanvas('KTA MOTORS', 'VELOCE · DOMINATOR · SUPERBIKES', '#09090b', '#f59e0b'), aniso, true, 1, 1),
    finalizeTexture(makeBillboardCanvas('SUNHAVEN BAY', 'CAFÉ · MARINA · NIGHTLIFE', '#0f172a', '#14b8a6'), aniso, true, 1, 1),
    finalizeTexture(makeBillboardCanvas('24/7 ARMORY', 'PISTOL · SMG · SHOTGUN · RPG', '#18181b', '#ef4444'), aniso, true, 1, 1),
  ];

  return {
    roadH: finalizeTexture(makeRoadCanvas(false), aniso, true, 1, 1),
    roadV: finalizeTexture(makeRoadCanvas(true), aniso, true, 1, 1),
    intersection: finalizeTexture(makeIntersectionCanvas(), aniso, true, 1, 1),
    sidewalk: finalizeTexture(makeSidewalkCanvas(), aniso, true, 4, 4),
    grass: finalizeTexture(makeGrassCanvas(), aniso, true, 3, 3),
    water: finalizeTexture(makeWaterCanvas(), aniso, true, 16, 16),
    sand: finalizeTexture(makeSandCanvas(), aniso, true, 8, 8),
    roofTile: finalizeTexture(makeRoofTileCanvas(), aniso, true, 3, 3),
    houseWall: finalizeTexture(makeHouseWallCanvas(), aniso, true, 2, 2),
    billboards,
    facades,
  };
}
