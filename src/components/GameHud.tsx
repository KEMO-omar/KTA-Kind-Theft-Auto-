import React, { useEffect, useState } from 'react';
import {
  Camera,
  Car,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Flame,
  Gamepad2,
  Heart,
  Home,
  Menu,
  Moon,
  Radio,
  Shield,
  ShoppingBag,
  Star,
  Sun,
  Sunset,
  Swords,
  Users,
  Utensils,
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
  onCycleWeapon: (dir: 1 | -1) => void;
  onCycleRadio: () => void;
  onCycleTime: () => void;
  onToggleBuddy: () => void;
  onCycleDriveCam: () => void;
  onToggleAim: () => void;
  onExecuteShopOption: (shopId: string, optionId: string) => void;
  onRespawn: () => void;
  onToggleVehicle: () => void;
  onStartMission: () => void;
  onBuyFood: () => void;
  onTouchMove: (x: number, y: number, boost: boolean) => void;
  onTouchFire: (firing: boolean) => void;
  onTouchJumpOrDrift: (active: boolean) => void;
}

const WEAPON_ICONS: Record<WeaponId, React.ComponentType<{ className?: string }>> = {
  melee: Swords,
  pistol: Crosshair,
  smg: Zap,
  shotgun: Flame,
  rifle: Crosshair,
  rpg: Flame,
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  character,
  language,
  onPause,
  onCycleWeapon,
  onCycleRadio,
  onCycleTime,
  onToggleBuddy,
  onCycleDriveCam,
  onToggleAim,
  onExecuteShopOption,
  onRespawn,
  onToggleVehicle,
  onStartMission,
  onBuyFood,
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

  const TimeIcon = hud.timeOfDay === 'day' ? Sun : hud.timeOfDay === 'night' ? Moon : Sunset;
  const ActiveWeaponIcon = WEAPON_ICONS[hud.activeWeapon];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-5">
      {/* Top Row: Left Utility + Radar | Right Stats */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex flex-col gap-2 pointer-events-auto max-w-[62vw] sm:max-w-md">
          {/* Well-spaced Top Utility Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPause}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-neutral-950/92 hover:bg-neutral-900 border border-white/15 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            >
              <Menu className="w-4 h-4 text-amber-400" />
              <span>{t.pauseTitle}</span>
            </button>
            <button
              type="button"
              onClick={onCycleRadio}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-lg bg-neutral-950/92 hover:bg-neutral-900 border border-white/15 text-xs font-medium text-neutral-200 cursor-pointer whitespace-nowrap"
              title="R"
            >
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline">{t.radioNames[hud.radioStation]}</span>
            </button>
            <button
              type="button"
              onClick={onCycleTime}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-lg bg-neutral-950/92 hover:bg-neutral-900 border border-white/15 text-xs font-medium text-neutral-200 cursor-pointer whitespace-nowrap"
              title="T"
            >
              <TimeIcon className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden lg:inline">{t.timeNames[hud.timeOfDay]}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTouch((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap ${
                showTouch
                  ? 'bg-teal-500 text-neutral-950 border-teal-400'
                  : 'bg-neutral-950/92 text-neutral-200 border-white/15 hover:bg-neutral-900'
              }`}
              title={t.touchControls}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.touchControls}</span>
            </button>
            <button
              type="button"
              onClick={onToggleBuddy}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                hud.buddyActive
                  ? 'bg-cyan-500 text-neutral-950 border-cyan-300'
                  : 'bg-neutral-950/92 text-cyan-300 border-white/15 hover:bg-neutral-900'
              }`}
              title="G"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hud.buddyActive ? t.buddyWithYou : t.buddyCall}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 sm:p-2 rounded-lg bg-neutral-950/92 hover:bg-neutral-900 border border-white/15 text-neutral-200 cursor-pointer"
              aria-label={muted ? t.soundOff : t.soundOn}
            >
              {muted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Top-Left Radar + Contextual Action Prompts Side-by-Side so Bottom-Left stays 100% open for Joystick */}
          <div className="flex items-start gap-2.5">
            <div className="shrink-0">
              <MinimapCanvas hud={hud} size={showTouch ? 102 : 132} range={88} />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              {hud.activeMission && (
                <div
                  className={`p-2.5 rounded-lg bg-neutral-950/92 border text-white max-w-[235px] ${
                    hud.activeMission.isStory
                      ? 'border-pink-400/60'
                      : hud.activeMission.isCoop
                        ? 'border-cyan-400/65'
                        : 'border-amber-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`font-display text-xs sm:text-sm font-bold truncate ${
                        hud.activeMission.isStory
                          ? 'text-pink-400'
                          : hud.activeMission.isCoop
                            ? 'text-cyan-300'
                            : 'text-amber-400'
                      }`}
                    >
                      {hud.activeMission.title[language]}
                    </span>
                    {hud.activeMission.timeLeft > 0 && (
                      <span className="font-hud text-xs font-bold tabular-nums text-rose-400 shrink-0">
                        {Math.ceil(hud.activeMission.timeLeft)}s
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-200 leading-snug mb-1">
                    {hud.activeMission.objective[language]}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-hud tabular-nums">
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
                  className={`p-2.5 rounded-lg bg-neutral-950/95 hover:bg-neutral-900 border text-white text-start cursor-pointer max-w-[235px] ${
                    hud.availableMissionPrompt.isStory
                      ? 'border-pink-400/70'
                      : hud.availableMissionPrompt.isCoop
                        ? 'border-cyan-400/70'
                        : 'border-teal-400/60'
                  }`}
                >
                  <div
                    className={`text-xs font-bold mb-0.5 ${
                      hud.availableMissionPrompt.isStory
                        ? 'text-pink-300'
                        : hud.availableMissionPrompt.isCoop
                          ? 'text-cyan-300'
                          : 'text-teal-300'
                    }`}
                  >
                    {hud.availableMissionPrompt.title[language]} · +${hud.availableMissionPrompt.reward}
                  </div>
                  <div className="text-[11px] text-neutral-200">{t.startMissionHint}</div>
                </button>
              )}

              {hud.insideBuildingName && !hud.inVehicle && (
                <div className="px-2.5 py-1.5 rounded-lg bg-neutral-950/95 border border-teal-400/50 text-xs font-bold text-teal-300 flex items-center gap-1.5 max-w-[245px]">
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {t.insideLabel} {hud.insideBuildingName[language]}
                  </span>
                </div>
              )}

              {hud.interiorPrompt && (
                <div className="p-2.5 rounded-lg bg-neutral-950/95 border border-amber-400/60 text-white max-w-[265px] space-y-1.5 shadow-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    {hud.interiorPrompt.isSafehouse ? (
                      <Home className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                    ) : (
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    )}
                    <span className="truncate">{hud.interiorPrompt.shopName[language]}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">{hud.interiorPrompt.roleTitle[language]}</div>
                  <div className="flex flex-col gap-1">
                    {hud.interiorPrompt.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onExecuteShopOption(hud.interiorPrompt!.shopId, opt.id)}
                        className="w-full px-2 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-400/60 flex items-center justify-between gap-2 text-start text-[11px] cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{opt.label[language]}</div>
                          <div className="text-[10px] text-teal-300">{opt.effectLabel[language]}</div>
                        </div>
                        <span className="font-hud text-[11px] font-bold text-emerald-400 shrink-0 tabular-nums">
                          {opt.cost === 0 ? (language === 'ar' ? 'مجاني' : 'FREE') : `$${opt.cost}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hud.nearbyRestaurantPrompt && !hud.inVehicle && !hud.interiorPrompt && (
                <button
                  type="button"
                  onClick={onBuyFood}
                  className="p-2.5 rounded-lg bg-neutral-950/95 hover:bg-neutral-900 border border-emerald-400/65 text-white text-start cursor-pointer max-w-[230px]"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-0.5">
                    <Utensils className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{hud.nearbyRestaurantPrompt.name[language]}</span>
                  </div>
                  <div className="text-[11px] text-neutral-200">
                    -${hud.nearbyRestaurantPrompt.cost} (+{hud.nearbyRestaurantPrompt.heal} HP) · {t.buyFoodHint}
                  </div>
                </button>
              )}

              {hud.nearbyVehiclePrompt && !hud.inVehicle && (
                <button
                  type="button"
                  onClick={onToggleVehicle}
                  className="px-2.5 py-2 rounded-lg bg-neutral-950/95 hover:bg-neutral-900 border border-white/25 text-[11px] sm:text-xs text-white flex items-center gap-1.5 cursor-pointer max-w-[230px]"
                >
                  <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {hud.nearbyVehiclePrompt} · {t.enterVehicleHint}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top Right: Wanted, Cash, Health, Armor */}
        <div className="flex flex-col items-end gap-1 bg-neutral-950/92 border border-white/15 rounded-xl px-3 py-2 min-w-[140px] sm:min-w-[185px]">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 font-hud tabular-nums">
              <span className="text-[10px] text-cyan-300 font-bold">
                {t.levelLabel} {hud.level}
              </span>
              <span className="text-[10px] text-pink-300 font-semibold">
                {language === 'ar'
                  ? `القصة ${Math.min(hud.storyChapter, 3)}/3`
                  : `Story ${Math.min(hud.storyChapter, 3)}/3`}
              </span>
            </div>
            <div className="flex items-center gap-0.5" aria-label={t.wanted}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    star <= hud.wantedStars ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-2 font-hud tabular-nums">
            <span className="text-base sm:text-xl font-bold text-emerald-400">
              ${hud.cash.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300">
              {t.respect} {hud.respect}
            </span>
          </div>

          <div className="w-full space-y-1">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-rose-400 shrink-0" />
              <div className="flex-1 h-1.5 sm:h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100))}%` }}
                />
              </div>
              <span className="font-hud text-[10px] tabular-nums text-neutral-300 w-6 text-end">
                {hud.health}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-sky-400 shrink-0" />
              <div className="flex-1 h-1.5 sm:h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, hud.armor))}%` }}
                />
              </div>
              <span className="font-hud text-[10px] tabular-nums text-neutral-300 w-6 text-end">
                {hud.armor}
              </span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium truncate max-w-[175px]">
            {character.name[language]} · {hud.inVehicle ? hud.vehicleName : t.onFoot}
          </div>
        </div>
      </div>

      {/* Precision Aiming Crosshair Reticle (On Foot) */}
      {!hud.inVehicle && !hud.isWasted && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0">
          <div className="relative flex flex-col items-center">
            <div
              className={`transition-transform duration-100 flex items-center justify-center ${
                hud.isAiming ? 'scale-90' : 'scale-100'
              }`}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                className={hud.aimLocked ? 'text-rose-400' : hud.isAiming ? 'text-amber-300' : 'text-white/75'}
              >
                <circle
                  cx="17"
                  cy="17"
                  r={hud.isAiming ? '7' : '10'}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeDasharray={hud.aimLocked ? 'none' : '4 3'}
                />
                <circle cx="17" cy="17" r="2" fill="currentColor" />
                <line x1="17" y1="2" x2="17" y2="7" stroke="currentColor" strokeWidth="1.5" />
                <line x1="17" y1="27" x2="17" y2="32" stroke="currentColor" strokeWidth="1.5" />
                <line x1="2" y1="17" x2="7" y2="17" stroke="currentColor" strokeWidth="1.5" />
                <line x1="27" y1="17" x2="32" y2="17" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            {hud.aimTargetName && (
              <span className="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/85 text-[10px] font-bold text-rose-300 border border-rose-500/40">
                {hud.aimTargetName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Transient Center Banner */}
      {hud.bannerMessage && (
        <div className="self-center px-5 py-2 rounded-lg bg-neutral-950/95 border border-amber-400/50 shadow-xl text-center z-10">
          <div
            className={`font-display text-base sm:text-xl font-bold tracking-wide ${
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

      {/* Bottom Center: Subtitles + Speedometer + Compact Weapon & Angle Switcher */}
      <div className="flex flex-col items-center gap-2 pb-1">
        {hud.subtitle && (
          <div className="max-w-lg px-4 py-2 rounded-lg bg-neutral-950/92 border border-white/15 text-center shadow-lg">
            <span className="text-xs sm:text-sm font-bold" style={{ color: hud.subtitle.color }}>
              {hud.subtitle.speaker}:{' '}
            </span>
            <span className="text-xs sm:text-sm text-white font-medium">{hud.subtitle.text}</span>
          </div>
        )}

        <div className="pointer-events-auto flex flex-col items-center gap-1.5">
          {hud.inVehicle && (
            <div className="px-3.5 py-1.5 rounded-lg bg-neutral-950/92 border border-white/15 flex items-center gap-3">
              <span className="font-hud text-base sm:text-lg font-bold tabular-nums text-amber-400">
                {hud.vehicleSpeedKmh} <span className="text-[11px] text-neutral-400">{t.kmh}</span>
              </span>
              <span
                className={`font-hud text-xs font-semibold tabular-nums ${
                  hud.vehicleHp < 30 ? 'text-rose-400' : hud.vehicleHp < 60 ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                HP {hud.vehicleHp}%
              </span>
              <button
                type="button"
                onClick={onCycleDriveCam}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-[11px] font-semibold text-amber-300 cursor-pointer whitespace-nowrap"
                title="C"
              >
                <Camera className="w-3 h-3" />
                <span>{t.camModeNames[hud.driveCamMode]}</span>
              </button>
              {!showTouch && (
                <span className="text-[11px] text-neutral-300 hidden md:inline">{t.exitVehicleHint}</span>
              )}
            </div>
          )}

          {/* Compact Single-Slot Weapon Switcher (< Current Weapon >) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/92 border border-white/15 shadow-lg">
            <button
              type="button"
              onClick={() => onCycleWeapon(-1)}
              className="p-1.5 sm:p-2 rounded-lg text-neutral-300 hover:bg-neutral-800 active:bg-amber-500 active:text-neutral-950 cursor-pointer"
              aria-label="Previous weapon"
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-400 min-w-[78px] sm:min-w-[130px] justify-center">
              <ActiveWeaponIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{t.weaponNames[hud.activeWeapon]}</span>
              <span className="sm:hidden whitespace-nowrap">{t.weaponShort[hud.activeWeapon]}</span>
            </div>

            <button
              type="button"
              onClick={() => onCycleWeapon(1)}
              className="p-1.5 sm:p-2 rounded-lg text-neutral-300 hover:bg-neutral-800 active:bg-amber-500 active:text-neutral-950 cursor-pointer"
              aria-label="Next weapon"
            >
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {!showTouch && !hud.inVehicle && (
              <button
                type="button"
                onClick={onToggleAim}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border-s border-white/10 cursor-pointer whitespace-nowrap ${
                  hud.isAiming ? 'text-amber-300 bg-neutral-900' : 'text-neutral-200 hover:bg-neutral-800'
                }`}
                title="V / Right-Click"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.aimBtn}</span>
              </button>
            )}

            {!showTouch && (
              <button
                type="button"
                onClick={onToggleVehicle}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-200 hover:bg-neutral-800 border-s border-white/10 cursor-pointer whitespace-nowrap"
                title="F"
              >
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>{hud.inVehicle ? t.exitBtn : t.carBtn}</span>
              </button>
            )}
          </div>
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
          onToggleAim={onToggleAim}
          onCycleDriveCam={onCycleDriveCam}
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
