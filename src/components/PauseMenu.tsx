import React, { useState } from 'react';
import { FolderOpen, Globe, Moon, Play, RotateCcw, Save, Sun, Sunset, Trash2, Users } from 'lucide-react';
import { HudSnapshot, Language, TimeOfDay } from '../types/game';
import { STRINGS } from '../data/i18n';
import { getLevelRankTitle } from '../game/saveSystem';
import { MinimapCanvas } from './MinimapCanvas';

interface PauseMenuProps {
  hud: HudSnapshot;
  language: Language;
  hasSave: boolean;
  onLanguageChange: (lang: Language) => void;
  onResume: () => void;
  onChangeCharacter: () => void;
  onRestart: () => void;
  onSetTimeOfDay: (mode: TimeOfDay) => void;
  onSaveNow: () => boolean;
  onLoadSave: () => boolean;
  onClearSave: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  hud,
  language,
  hasSave,
  onLanguageChange,
  onResume,
  onChangeCharacter,
  onRestart,
  onSetTimeOfDay,
  onSaveNow,
  onLoadSave,
  onClearSave,
}) => {
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const t = STRINGS[language];
  const isRtl = language === 'ar';

  const handleSave = () => {
    const ok = onSaveNow();
    if (ok) setSaveNotice(t.savedToast);
  };

  const handleLoad = () => {
    const ok = onLoadSave();
    if (ok) setSaveNotice(t.loadedToast);
  };

  const handleClear = () => {
    onClearSave();
    setSaveNotice(t.clearedToast);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-40 bg-neutral-950/95 text-white overflow-y-auto flex items-center justify-center p-4 sm:p-8"
    >
      <div className="max-w-5xl w-full bg-neutral-900 border border-white/15 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Full City Map & Session Stats */}
        <div className="lg:col-span-6 flex flex-col items-center justify-between gap-4">
          <div className="w-full flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-amber-400">{t.cityMap}</h2>
              <div className="text-xs text-cyan-300 font-semibold font-hud tabular-nums">
                {t.levelLabel} {hud.level} · {getLevelRankTitle(hud.level, language)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'عربي' : 'English'}</span>
            </button>
          </div>

          <MinimapCanvas hud={hud} size={300} fullMap />

          <div className="w-full grid grid-cols-4 gap-2 text-center">
            {[
              { label: t.missionsCompleted, val: hud.stats.missionsDone },
              { label: t.carsDriven, val: hud.stats.carsDriven },
              { label: t.takedowns, val: hud.stats.takedowns },
              { label: t.stuntsLanded, val: hud.stats.stuntsLanded },
            ].map((s) => (
              <div key={s.label} className="p-2.5 rounded-lg bg-neutral-950 border border-white/10">
                <div className="font-hud text-lg font-bold tabular-nums text-white">{s.val}</div>
                <div className="text-[11px] text-neutral-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Controls, Save/Load, Atmosphere & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-5">
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-3">{t.controlsGuide}</h3>
            <div className="space-y-1.5 mb-5">
              {t.controlsList.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center justify-between gap-4 py-1.5 border-b border-white/10 text-xs"
                >
                  <span className="font-hud font-bold text-amber-400 whitespace-nowrap">{c.key}</span>
                  <span className="text-neutral-300 text-end">{c.desc}</span>
                </div>
              ))}
            </div>

            {/* Save / Load Progress Controls */}
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-400/40 text-emerald-300 text-xs font-semibold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.saveNow}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoad}
                  disabled={!hasSave}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/35 disabled:opacity-40 disabled:cursor-not-allowed border border-sky-400/40 text-sky-300 text-xs font-semibold cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.loadSave}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasSave}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-400/35 text-rose-300 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.clearSave}</span>
                </button>
              </div>
              {saveNotice && (
                <div className="mt-2 text-xs text-emerald-400 font-medium text-center">{saveNotice}</div>
              )}
            </div>

            <div className="mb-2">
              <div className="text-xs font-semibold text-neutral-400 mb-2">{t.timeOfDayLabel}</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sunset' as TimeOfDay, icon: Sunset },
                  { id: 'day' as TimeOfDay, icon: Sun },
                  { id: 'night' as TimeOfDay, icon: Moon },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSetTimeOfDay(opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      hud.timeOfDay === opt.id
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-950 text-neutral-300 border-white/10 hover:bg-neutral-800'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    <span>{t.timeNames[opt.id]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display font-bold text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.resume}</span>
            </button>
            <button
              type="button"
              onClick={onChangeCharacter}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>{t.changeCharacter}</span>
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>{t.restartCity}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

