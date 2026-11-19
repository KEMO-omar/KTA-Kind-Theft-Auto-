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
      if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) return;

      if (blip.type === 'house') {
        const s = fullMap ? 8.5 : 6.4;
        ctx.fillStyle = '#14b8a6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s * 0.75);
        ctx.lineTo(p.x + s * 0.65, p.y - s * 0.05);
        ctx.lineTo(p.x + s * 0.45, p.y - s * 0.05);
        ctx.lineTo(p.x + s * 0.45, p.y + s * 0.6);
        ctx.lineTo(p.x - s * 0.45, p.y + s * 0.6);
        ctx.lineTo(p.x - s * 0.45, p.y - s * 0.05);
        ctx.lineTo(p.x - s * 0.65, p.y - s * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        return;
      }

      if (blip.type === 'shop') {
        const s = fullMap ? 7 : 5.4;
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        ctx.strokeRect(p.x - s / 2, p.y - s / 2, s, s);
        return;
      }

      if (blip.type === 'food') {
        const s = fullMap ? 6.5 : 5;
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 1;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        ctx.strokeRect(p.x - s / 2, p.y - s / 2, s, s);
        return;
      }

      ctx.beginPath();
      if (blip.type === 'story') {
        const r = fullMap ? 6.2 : 4.8;
        ctx.fillStyle = '#ec4899';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        return;
      } else if (blip.type === 'coop') {
        const r = fullMap ? 6.2 : 4.8;
        ctx.fillStyle = '#14b8a6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        return;
      } else if (blip.type === 'buddy') {
        const r = fullMap ? 5.6 : 4.4;
        ctx.fillStyle = '#06b6d4';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        return;
      } else if (blip.type === 'police') {
        ctx.fillStyle = '#ef4444';
        ctx.arc(p.x, p.y, fullMap ? 4.5 : 3.6, 0, Math.PI * 2);
      } else if (blip.type === 'hostile') {
        ctx.fillStyle = '#fb7185';
        ctx.arc(p.x, p.y, fullMap ? 3.5 : 2.8, 0, Math.PI * 2);
      } else if (blip.type === 'mission' || blip.type === 'target') {
        ctx.fillStyle = blip.type === 'target' ? '#38bdf8' : '#f59e0b';
        ctx.arc(p.x, p.y, fullMap ? 5.8 : 4.4, 0, Math.PI * 2);
      } else if (blip.type === 'pickup') {
        ctx.fillStyle = '#4ade80';
        ctx.arc(p.x, p.y, fullMap ? 3.2 : 2.5, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.arc(p.x, p.y, fullMap ? 2.4 : 2.0, 0, Math.PI * 2);
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
      className="block rounded-lg border-2 border-neutral-800 bg-neutral-950 shadow-lg"
    />
  );
};
