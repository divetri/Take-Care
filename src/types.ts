export interface Coordinates {
  lat: number;
  lng: number;
}

export type AppState = 'SETUP' | 'TRACKING' | 'ALARM';

export type ThemeType = 'dark' | 'light' | 'neon' | 'pastel';
export type AlarmModeType = 'ring' | 'vibrate' | 'ring-vibrate';
export type SoundPresetType = 'gentle' | 'urgent' | 'custom';
export type AlarmTriggerType = 'arrive' | '1_station' | '2_stations';

export interface AppSettings {
  theme: ThemeType;
  alarmMode: AlarmModeType;
  soundPreset: SoundPresetType;
  customSoundUrl: string | null;
  userName: string | null;
}

export interface TrackingMilestone {
  stationName: string;
  coordinates: Coordinates;
  isTransit: boolean;
  triggerType: AlarmTriggerType;
  originalDestName: string;
}
