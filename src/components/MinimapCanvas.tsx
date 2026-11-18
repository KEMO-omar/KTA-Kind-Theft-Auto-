import React, { useEffect, useRef } from 'react';
import { HudSnapshot } from '../types/game';
import { ROAD_CENTERS } from '../game/city';

interface MinimapCanvasProps {
  hud: HudSnapshot;
  size?: number;
  range?: number;
  fullMap?: boolean;
}

export const MinimapCanvas: React.FC<MinimapCanvasProps> = ({
  hud,
  size = 148,
  range = 85,
  fullMap = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = size;
    const h = size;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, w, h);

    const scale = fullMap ? w / 290 : w / (range * 2);
    const cx = w / 2;
    const cy = h / 2;

    const toScreen = (wx: number, wz: number) => {
      const refX = fullMap ? 0 : hud.playerX;
      const refZ = fullMap ? 0 : hud.playerZ;
      return {
        x: cx + (wx - refX) * scale,
        y: cy + (wz - refZ) * scale,
      };
    };

    const landTL = toScreen(-135, -135);
    const landBR = toScreen(128, 135);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(landTL.x, landTL.y, landBR.x - landTL.x, landBR.y - landTL.y);

    const sandTL = toScreen(128, -135);
    const sandBR = toScreen(148, 135);
    ctx.fillStyle = '#a18054';
    ctx.fillRect(sandTL.x, sandTL.y, sandBR.x - sandTL.x, sandBR.y - sandTL.y);

    const parkTL = toScreen(-48, -48);
    ctx.fillStyle = '#1f4d32';
    ctx.fillRect(parkTL.x, parkTL.y, 40 * scale, 40 * scale);

    ctx.fillStyle = '#475569';
    ROAD_CENTERS.forEach((rc) => {
      const pH = toScreen(-118, rc - 6);
      ctx.fillRect(pH.x, pH.y, 236 * scale, 12 * scale);
      const pV = toScreen(rc - 6, -118);
      ctx.fillRect(pV.x, pV.y, 12 * scale, 236 * scale);
    });

    hud.buildingsForMap.forEach((b) => {
      const tl = toScreen(b.x - b.w / 2, b.z - b.d / 2);
      ctx.fillStyle = b.isHouse ? '#785a40' : '#0f172a';
      ctx.fillRect(tl.x, tl.y, b.w * scale, b.d * scale);
    });

    hud.blips.forEach((blip) => {
      const p = toScreen(blip.x, blip.z);
      if (p.x < -8 || p.x > w + 8 || p.y < -8 || p.y > h + 8) return;
      ctx.beginPath();
      if (blip.type === 'police') {
        ctx.fillStyle = '#ef4444';
        ctx.arc(p.x, p.y, fullMap ? 4.5 : 3.6, 0, Math.PI * 2);
      } else if (blip.type === 'hostile') {
        ctx.fillStyle = '#fb7185';
        ctx.arc(p.x, p.y, fullMap ? 3.5 : 2.8, 0, Math.PI * 2);
      } else if (blip.type === 'mission' || blip.type === 'target') {
        ctx.fillStyle = blip.type === 'target' ? '#38bdf8' : '#f59e0b';
        ctx.arc(p.x, p.y, fullMap ? 6 : 4.5, 0, Math.PI * 2);
      } else if (blip.type === 'pickup') {
        ctx.fillStyle = '#22c55e';
        ctx.arc(p.x, p.y, fullMap ? 3.5 : 2.6, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.arc(p.x, p.y, fullMap ? 2.5 : 2.1, 0, Math.PI * 2);
      }
      ctx.fill();
    });

    const playerPos = toScreen(hud.playerX, hud.playerZ);
    ctx.save();
    ctx.translate(playerPos.x, playerPos.y);
    ctx.rotate(-hud.playerYaw + Math.PI);
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(5, 5.5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [hud, size, range, fullMap]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="block rounded-lg border-2 border-neutral-800 bg-neutral-950"
    />
  );
};
