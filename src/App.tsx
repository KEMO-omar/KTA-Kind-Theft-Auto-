import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './data/characters';
import { CharacterProfile, HudSnapshot, Language, SavedGameState, TimeOfDay } from './types/game';
import { IntroScreen } from './components/IntroScreen';
import { GameHud } from './components/GameHud';
import { PauseMenu } from './components/PauseMenu';
import { KtaGameEngine } from './game/engine';
import { clearGameSave, loadGameSave, writeGameSave } from './game/saveSystem';

export function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [savedGame, setSavedGame] = useState<SavedGameState | null>(() => loadGameSave());
  const [activeCharacter, setActiveCharacter] = useState<CharacterProfile | null>(null);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HudSnapshot | null>(null);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<KtaGameEngine | null>(null);
  const pendingInitialSaveRef = useRef<SavedGameState | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    if (!activeCharacter || !canvasMountRef.current) return;

    const initialSave = pendingInitialSaveRef.current;
    pendingInitialSaveRef.current = null;

    const engine = new KtaGameEngine({
      container: canvasMountRef.current,
      character: activeCharacter,
      language,
      initialSave,
      onHudUpdate: (snapshot) => setHud(snapshot),
      onPauseRequest: () => {
        setPaused((prev) => {
          const next = !prev;
          engine.setPaused(next);
          return next;
        });
      },
      onAutoSave: (state) => {
        if (writeGameSave(state)) {
          setSavedGame(state);
        }
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // Intentionally keyed only on character/sessionSeed so language toggles do not tear down WebGL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCharacter, sessionSeed]);

  useEffect(() => {
    engineRef.current?.setLanguage(language);
  }, [language]);

  const handleResume = () => {
    setPaused(false);
    engineRef.current?.setPaused(false);
  };

  const handleOpenPause = () => {
    setPaused(true);
    engineRef.current?.setPaused(true);
  };

  const handleRestart = () => {
    pendingInitialSaveRef.current = null;
    setPaused(false);
    setSessionSeed((s) => s + 1);
  };

  const handleChangeCharacter = () => {
    if (engineRef.current) {
      const state = engineRef.current.exportSaveState();
      if (writeGameSave(state)) {
        setSavedGame(state);
      }
    }
    setPaused(false);
    setHud(null);
    setActiveCharacter(null);
  };

  const handleContinueSaved = () => {
    const latest = loadGameSave();
    if (!latest) return;
    const hero = CHARACTERS.find((c) => c.id === latest.characterId) ?? CHARACTERS[0];
    pendingInitialSaveRef.current = latest;
    setSavedGame(latest);
    setPaused(false);
    setActiveCharacter(hero);
  };

  const handleSaveNow = (): boolean => {
    if (!engineRef.current) return false;
    const state = engineRef.current.exportSaveState();
    const ok = writeGameSave(state);
    if (ok) setSavedGame(state);
    return ok;
  };

  const handleLoadSave = (): boolean => {
    const latest = loadGameSave();
    if (!latest || !engineRef.current) return false;
    setSavedGame(latest);
    engineRef.current.applySaveState(latest, true);
    return true;
  };

  const handleClearSave = () => {
    clearGameSave();
    setSavedGame(null);
  };

  if (!activeCharacter) {
    return (
      <IntroScreen
        language={language}
        savedGame={savedGame}
        onLanguageChange={setLanguage}
        onStartGame={(char) => {
          pendingInitialSaveRef.current = null;
          setPaused(false);
          setActiveCharacter(char ?? CHARACTERS[0]);
        }}
        onContinueSave={handleContinueSaved}
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-neutral-950 overflow-hidden">
      {/* Isolated WebGL mount container */}
      <div ref={canvasMountRef} className="w-full h-full touch-none select-none" />

      {hud && (
        <GameHud
          hud={hud}
          character={activeCharacter}
          language={language}
          onPause={handleOpenPause}
          onCycleWeapon={(dir: 1 | -1) => engineRef.current?.cycleWeapon(dir)}
          onCycleRadio={() => engineRef.current?.cycleRadio()}
          onCycleTime={() => engineRef.current?.cycleTimeOfDay()}
          onToggleBuddy={() => engineRef.current?.toggleBuddyFollow()}
          onRespawn={() => engineRef.current?.respawnPlayer()}
          onToggleVehicle={() => engineRef.current?.toggleVehicleEntry()}
          onStartMission={() => engineRef.current?.tryStartNearbyMission()}
          onBuyFood={() => engineRef.current?.tryBuyFood()}
          onTouchMove={(x, y, boost) => engineRef.current?.setTouchInput(x, y, boost)}
          onTouchFire={(firing) => engineRef.current?.setTouchFire(firing)}
          onTouchJumpOrDrift={(active) => engineRef.current?.setTouchJumpOrDrift(active)}
        />
      )}

      {paused && hud && (
        <PauseMenu
          hud={hud}
          language={language}
          hasSave={Boolean(savedGame)}
          onLanguageChange={setLanguage}
          onResume={handleResume}
          onChangeCharacter={handleChangeCharacter}
          onRestart={handleRestart}
          onSetTimeOfDay={(mode: TimeOfDay) => {
            engineRef.current?.setTimeOfDay(mode);
          }}
          onSaveNow={handleSaveNow}
          onLoadSave={handleLoadSave}
          onClearSave={handleClearSave}
        />
      )}
    </div>
  );
}

export default App;

