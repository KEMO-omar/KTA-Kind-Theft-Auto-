import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './data/characters';
import { CharacterProfile, HudSnapshot, Language, TimeOfDay, WeaponId } from './types/game';
import { IntroScreen } from './components/IntroScreen';
import { GameHud } from './components/GameHud';
import { PauseMenu } from './components/PauseMenu';
import { KtaGameEngine } from './game/engine';

export function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeCharacter, setActiveCharacter] = useState<CharacterProfile | null>(null);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HudSnapshot | null>(null);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<KtaGameEngine | null>(null);

  useEffect(() => {
    if (!activeCharacter || !canvasMountRef.current) return;

    const engine = new KtaGameEngine({
      container: canvasMountRef.current,
      character: activeCharacter,
      language,
      onHudUpdate: (snapshot) => setHud(snapshot),
      onPauseRequest: () => {
        setPaused((prev) => {
          const next = !prev;
          engine.setPaused(next);
          return next;
        });
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
    setPaused(false);
    setSessionSeed((s) => s + 1);
  };

  const handleChangeCharacter = () => {
    setPaused(false);
    setHud(null);
    setActiveCharacter(null);
  };

  if (!activeCharacter) {
    return (
      <IntroScreen
        language={language}
        onLanguageChange={setLanguage}
        onStartGame={(char) => {
          setPaused(false);
          setActiveCharacter(char ?? CHARACTERS[0]);
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-neutral-950 overflow-hidden">
      {/* Isolated WebGL mount container */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {hud && (
        <GameHud
          hud={hud}
          character={activeCharacter}
          language={language}
          onPause={handleOpenPause}
          onSelectWeapon={(w: WeaponId) => engineRef.current?.setWeapon(w)}
          onCycleWeapon={() => engineRef.current?.cycleWeapon()}
          onCycleRadio={() => engineRef.current?.cycleRadio()}
          onCycleTime={() => engineRef.current?.cycleTimeOfDay()}
          onRespawn={() => engineRef.current?.respawnPlayer()}
          onToggleVehicle={() => engineRef.current?.toggleVehicleEntry()}
          onStartMission={() => engineRef.current?.tryStartNearbyMission()}
          onTouchMove={(x, y, boost) => engineRef.current?.setTouchInput(x, y, boost)}
          onTouchFire={(firing) => engineRef.current?.setTouchFire(firing)}
          onTouchJumpOrDrift={(active) => engineRef.current?.setTouchJumpOrDrift(active)}
        />
      )}

      {paused && hud && (
        <PauseMenu
          hud={hud}
          language={language}
          onLanguageChange={setLanguage}
          onResume={handleResume}
          onChangeCharacter={handleChangeCharacter}
          onRestart={handleRestart}
          onSetTimeOfDay={(mode: TimeOfDay) => {
            engineRef.current?.setTimeOfDay(mode);
          }}
        />
      )}
    </div>
  );
}

export default App;
