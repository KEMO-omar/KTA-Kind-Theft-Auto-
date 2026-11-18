import React, { useEffect, useState } from 'react';
import {
  Car,
  Crosshair,
  Flame,
  Gamepad2,
  Heart,
  Menu,
  Moon,
  Radio,
  Shield,
  Star,
  Sun,
  Sunset,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { CharacterProfile, HudSnapshot, Language, WeaponId } from '../types/game';
import { STRINGS } from '../data/i18n';
import { MinimapCanvas } from './MinimapCanvas';
import { TouchControls } from './TouchControls';
import { soundEngine } from '../game/audio';

interface GameHudProps {
  hud: HudSnapshot;
  character: CharacterProfile;
  language: Language;
  onPause: () => void;
  onSelectWeapon: (w: WeaponId) => void;
  onCycleWeapon: () => void;
  onCycleRadio: () => void;
  onCycleTime: () => void;
  onRespawn: () => void;
  onToggleVehicle: () => void;
  onStartMission: () => void;
  onTouchMove: (x: number, y: number, boost: boolean) => void;
  onTouchFire: (firing: boolean) => void;
  onTouchJumpOrDrift: (active: boolean) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  character,
  language,
  onPause,
  onSelectWeapon,
  onCycleWeapon,
  onCycleRadio,
  onCycleTime,
  onRespawn,
  onToggleVehicle,
  onStartMission,
  onTouchMove,
  onTouchFire,
  onTouchJumpOrDrift,
}) => {
  const [muted, setMuted] = useState(soundEngine.isMuted());
  const [showTouch, setShowTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) {
      setShowTouch(true);
    }
  }, []);

  const t = STRINGS[language];
  const isRtl = language === 'ar';

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const weapons: Array<{ id: WeaponId; label: string; short: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'melee', label: t.weaponNames.melee, short: t.weaponShort.melee, icon: Swords },
    { id: 'pistol', label: t.weaponNames.pistol, short: t.weaponShort.pistol, icon: Crosshair },
    { id: 'smg', label: t.weaponNames.smg, short: t.weaponShort.smg, icon: Zap },
    { id: 'shotgun', label: t.weaponNames.shotgun, short: t.weaponShort.shotgun, icon: Flame },
    { id: 'rifle', label: t.weaponNames.rifle, short: t.weaponShort.rifle, icon: Crosshair },
    { id: 'rpg', label: t.weaponNames.rpg, short: t.weaponShort.rpg, icon: Flame },
  ];

  const TimeIcon = hud.timeOfDay === 'day' ? Sun : hud.timeOfDay === 'night' ? Moon : Sunset;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-auto">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-950/90 hover:bg-neutral-900 border border-white/15 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            >
              <Menu className="w-4 h-4 text-amber-400" />
              <span>{t.pauseTitle}</span>
            </button>
            <button
              type="button"
              onClick={onCycleRadio}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-neutral-950/90 hover:bg-neutral-900 border border-white/15 text-xs font-medium text-neutral-200 cursor-pointer whitespace-nowrap"
              title="R"
            >
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">{t.radioNames[hud.radioStation]}</span>
            </button>
            <button
              type="button"
              onClick={onCycleTime}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-neutral-950/90 hover:bg-neutral-900 border border-white/15 text-xs font-medium text-neutral-200 cursor-pointer whitespace-nowrap"
              title="T"
            >
              <TimeIcon className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">{t.timeNames[hud.timeOfDay]}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTouch((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap ${
                showTouch
                  ? 'bg-teal-500 text-neutral-950 border-teal-400'
                  : 'bg-neutral-950/90 text-neutral-200 border-white/15 hover:bg-neutral-900'
              }`}
              title={t.touchControls}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.touchControls}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg bg-neutral-950/90 hover:bg-neutral-900 border border-white/15 text-neutral-200 cursor-pointer"
              aria-label={muted ? t.soundOff : t.soundOn}
            >
              {muted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {hud.activeMission && (
            <div className="p-3 rounded-lg bg-neutral-950/92 border border-amber-400/40 text-white">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-display text-sm font-bold text-amber-400">
                  {hud.activeMission.title[language]}
                </span>
                {hud.activeMission.timeLeft > 0 && (
                  <span className="font-hud text-xs font-bold tabular-nums text-rose-400">
                    {Math.ceil(hud.activeMission.timeLeft)}s
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-200 mb-1.5">{hud.activeMission.objective[language]}</p>
              <div className="flex items-center justify-between text-xs text-neutral-400 font-hud tabular-nums">
                <span>
                  {hud.activeMission.progress} / {hud.activeMission.total}
                </span>
                <span className="text-emerald-400">+${hud.activeMission.rewardCash}</span>
              </div>
            </div>
          )}

          {!hud.activeMission && hud.availableMissionPrompt && (
            <button
              type="button"
              onClick={onStartMission}
              className="p-3 rounded-lg bg-neutral-950/95 hover:bg-neutral-900 border border-teal-400/60 text-white text-start cursor-pointer"
            >
              <div className="text-xs font-bold text-teal-300 mb-0.5">
                {hud.availableMissionPrompt.title[language]} · +${hud.availableMissionPrompt.reward}
              </div>
              <div className="text-xs text-neutral-200">{t.startMissionHint}</div>
            </button>
          )}

          {hud.nearbyVehiclePrompt && !hud.inVehicle && (
            <button
              type="button"
              onClick={onToggleVehicle}
              className="px-3 py-2 rounded-lg bg-neutral-950/95 hover:bg-neutral-900 border border-white/25 text-xs text-white flex items-center gap-2 cursor-pointer"
            >
              <Car className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {hud.nearbyVehiclePrompt} · {t.enterVehicleHint}
              </span>
            </button>
          )}
        </div>

        {/* Top Right: Wanted, Cash, Health, Armor */}
        <div className="flex flex-col items-end gap-1.5 bg-neutral-950/90 border border-white/15 rounded-xl px-3.5 py-2.5 min-w-[165px] sm:min-w-[190px]">
          <div className="flex items-center gap-1" aria-label={t.wanted}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= hud.wantedStars ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-baseline gap-2.5 font-hud tabular-nums">
            <span className="text-lg sm:text-xl font-bold text-emerald-400">
              ${hud.cash.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-amber-300">
              {t.respect} {hud.respect}
            </span>
          </div>

          <div className="w-full space-y-1">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100))}%` }}
                />
              </div>
              <span className="font-hud text-[11px] tabular-nums text-neutral-300 w-7 text-end">
                {hud.health}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, hud.armor))}%` }}
                />
              </div>
              <span className="font-hud text-[11px] tabular-nums text-neutral-300 w-7 text-end">
                {hud.armor}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 font-medium">
            {character.name[language]} · {hud.inVehicle ? hud.vehicleName : t.onFoot}
          </div>
        </div>
      </div>

      {/* Transient Center Banner */}
      {hud.bannerMessage && (
        <div className="self-center px-6 py-2.5 rounded-lg bg-neutral-950/95 border border-amber-400/50 shadow-xl text-center">
          <div
            className={`font-display text-lg sm:text-xl font-bold tracking-wide ${
              hud.bannerMessage.tone === 'success'
                ? 'text-emerald-400'
                : hud.bannerMessage.tone === 'alert'
                  ? 'text-rose-400'
                  : hud.bannerMessage.tone === 'gold'
                    ? 'text-amber-400'
                    : 'text-sky-300'
            }`}
          >
            {hud.bannerMessage.text}
          </div>
        </div>
      )}

      {/* Bottom Area: Subtitles + Minimap + 6-Weapon Dock */}
      <div className="flex flex-col gap-2.5">
        {hud.subtitle && (
          <div className="self-center max-w-xl px-5 py-2.5 rounded-lg bg-neutral-950/92 border border-white/15 text-center shadow-lg">
            <span className="text-xs sm:text-sm font-bold" style={{ color: hud.subtitle.color }}>
              {hud.subtitle.speaker}:{' '}
            </span>
            <span className="text-xs sm:text-sm text-white font-medium">{hud.subtitle.text}</span>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          {/* Bottom Left Minimap */}
          <div className="pointer-events-auto">
            <MinimapCanvas hud={hud} size={showTouch ? 112 : 148} range={88} />
          </div>

          {/* Bottom Center: Speedometer + 6-Weapon Arsenal Dock */}
          <div className="pointer-events-auto flex flex-col items-center gap-1.5">
            {hud.inVehicle && (
              <div className="px-4 py-1.5 rounded-lg bg-neutral-950/92 border border-white/15 flex items-center gap-4">
                <span className="font-hud text-lg sm:text-xl font-bold tabular-nums text-amber-400">
                  {hud.vehicleSpeedKmh} <span className="text-xs text-neutral-400">{t.kmh}</span>
                </span>
                <span className="text-xs text-neutral-300 hidden md:inline">{t.exitVehicleHint}</span>
              </div>
            )}

            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/92 border border-white/15 overflow-x-auto max-w-[66vw] sm:max-w-none">
              {weapons.map((w) => {
                const active = hud.activeWeapon === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWeapon(w.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title={w.label}
                  >
                    <w.icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{w.label}</span>
                    <span className="lg:hidden">{w.short}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onToggleVehicle}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-neutral-200 hover:bg-neutral-800 border-s border-white/10 cursor-pointer whitespace-nowrap"
                title="F"
              >
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{hud.inVehicle ? t.exitBtn : t.carBtn}</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:block w-[112px]" />
        </div>
      </div>

      {/* Virtual Analog Touch Controls for Mobile & Tablet */}
      {showTouch && !hud.isWasted && (
        <TouchControls
          hud={hud}
          language={language}
          onMove={onTouchMove}
          onFire={onTouchFire}
          onJumpOrDrift={onTouchJumpOrDrift}
          onToggleVehicle={onToggleVehicle}
          onCycleWeapon={onCycleWeapon}
        />
      )}

      {/* Wasted Overlay */}
      {hud.isWasted && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-neutral-950/85 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-rose-500 tracking-wider mb-3">
            {t.wastedTitle}
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base max-w-md mb-6">{t.wastedSub}</p>
          <button
            type="button"
            onClick={onRespawn}
            className="px-7 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display text-lg font-bold rounded-lg cursor-pointer"
          >
            {t.respawnBtn}
          </button>
        </div>
      )}
    </div>
  );
};
