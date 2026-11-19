import { Language, RadioStationId, TimeOfDay, WeaponId } from '../types/game';

export const STRINGS: Record<Language, {
  presents: string;
  tagline: string;
  enterCity: string;
  continueSaved: string;
  savedInfoPrefix: string;
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
  levelLabel: string;
  wanted: string;
  onFoot: string;
  enterVehicleHint: string;
  exitVehicleHint: string;
  startMissionHint: string;
  buyFoodHint: string;
  pauseTitle: string;
  resume: string;
  changeCharacter: string;
  restartCity: string;
  saveNow: string;
  loadSave: string;
  clearSave: string;
  savedToast: string;
  loadedToast: string;
  clearedToast: string;
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
  buddyCall: string;
  buddyWithYou: string;
  camBtn: string;
  aimBtn: string;
  insideLabel: string;
  camModeNames: Record<'chase' | 'wide' | 'hood', string>;
}> = {
  ar: {
    presents: 'ستوديو صن هيفن ومصر يقدم',
    tagline: 'قصة أصيلة ومهام عبقرينو، مباني تتدخل من جوا، بيت للبطل، محلات وبيع وشرا، وأداء صاروخي 60 فريم',
    enterCity: 'ابدأ مغامرة جديدة',
    continueSaved: 'كمل لعبك المحفوظ',
    savedInfoPrefix: 'مستوى',
    skipIntro: 'انزل الشارع علطول',
    chooseProtagonist: 'اختار بطل الشارع',
    selectAndPlay: 'توكل على الله وانزل',
    statSpeed: 'السرعة',
    statStyle: 'الشياكة',
    statToughness: 'الجدعنة والتحمل',
    perkLabel: 'الميزة الخاصة',
    soundOn: 'الصوت شغال',
    soundOff: 'مكتوم',
    respect: 'الهيبة',
    levelLabel: 'مستوى',
    wanted: 'المطلوب',
    onFoot: 'ماشي على رجلك',
    enterVehicleHint: 'دوس F عشان تركب',
    exitVehicleHint: 'F: انزل · Space: درفت · C: زاوية الكاميرا',
    startMissionHint: 'دوس E أو المس هنا عشان تبدأ',
    buyFoodHint: 'دوس E أو ادخل جوا المحل',
    pauseTitle: 'القائمة والحفظ',
    resume: 'كمل اللعب',
    changeCharacter: 'غير الشخصية',
    restartCity: 'عيد ضبط المدينة',
    saveNow: 'احفظ تقدمك يدوي',
    loadSave: 'رجع آخر حفظ',
    clearSave: 'امسح الحفظ',
    savedToast: 'تسلم يا نجم! تم حفظ تقدمك وفلوسك.',
    loadedToast: 'أهلاً بيك تاني! تم تحميل آخر حفظ.',
    clearedToast: 'تم مسح ملف الحفظ القديم.',
    cityMap: 'خريطة المدينة والبيوت والمحلات',
    controlsGuide: 'أزرار التحكم',
    timeOfDayLabel: 'جو المدينة',
    timeNames: {
      sunset: 'غروب دهبي',
      day: 'ضهر مشمس',
      night: 'ليل وأضواء',
    },
    radioNames: {
      off: 'الراديو مقفول',
      cairo: 'مزيكا ليالي القاهرة',
      synthwave: 'راديو الكورنيش FM',
      funk: 'دبكة وفانك الشارع',
    },
    weaponNames: {
      melee: '1 · شومة الشارع',
      pistol: '2 · طبنجة 9 ملم',
      smg: '3 · رشاش سريع',
      shotgun: '4 · خرطوش شوتجن',
      rifle: '5 · بندقية آلية',
      rpg: '6 · قاذف صواريخ RPG',
    },
    weaponShort: {
      melee: 'شومة',
      pistol: 'طبنجة',
      smg: 'رشاش',
      shotgun: 'شوتجن',
      rifle: 'آلي',
      rpg: 'RPG',
    },
    controlsList: [
      { key: 'W A S D / الجويستيك', desc: 'حركة ناعمة على رجلك أو قيادة العربيات' },
      { key: 'Shift', desc: 'جري سريع / نيترو في العربية' },
      { key: 'Space', desc: 'نط / فرملة يد ودرفت واقعي' },
      { key: 'F', desc: 'ركوب أو نزول من أي عربية أو موتوسيكل' },
      { key: 'E / الكاونتر', desc: 'تتفاعل جوا بيتك أو تشتري من المحلات أو تبدأ مهمات' },
      { key: 'G', desc: 'تنده صاحبك عبقرينو يحارب معاك أو يستناك' },
      { key: 'كليك يمين / V', desc: 'تصويب دقيق (Aim Zoom) وتثبيت على الهدف' },
      { key: 'كليك شمال / J / ضرب', desc: 'تضرب نار على علامة التصويب' },
      { key: 'سحب الشاشة / Q / C', desc: 'لف الكاميرا 360° وتغيير زاوية السواقة (C)' },
      { key: 'R / H / T / P', desc: 'الراديو · الكلاكس · وقت النهار · القائمة والحفظ' },
    ],
    wastedTitle: 'انتهيت يا بطل',
    wastedSub: 'الإسعاف لحقتك ورجعتك قدام بيتك، بس أوعى تسيب حقك!',
    respawnBtn: 'ارجع الشارع تاني',
    missionsCompleted: 'المهمات',
    carsDriven: 'العربيات',
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
    buddyCall: 'انده عبقرينو',
    buddyWithYou: 'عبقرينو معاك',
    camBtn: 'الزاوية',
    aimBtn: 'تصويب',
    insideLabel: 'أنت جوا:',
    camModeNames: {
      chase: 'زاوية قريبة',
      wide: 'زاوية بانوراما',
      hood: 'منظور الكبوت',
    },
  },
  en: {
    presents: 'Sunhaven & Cairo Streets Present',
    tagline: 'Enterable Buildings & Safehouse, Shop Vendors, Smart Aiming, Smooth Driving Camera & 60+ FPS Action',
    enterCity: 'New Adventure',
    continueSaved: 'Continue Saved Game',
    savedInfoPrefix: 'Lv.',
    skipIntro: 'Quick Play',
    chooseProtagonist: 'Select Street Hero',
    selectAndPlay: 'Hit the Streets',
    statSpeed: 'Speed',
    statStyle: 'Style',
    statToughness: 'Toughness',
    perkLabel: 'Signature Perk',
    soundOn: 'Audio On',
    soundOff: 'Muted',
    respect: 'Respect',
    levelLabel: 'Lv',
    wanted: 'Wanted',
    onFoot: 'On Foot',
    enterVehicleHint: 'F to drive',
    exitVehicleHint: 'F: Exit · Space: Drift · C: Camera Angle',
    startMissionHint: 'Press E or Tap to Start',
    buyFoodHint: 'Press E or Walk Inside',
    pauseTitle: 'Menu & Save',
    resume: 'Resume Game',
    changeCharacter: 'Switch Character',
    restartCity: 'Reset City',
    saveNow: 'Save Progress',
    loadSave: 'Load Last Save',
    clearSave: 'Delete Save',
    savedToast: 'Progress saved to browser storage!',
    loadedToast: 'Saved progress loaded!',
    clearedToast: 'Saved data cleared.',
    cityMap: 'City Radar, Safehouse & Shops',
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
      funk: 'Corniche Street Funk',
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
      pistol: '9mm',
      smg: 'SMG',
      shotgun: 'Shotgun',
      rifle: 'Rifle',
      rpg: 'RPG',
    },
    controlsList: [
      { key: 'W A S D / Joystick', desc: 'Smooth movement on foot or driving' },
      { key: 'Shift', desc: 'Sprint on foot / Nitro boost' },
      { key: 'Space', desc: 'Jump on foot / Handbrake drift' },
      { key: 'F', desc: 'Enter or exit nearby vehicles' },
      { key: 'E / Counter', desc: 'Interact inside safehouse, shops, or start missions' },
      { key: 'G', desc: 'Call or dismiss Abqarino co-op buddy' },
      { key: 'Right-Click / V', desc: 'Precision Aim Zoom & target lock' },
      { key: 'Click / J / Fire', desc: 'Shoot toward crosshair reticle' },
      { key: 'Drag / Q / C', desc: 'Orbit 360° & cycle driving camera angle (C)' },
      { key: 'R / H / T / P', desc: 'Radio · Horn · Time · Menu & Save' },
    ],
    wastedTitle: 'WASTED',
    wastedSub: 'Medics dropped you back near your safehouse.',
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
    carBtn: 'RIDE',
    exitBtn: 'EXIT',
    hornBtn: 'HORN',
    buddyCall: 'Call Abqarino',
    buddyWithYou: 'Abqarino Active',
    camBtn: 'ANGLE',
    aimBtn: 'AIM',
    insideLabel: 'Inside:',
    camModeNames: {
      chase: 'Chase Cam',
      wide: 'Wide Cam',
      hood: 'Hood Cam',
    },
  },
};
