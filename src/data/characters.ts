import { CharacterProfile } from '../types/game';
import introSkylineImg from '../assets/images/kta_intro_skyline_1795031533279.jpg';
import kimoPortraitImg from '../assets/images/kta_char_kimo_1795031533338.jpg';
import nourPortraitImg from '../assets/images/kta_char_nour_1795031534468.jpg';
import tarekPortraitImg from '../assets/images/kta_char_tarek_1795031534961.jpg';

export const INTRO_BACKDROP_URL = introSkylineImg;

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'kimo',
    name: { en: 'Kimo', ar: 'كيمو' },
    title: { en: 'Street Driver', ar: 'سواق الشوارع' },
    bio: {
      en: 'Born behind the wheel on the coastal boulevard. Turns every tight corner into a highlight reel.',
      ar: 'اتولد ورا الدريكسيون على الكورنيش. بيحول كل ملف ضيق لعرض عالمي.',
    },
    perk: {
      en: '+18% Sprint & Vehicle Top Speed',
      ar: '+18% سرعة جري وأقصى سرعة للعربيات',
    },
    portraitUrl: kimoPortraitImg,
    accentHex: '#F59E0B',
    outfitColors: {
      jacket: 0xd95f18,
      shirt: 0x18181b,
      pants: 0x334155,
      skin: 0xd49a6a,
      hair: 0x1a1512,
      sunglasses: true,
    },
    stats: {
      speedMultiplier: 1.18,
      handlingMultiplier: 1.05,
      maxHealth: 100,
      cashBonus: 1.0,
    },
    displayStats: {
      speed: 94,
      style: 88,
      toughness: 76,
    },
  },
  {
    id: 'nour',
    name: { en: 'Nour', ar: 'نور' },
    title: { en: 'Night Runner', ar: 'ملكة الليل' },
    bio: {
      en: 'Courier queen of Neon Plaza. Knows every shortcut, stunt ramp, and midnight radio frequency.',
      ar: 'ملكة التوصيل في ساحة النيون. حافظة كل اختصار وكل رامب في المدينة.',
    },
    perk: {
      en: '+25% Drift Grip & Handling Precision',
      ar: '+25% تحكم وثبات في الدرفت والمنعطفات',
    },
    portraitUrl: nourPortraitImg,
    accentHex: '#14B8A6',
    outfitColors: {
      jacket: 0x0d9488,
      shirt: 0x111827,
      pants: 0x1e293b,
      skin: 0xc68652,
      hair: 0x111827,
      sunglasses: false,
    },
    stats: {
      speedMultiplier: 1.08,
      handlingMultiplier: 1.25,
      maxHealth: 100,
      cashBonus: 1.15,
    },
    displayStats: {
      speed: 86,
      style: 96,
      toughness: 78,
    },
  },
  {
    id: 'tarek',
    name: { en: 'Tarek', ar: 'طارق' },
    title: { en: 'City Fixer', ar: 'العمده' },
    bio: {
      en: 'Calm under pressure with pockets full of favors. When things get loud, Tarek handles business.',
      ar: 'هادي وقت الأزمات وكله واجب وجدعنة. لما الدنيا تسخن، طارق بيخلصها.',
    },
    perk: {
      en: '+40 Max Health & +25% Mission Cash',
      ar: '+40 صحة إضافية و +25% فلوس من المهمات',
    },
    portraitUrl: tarekPortraitImg,
    accentHex: '#3B82F6',
    outfitColors: {
      jacket: 0x1e3a5f,
      shirt: 0xf8fafc,
      pants: 0x0f172a,
      skin: 0xd9a273,
      hair: 0x1c1917,
      sunglasses: false,
    },
    stats: {
      speedMultiplier: 1.0,
      handlingMultiplier: 1.0,
      maxHealth: 140,
      cashBonus: 1.25,
    },
    displayStats: {
      speed: 78,
      style: 90,
      toughness: 96,
    },
  },
];
