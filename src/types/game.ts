export type Language = 'ar' | 'en';

export type TimeOfDay = 'sunset' | 'day' | 'night';

export type VehicleKind = 'sports' | 'muscle' | 'police' | 'taxi' | 'suv' | 'bike';

export type WeaponId = 'melee' | 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'rpg';

export type RadioStationId = 'off' | 'cairo' | 'synthwave' | 'funk';

export type CharacterId = 'kimo' | 'aseela' | 'abqarino' | 'tarek';

export interface CharacterProfile {
  id: CharacterId;
  name: { en: string; ar: string };
  title: { en: string; ar: string };
  bio: { en: string; ar: string };
  perk: { en: string; ar: string };
  portraitUrl: string;
  accentHex: string;
  outfitColors: {
    jacket: number;
    shirt: number;
    pants: number;
    skin: number;
    hair: number;
    sunglasses: boolean;
  };
  stats: {
    speedMultiplier: number;
    handlingMultiplier: number;
    maxHealth: number;
    cashBonus: number;
    damageMultiplier?: number;
  };
  displayStats: {
    speed: number;
    style: number;
    toughness: number;
  };
}

export interface MissionInfo {
  id: string;
  title: { en: string; ar: string };
  objective: { en: string; ar: string };
  progress: number;
  total: number;
  timeLeft: number;
  rewardCash: number;
  isStory?: boolean;
  isCoop?: boolean;
}

export type DriveCameraMode = 'chase' | 'wide' | 'hood';

export interface ShopOption {
  id: string;
  label: { en: string; ar: string };
  cost: number;
  effectLabel: { en: string; ar: string };
}

export interface InteriorInteractPrompt {
  shopId: string;
  shopName: { en: string; ar: string };
  roleTitle: { en: string; ar: string };
  isSafehouse?: boolean;
  options: ShopOption[];
}

export interface MinimapBlip {
  x: number;
  z: number;
  type:
    | 'vehicle'
    | 'police'
    | 'mission'
    | 'pickup'
    | 'target'
    | 'hostile'
    | 'story'
    | 'food'
    | 'buddy'
    | 'coop'
    | 'house'
    | 'shop';
}

export interface DialogueSubtitle {
  speaker: string;
  text: string;
  color: string;
}

export interface HudSnapshot {
  health: number;
  maxHealth: number;
  armor: number;
  cash: number;
  respect: number;
  level: number;
  wantedStars: number;
  inVehicle: boolean;
  vehicleName: string;
  vehicleKind: VehicleKind | null;
  vehicleSpeedKmh: number;
  vehicleHp: number;
  activeWeapon: WeaponId;
  radioStation: RadioStationId;
  timeOfDay: TimeOfDay;
  storyChapter: number;
  buddyActive: boolean;
  completedMissionIds: string[];
  activeMission: MissionInfo | null;
  availableMissionPrompt: {
    title: { en: string; ar: string };
    reward: number;
    isStory?: boolean;
    isCoop?: boolean;
  } | null;
  nearbyRestaurantPrompt: { name: { en: string; ar: string }; cost: number; heal: number } | null;
  nearbyVehiclePrompt: string | null;
  insideBuildingName: { en: string; ar: string } | null;
  interiorPrompt: InteriorInteractPrompt | null;
  aimLocked: boolean;
  aimTargetName: string | null;
  isAiming: boolean;
  driveCamMode: DriveCameraMode;
  bannerMessage: { text: string; tone: 'gold' | 'info' | 'alert' | 'success' } | null;
  subtitle: DialogueSubtitle | null;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  blips: MinimapBlip[];
  buildingsForMap: Array<{ x: number; z: number; w: number; d: number; isHouse?: boolean }>;
  isWasted: boolean;
  stats: {
    missionsDone: number;
    carsDriven: number;
    takedowns: number;
    stuntsLanded: number;
  };
}

export interface SavedGameState {
  version: number;
  characterId: CharacterId;
  cash: number;
  respect: number;
  level: number;
  health: number;
  armor: number;
  activeWeapon: WeaponId;
  radioStation: RadioStationId;
  timeOfDay: TimeOfDay;
  storyChapter: number;
  completedMissionIds: string[];
  playerX: number;
  playerZ: number;
  stats: HudSnapshot['stats'];
  savedAt: number;
}
