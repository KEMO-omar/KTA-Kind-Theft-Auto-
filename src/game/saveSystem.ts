import { CharacterId, SavedGameState } from '../types/game';

const SAVE_STORAGE_KEY = 'kta_cairo_bay_save_v1';

export function calculateLevel(respect: number): number {
  return Math.max(1, 1 + Math.floor(respect / 300));
}

export function getLevelRankTitle(level: number, lang: 'ar' | 'en'): string {
  if (lang === 'en') {
    if (level >= 10) return 'Street Legend';
    if (level >= 6) return 'Bay Kingpin';
    if (level >= 3) return 'City Hustler';
    return 'Rookie';
  }
  if (level >= 10) return 'أسطورة الشارع';
  if (level >= 6) return 'معلم المدينة';
  if (level >= 3) return 'نجم الكورنيش';
  return 'مبتدئ في الحارة';
}

export function loadGameSave(): SavedGameState | null {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedGameState> & { characterId?: string };
    if (!parsed || typeof parsed.cash !== 'number') return null;

    // Gracefully migrate legacy 'nour' save IDs to 'aseela'
    let charId = (parsed.characterId ?? 'kimo') as string;
    if (charId === 'nour') charId = 'aseela';
    const validIds: CharacterId[] = ['kimo', 'aseela', 'abqarino', 'tarek'];
    const safeCharId: CharacterId = validIds.includes(charId as CharacterId) ? (charId as CharacterId) : 'kimo';

    const respect = Math.max(0, Number(parsed.respect) || 100);
    return {
      version: 1,
      characterId: safeCharId,
      cash: Math.max(0, Number(parsed.cash) || 600),
      respect,
      level: calculateLevel(respect),
      health: Math.max(10, Number(parsed.health) || 100),
      armor: Math.max(0, Math.min(100, Number(parsed.armor) || 50)),
      activeWeapon: parsed.activeWeapon ?? 'pistol',
      radioStation: parsed.radioStation ?? 'cairo',
      timeOfDay: parsed.timeOfDay ?? 'sunset',
      storyChapter: Math.max(1, Math.min(3, Number(parsed.storyChapter) || 1)),
      completedMissionIds: Array.isArray(parsed.completedMissionIds) ? parsed.completedMissionIds : [],
      playerX: typeof parsed.playerX === 'number' ? parsed.playerX : -28,
      playerZ: typeof parsed.playerZ === 'number' ? parsed.playerZ : -48,
      stats: {
        missionsDone: parsed.stats?.missionsDone ?? 0,
        carsDriven: parsed.stats?.carsDriven ?? 0,
        takedowns: parsed.stats?.takedowns ?? 0,
        stuntsLanded: parsed.stats?.stuntsLanded ?? 0,
      },
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeGameSave(state: SavedGameState): boolean {
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearGameSave(): void {
  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // ignore storage errors in restricted iframes
  }
}
