import { Language, RadioStationId, TimeOfDay, WeaponId } from '../types/game';

export const STRINGS: Record<Language, {
  presents: string;
  tagline: string;
  enterCity: string;
  skipIntro: string;
  chooseProtagonist: string;
  selectAndPlay: string;
  statSpeed: string;
  statStyle: string;
  statToughness: string;
  perkLabel: string;
  soundOn: string;
  soundOff: string;
  respect: string;
  wanted: string;
  onFoot: string;
  enterVehicleHint: string;
  exitVehicleHint: string;
  startMissionHint: string;
  pauseTitle: string;
  resume: string;
  changeCharacter: string;
  restartCity: string;
  cityMap: string;
  controlsGuide: string;
  timeOfDayLabel: string;
  timeNames: Record<TimeOfDay, string>;
  radioNames: Record<RadioStationId, string>;
  weaponNames: Record<WeaponId, string>;
  weaponShort: Record<WeaponId, string>;
  controlsList: Array<{ key: string; desc: string }>;
  wastedTitle: string;
  wastedSub: string;
  respawnBtn: string;
  missionsCompleted: string;
  carsDriven: string;
  takedowns: string;
  stuntsLanded: string;
  kmh: string;
  touchControls: string;
  fireBtn: string;
  jumpBtn: string;
  driftBtn: string;
  nitroBtn: string;
  carBtn: string;
  exitBtn: string;
  hornBtn: string;
}> = {
  en: {
    presents: 'Sunhaven Interactive Presents',
    tagline: 'Open Streets, Custom Rides, Heavy Arsenal & Live City Action',
    enterCity: 'Play Now',
    skipIntro: 'Skip Intro',
    chooseProtagonist: 'Select Your Character',
    selectAndPlay: 'Drop Into Sunhaven Bay',
    statSpeed: 'Speed',
    statStyle: 'Style',
    statToughness: 'Toughness',
    perkLabel: 'Signature Perk',
    soundOn: 'Audio On',
    soundOff: 'Muted',
    respect: 'Respect',
    wanted: 'Wanted',
    onFoot: 'On Foot',
    enterVehicleHint: 'Press F to drive',
    exitVehicleHint: 'F: Exit · Space: Drift · H: Horn',
    startMissionHint: 'Press E to accept mission',
    pauseTitle: 'Menu',
    resume: 'Resume Game',
    changeCharacter: 'Switch Character',
    restartCity: 'Reset City',
    cityMap: 'Sunhaven Bay Radar',
    controlsGuide: 'Controls',
    timeOfDayLabel: 'Atmosphere',
    timeNames: {
      sunset: 'Golden Sunset',
      day: 'Sunny Noon',
      night: 'Neon Night',
    },
    radioNames: {
      off: 'Radio Off',
      cairo: 'Cairo Nights Beat',
      synthwave: 'Sunset Synth FM',
      funk: 'Bay Street Funk',
    },
    weaponNames: {
      melee: '1 · Street Bat',
      pistol: '2 · 9mm Pistol',
      smg: '3 · Micro SMG',
      shotgun: '4 · Pump Shotgun',
      rifle: '5 · Carbine Rifle',
      rpg: '6 · RPG Launcher',
    },
    weaponShort: {
      melee: 'Bat',
      pistol: 'Pistol',
      smg: 'SMG',
      shotgun: 'Shotgun',
      rifle: 'Rifle',
      rpg: 'RPG',
    },
    controlsList: [
      { key: 'W A S D / Joystick', desc: 'Move character or drive vehicle' },
      { key: 'Shift', desc: 'Sprint on foot / Nitro Boost in car' },
      { key: 'Space', desc: 'Jump on foot / Handbrake drift in car' },
      { key: 'F', desc: 'Enter or exit any nearby car or bike' },
      { key: 'E', desc: 'Start mission inside glowing ring' },
      { key: 'Click / J / Fire', desc: 'Attack or fire equipped weapon' },
      { key: '1 - 6', desc: 'Switch Bat, Pistol, SMG, Shotgun, Rifle, RPG' },
      { key: 'Drag / Q', desc: 'Rotate 3D camera angle' },
      { key: 'R / H / T', desc: 'Radio · Horn/Siren · Time of Day' },
      { key: 'P / Esc', desc: 'Open City Menu & Radar Map' },
    ],
    wastedTitle: 'WASTED',
    wastedSub: 'Sunhaven General patched you up and sent you back to the block.',
    respawnBtn: 'Back to the Streets',
    missionsCompleted: 'Missions',
    carsDriven: 'Vehicles',
    takedowns: 'Takedowns',
    stuntsLanded: 'Stunts',
    kmh: 'KM/H',
    touchControls: 'Touch',
    fireBtn: 'FIRE',
    jumpBtn: 'JUMP',
    driftBtn: 'DRIFT',
    nitroBtn: 'NITRO',
    carBtn: 'ENTER',
    exitBtn: 'EXIT',
    hornBtn: 'HORN',
  },
  ar: {
    presents: 'ستوديو صن هيفن يقدم',
    tagline: 'مدينة مفتوحة، عربيات متظبطة، أسلحة تقيلة، وأكشن في كل شارع',
    enterCity: 'العب دلوقتي',
    skipIntro: 'تخطي الانترو',
    chooseProtagonist: 'اختار شخصيتك',
    selectAndPlay: 'انزل المدينة',
    statSpeed: 'السرعة',
    statStyle: 'الشياكة',
    statToughness: 'التحمل',
    perkLabel: 'الميزة الخاصة',
    soundOn: 'الصوت شغال',
    soundOff: 'مكتوم',
    respect: 'الهيبة',
    wanted: 'المطلوب',
    onFoot: 'على رجلك',
    enterVehicleHint: 'اضغط F عشان تركب',
    exitVehicleHint: 'F: نزول · Space: درفت · H: كلاكس',
    startMissionHint: 'اضغط E عشان تبدأ المهمة',
    pauseTitle: 'القائمة',
    resume: 'كمل اللعب',
    changeCharacter: 'غير الشخصية',
    restartCity: 'إعادة ضبط المدينة',
    cityMap: 'خريطة صن هيفن باي',
    controlsGuide: 'التحكم',
    timeOfDayLabel: 'الوقت والجو',
    timeNames: {
      sunset: 'غروب دهبي',
      day: 'ضهر مشمس',
      night: 'ليل نيون',
    },
    radioNames: {
      off: 'الراديو مقفول',
      cairo: 'إيقاع ليالي القاهرة',
      synthwave: 'راديو الغروب FM',
      funk: 'فانك الكورنيش',
    },
    weaponNames: {
      melee: '1 · مضرب شوارع',
      pistol: '2 · مسدس 9 ملم',
      smg: '3 · رشاش خفيف',
      shotgun: '4 · شوتجن',
      rifle: '5 · بندقية آلية',
      rpg: '6 · قاذف صواريخ RPG',
    },
    weaponShort: {
      melee: 'مضرب',
      pistol: 'مسدس',
      smg: 'رشاش',
      shotgun: 'شوتجن',
      rifle: 'بندقية',
      rpg: 'RPG',
    },
    controlsList: [
      { key: 'W A S D / الجويستيك', desc: 'الحركة على رجلك أو سواقة العربية' },
      { key: 'Shift', desc: 'جري سريع / نيترو في العربية' },
      { key: 'Space', desc: 'نط / فرامل يد ودرفت' },
      { key: 'F', desc: 'ركوب أو نزول من أي عربية أو موتوسيكل' },
      { key: 'E', desc: 'ابدأ المهمة جوا الدائرة المضيئة' },
      { key: 'كليك / J / ضرب', desc: 'ضرب أو إطلاق نار بالسلاح المختار' },
      { key: '1 - 6', desc: 'تبديل الأسلحة (مضرب، مسدس، رشاش، شوتجن، آلي، RPG)' },
      { key: 'سحب الشاشة / Q', desc: 'تدوير الكاميرا 360 درجة' },
      { key: 'R / H / T', desc: 'تغيير الراديو · كلاكس · تغيير الوقت' },
      { key: 'P / Esc', desc: 'فتح القائمة والخريطة الكبيرة' },
    ],
    wastedTitle: 'انتهيت',
    wastedSub: 'مستشفى صن هيفن لحقتك ورجعتك الشارع من تاني.',
    respawnBtn: 'ارجع الشارع',
    missionsCompleted: 'المهمات',
    carsDriven: 'المركبات',
    takedowns: 'الإسقاطات',
    stuntsLanded: 'النطات',
    kmh: 'كم/س',
    touchControls: 'اللمس',
    fireBtn: 'ضرب',
    jumpBtn: 'نط',
    driftBtn: 'درفت',
    nitroBtn: 'نيترو',
    carBtn: 'اركب',
    exitBtn: 'انزل',
    hornBtn: 'كلاكس',
  },
};
