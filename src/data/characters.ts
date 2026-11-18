import { CharacterProfile } from '../types/game';
import introSkylineImg from '../assets/images/kta_intro_skyline_1795031533279.jpg';
import kimoPortraitImg from '../assets/images/kta_char_kimo_1795031533338.jpg';
import aseelaPortraitImg from '../assets/images/kta_char_nour_1795031534468.jpg';
import abqarinoPortraitImg from '../assets/images/kta_char_abqarino_1795035899450.jpg';
import tarekPortraitImg from '../assets/images/kta_char_tarek_1795031534961.jpg';

export const INTRO_BACKDROP_URL = introSkylineImg;

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'kimo',
    name: { en: 'Kimo', ar: 'كيمو' },
    title: { en: 'Street Driver', ar: 'وحش الدريكسيون' },
    bio: {
      en: 'Born behind the wheel on the coastal boulevard. Turns every tight corner into a highlight reel.',
      ar: 'متربي ورا الدريكسيون على الكورنيش. بيحول كل ملف ضيق لعرض عالمي وجدعنته سابقة في كل حتة.',
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
      damageMultiplier: 1.0,
    },
    displayStats: {
      speed: 94,
      style: 88,
      toughness: 78,
    },
  },
  {
    id: 'aseela',
    name: { en: 'Aseela', ar: 'أصيلة' },
    title: { en: 'Queen of the Corniche', ar: 'برنسيسة الكورنيش' },
    bio: {
      en: 'Fearless driver and owner of the Corniche Café. Knows every alley, ramp, and rival move in the city.',
      ar: 'بنت بلد جدعة وصاحبة كافيه الكورنيش. حافظة كل شارع وزقاق ورامب في المدينة وقلبها ميت.',
    },
    perk: {
      en: '+25% Drift Grip & +15% Mission Cash',
      ar: '+25% ثبات في الدرفت و +15% فلوس مهام',
    },
    portraitUrl: aseelaPortraitImg,
    accentHex: '#EC4899',
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
      maxHealth: 105,
      cashBonus: 1.15,
      damageMultiplier: 1.05,
    },
    displayStats: {
      speed: 88,
      style: 97,
      toughness: 80,
    },
  },
  {
    id: 'abqarino',
    name: { en: 'Abqarino', ar: 'عبقرينو' },
    title: { en: 'Tech Genius & Co-op Partner', ar: 'عبقرينو الهاكر وصاحبك' },
    bio: {
      en: 'Your loyal best friend and tech mastermind. Hacks traffic, drops custom firepower, and always watches your back.',
      ar: 'صاحبك الأنتيم وعبقري التكنولوجيا في الشارع. بيهكر الإشارات، يزود قوة سلاحك، وعمره ما يسيبك في زنقة.',
    },
    perk: {
      en: '+30% Weapon Power & +20% Cash Bonus',
      ar: '+30% قوة الأسلحة و +20% مكافأة فلوس',
    },
    portraitUrl: abqarinoPortraitImg,
    accentHex: '#14B8A6',
    outfitColors: {
      jacket: 0x0f766e,
      shirt: 0xf59e0b,
      pants: 0x1e293b,
      skin: 0xd49a6a,
      hair: 0x111827,
      sunglasses: true,
    },
    stats: {
      speedMultiplier: 1.1,
      handlingMultiplier: 1.15,
      maxHealth: 115,
      cashBonus: 1.2,
      damageMultiplier: 1.3,
    },
    displayStats: {
      speed: 87,
      style: 95,
      toughness: 86,
    },
  },
  {
    id: 'tarek',
    name: { en: 'Tarek', ar: 'طارق العمدة' },
    title: { en: 'City Fixer', ar: 'المعلم والعمده' },
    bio: {
      en: 'Calm under pressure with pockets full of favors. When things get loud, Tarek handles business.',
      ar: 'كبير الحارة ورايق وقت الأزمات وكله واجب وجدعنة. لما الدنيا تسخن، العمدة بيخلصها في ثانية.',
    },
    perk: {
      en: '+40 Max Health & +25% Mission Cash',
      ar: '+40 صحة زيادة و +25% أرباح المهمات',
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
      damageMultiplier: 1.15,
    },
    displayStats: {
      speed: 78,
      style: 90,
      toughness: 98,
    },
  },
];
