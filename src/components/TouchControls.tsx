import React, { useRef, useState } from 'react';
import { Car, Crosshair, Flame, Repeat, ArrowUp } from 'lucide-react';
import { HudSnapshot, Language } from '../types/game';
import { STRINGS } from '../data/i18n';

interface TouchControlsProps {
  hud: HudSnapshot;
  language: Language;
  onMove: (x: number, y: number, boost: boolean) => void;
  onFire: (firing: boolean) => void;
  onJumpOrDrift: (active: boolean) => void;
  onToggleVehicle: () => void;
  onCycleWeapon: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  hud,
  language,
  onMove,
  onFire,
  onJumpOrDrift,
  onToggleVehicle,
  onCycleWeapon,
}) => {
  const t = STRINGS[language];
  const stickRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [boosting, setBoosting] = useState(false);
  const stickVectorRef = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 40;

  const updateStick = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnob({ x: dx, y: dy });
    const nx = dx / maxRadius;
    const ny = dy / maxRadius;
    stickVectorRef.current = { x: nx, y: ny };
    onMove(nx, ny, boosting);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0 });
    stickVectorRef.current = { x: 0, y: 0 };
    onMove(0, 0, boosting);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-20 sm:pb-6">
      {/* Bottom-Left Virtual Analog Joystick (offset cleanly above minimap on small screens) */}
      <div className="pointer-events-auto flex flex-col items-center gap-2 ml-2 sm:ml-44 mb-1">
        <div
          ref={stickRef}
          onPointerDown={(e) => {
            e.stopPropagation();
            activePointerId.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateStick(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (activePointerId.current !== e.pointerId) return;
            e.stopPropagation();
            updateStick(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            if (activePointerId.current !== e.pointerId) return;
            e.stopPropagation();
            resetStick();
          }}
          onPointerCancel={resetStick}
          className="relative w-28 h-28 rounded-full bg-neutral-950/75 border-2 border-white/25 flex items-center justify-center touch-none select-none"
        >
          <div
            className="w-12 h-12 rounded-full bg-amber-500/90 border-2 border-white/80 shadow-lg"
            style={{
              transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
            }}
          />
        </div>
      </div>

      {/* Bottom-Right Action Pad (Fire, Jump/Drift, Boost, Car, Cycle Weapon) */}
      <div className="pointer-events-auto grid grid-cols-2 gap-2.5 mr-2 mb-1 touch-none select-none">
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            setBoosting(true);
            onMove(stickVectorRef.current.x, stickVectorRef.current.y, true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setBoosting(false);
            onMove(stickVectorRef.current.x, stickVectorRef.current.y, false);
          }}
          onPointerCancel={() => setBoosting(false)}
          className={`w-14 h-14 rounded-full border text-[11px] font-bold flex flex-col items-center justify-center ${
            boosting
              ? 'bg-amber-500 text-neutral-950 border-white'
              : 'bg-neutral-950/85 text-amber-300 border-white/20'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{t.nitroBtn}</span>
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onToggleVehicle();
          }}
          className="w-14 h-14 rounded-full bg-neutral-950/85 active:bg-sky-500 active:text-neutral-950 border border-white/20 text-sky-300 text-[11px] font-bold flex flex-col items-center justify-center"
        >
          <Car className="w-4 h-4" />
          <span>{hud.inVehicle ? t.exitBtn : t.carBtn}</span>
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onJumpOrDrift(true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            onJumpOrDrift(false);
          }}
          onPointerCancel={() => onJumpOrDrift(false)}
          className="w-14 h-14 rounded-full bg-neutral-950/85 active:bg-teal-400 active:text-neutral-950 border border-white/20 text-teal-300 text-[11px] font-bold flex flex-col items-center justify-center"
        >
          <ArrowUp className="w-4 h-4" />
          <span>{hud.inVehicle ? t.driftBtn : t.jumpBtn}</span>
        </button>

        {!hud.inVehicle ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onFire(true);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onFire(false);
            }}
            onPointerCancel={() => onFire(false)}
            className="w-16 h-16 rounded-full bg-rose-600 active:bg-rose-400 border-2 border-white/40 text-white text-xs font-bold flex flex-col items-center justify-center shadow-lg"
          >
            <Crosshair className="w-5 h-5" />
            <span>{t.fireBtn}</span>
          </button>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onFire(true);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onFire(false);
            }}
            className="w-16 h-16 rounded-full bg-amber-500 active:bg-amber-300 border-2 border-white/40 text-neutral-950 text-xs font-bold flex flex-col items-center justify-center shadow-lg"
          >
            <span>{t.hornBtn}</span>
          </button>
        )}

        {!hud.inVehicle && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onCycleWeapon();
            }}
            className="col-span-2 py-2 px-3 rounded-lg bg-neutral-950/85 active:bg-amber-500 active:text-neutral-950 border border-white/20 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5"
          >
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.weaponShort[hud.activeWeapon]}</span>
          </button>
        )}
      </div>
    </div>
  );
};
