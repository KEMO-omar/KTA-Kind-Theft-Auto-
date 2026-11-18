import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Globe, ChevronRight, Shield, Zap, Sparkles, PlayCircle } from 'lucide-react';
import { CHARACTERS, INTRO_BACKDROP_URL } from '../data/characters';
import { STRINGS } from '../data/i18n';
import { CharacterProfile, Language, SavedGameState } from '../types/game';
import { soundEngine } from '../game/audio';

interface IntroScreenProps {
  language: Language;
  savedGame: SavedGameState | null;
  onLanguageChange: (lang: Language) => void;
  onStartGame: (character: CharacterProfile) => void;
  onContinueSave: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  language,
  savedGame,
  onLanguageChange,
  onStartGame,
  onContinueSave,
}) => {
  const [stage, setStage] = useState<'cinematic' | 'select'>('cinematic');
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<CharacterProfile['id']>(savedGame?.characterId ?? 'kimo');
  const [muted, setMuted] = useState(soundEngine.isMuted());

  const t = STRINGS[language];
  const isRtl = language === 'ar';

  const slides = [
    { image: INTRO_BACKDROP_URL, caption: t.presents },
    ...CHARACTERS.map((char) => ({
      image: char.portraitUrl,
      caption: `${char.name[language]} · ${char.title[language]}`,
    })),
  ];

  const savedHero = savedGame
    ? CHARACTERS.find((c) => c.id === savedGame.characterId) ?? CHARACTERS[0]
    : null;

  useEffect(() => {
    if (stage !== 'cinematic') return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [stage, slides.length]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.unlock();
      soundEngine.playIntroTheme();
    }
  };

  const handleEnterSelect = () => {
    soundEngine.unlock();
    if (!muted) soundEngine.playIntroTheme();
    setStage('select');
  };

  const selectedChar = CHARACTERS.find((c) => c.id === selectedId) ?? CHARACTERS[0];

  if (stage === 'cinematic') {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full h-full bg-neutral-950 text-white overflow-hidden flex flex-col justify-between"
      >
        {/* Ken Burns Artwork Backdrop */}
        {slides.map((s, idx) => (
          <div
            key={s.image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === slideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={s.image}
              alt={s.caption}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center animate-ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/60" />
          </div>
        ))}

        {/* Top Bar: Studio Credit + Language & Audio */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <div className="text-sm font-semibold tracking-wide text-amber-400">
            {t.presents}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-neutral-900/90 hover:bg-neutral-800 border border-white/15 rounded-lg transition-colors whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'عربي' : 'English'}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-neutral-900/90 hover:bg-neutral-800 border border-white/15 rounded-lg transition-colors whitespace-nowrap"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-neutral-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{muted ? t.soundOff : t.soundOn}</span>
            </button>
          </div>
        </header>

        {/* Center Hero Logo & CTA */}
        <main className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
          <div className="animate-logo-reveal mb-5">
            <img
              src="/logo.png"
              alt="Kind Theft Auto"
              className="w-60 sm:w-80 md:w-96 h-auto mx-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
            />
          </div>
          <p className="text-base sm:text-lg text-neutral-200 font-medium max-w-xl mb-8 text-balance">
            {t.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {savedGame && savedHero && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  onContinueSave();
                }}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-display text-base sm:text-lg tracking-wide font-bold rounded-lg transition-colors shadow-lg cursor-pointer whitespace-nowrap"
              >
                <PlayCircle className="w-5 h-5" />
                <span>
                  {t.continueSaved} ({savedHero.name[language]} · {t.savedInfoPrefix} {savedGame.level})
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleEnterSelect}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display text-lg tracking-wide font-bold rounded-lg transition-colors shadow-lg cursor-pointer whitespace-nowrap"
            >
              <span>{t.enterCity}</span>
              <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                onStartGame(selectedChar);
              }}
              className="px-6 py-3.5 bg-neutral-900/90 hover:bg-neutral-800 text-white border border-white/20 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.skipIntro}
            </button>
          </div>
        </main>

        {/* Bottom Slide Caption & Progress Dots */}
        <footer className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10 text-xs text-neutral-300">
          <span>{slides[slideIndex].caption}</span>
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.image}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setSlideIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === slideIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full h-full bg-neutral-950 text-white overflow-y-auto flex flex-col"
    >
      {/* Subtle atmospheric backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <img
          src={INTRO_BACKDROP_URL}
          alt="Sunhaven Bay"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/90 via-neutral-950/85 to-neutral-950" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 border-b border-white/10">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="KTA" className="h-10 w-auto" />
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-white">
            {t.chooseProtagonist}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-white/15 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'عربي' : 'English'}</span>
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-white/15 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-neutral-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            <span>{muted ? t.soundOff : t.soundOn}</span>
          </button>
        </div>
      </header>

      {/* Character Roster Grid */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 4 Character Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHARACTERS.map((char) => {
            const active = char.id === selectedId;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => setSelectedId(char.id)}
                className={`group relative rounded-xl overflow-hidden border text-start transition-transform duration-200 cursor-pointer flex flex-col justify-end min-h-[220px] sm:min-h-[360px] ${
                  active
                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.01]'
                    : 'border-white/15 hover:border-white/35'
                }`}
              >
                <img
                  src={char.portraitUrl}
                  alt={char.name[language]}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                <div className="relative z-10 p-3">
                  <div className="text-[11px] font-semibold text-amber-400 mb-0.5 leading-tight">
                    {char.title[language]}
                  </div>
                  <div className="font-display text-lg sm:text-xl font-bold text-white">
                    {char.name[language]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Character Inspector */}
        <div className="lg:col-span-5 bg-neutral-900/90 border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="text-xs font-semibold text-amber-400 mb-1">
              {selectedChar.title[language]}
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              {selectedChar.name[language]}
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed mb-6">
              {selectedChar.bio[language]}
            </p>

            {/* Perk Box */}
            <div className="p-3.5 rounded-lg bg-neutral-950 border border-white/10 mb-6">
              <div className="text-xs text-neutral-400 mb-1">{t.perkLabel}</div>
              <div className="text-sm font-semibold text-amber-300">
                {selectedChar.perk[language]}
              </div>
            </div>

            {/* Stat Bars */}
            <div className="space-y-3.5">
              {[
                { label: t.statSpeed, val: selectedChar.displayStats.speed, icon: Zap, color: 'bg-amber-400' },
                { label: t.statStyle, val: selectedChar.displayStats.style, icon: Sparkles, color: 'bg-teal-400' },
                { label: t.statToughness, val: selectedChar.displayStats.toughness, icon: Shield, color: 'bg-sky-400' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                      <stat.icon className="w-3.5 h-3.5 text-neutral-400" />
                      {stat.label}
                    </span>
                    <span className="font-hud tabular-nums text-white font-semibold">{stat.val}/100</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} transition-all duration-300`}
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                onStartGame(selectedChar);
              }}
              className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display text-lg font-bold tracking-wide rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.selectAndPlay}</span>
              <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            {savedGame && savedHero && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  onContinueSave();
                }}
                className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-teal-300 border border-teal-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>
                  {t.continueSaved} · {savedHero.name[language]} ({t.savedInfoPrefix} {savedGame.level} · ${savedGame.cash.toLocaleString()})
                </span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
