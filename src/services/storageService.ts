import { UserProfile, WatchHistoryItem } from '../types';

const PROFILE_KEY = 'dhouiher_tv_user_profile';
const FAVORITES_KEY = 'dhouiher_tv_favorites';
const HISTORY_KEY = 'dhouiher_tv_history';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Adem Dhouiher',
  email: 'dhouiheradem@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  language: 'fr',
  theme: 'cinema-dark',
  defaultQuality: '1080p',
  autoplayNext: true,
  preferredAudio: 'fr',
  preferredSubtitle: 'fr',
};

export const getStoredProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Storage read error for profile:', e);
  }
  return DEFAULT_PROFILE;
};

export const saveStoredProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Storage write error for profile:', e);
  }
};

export const getStoredFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read error for favorites:', e);
  }
  // Default some popular items
  return ['ch-1', 'mov-1', 'ser-1'];
};

export const saveStoredFavorites = (favorites: string[]): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.warn('Storage write error for favorites:', e);
  }
};

export const getStoredHistory = (): WatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read error for history:', e);
  }
  // Realistic initial continue watching item
  return [
    {
      id: 'hist-1',
      mediaId: 'mov-1',
      type: 'movie',
      title: 'Aura Stellar : L\'Horizon Stellaire',
      titleAr: 'أورا ستيلار: الأفق الكوني',
      poster: '/src/assets/images/hero_streaming_cinematic_1793020227678.jpg',
      progressPercent: 42,
      currentTime: 3720,
      duration: 8880,
      lastWatchedAt: Date.now() - 3600000 * 4,
    },
    {
      id: 'hist-2',
      mediaId: 'ser-1',
      type: 'series',
      title: 'Le Trône des Ombres',
      titleAr: 'عرش الظلال : صراع الممالك',
      poster: '/src/assets/images/series_poster_royalty_1793020230721.jpg',
      progressPercent: 78,
      currentTime: 2700,
      duration: 3480,
      lastWatchedAt: Date.now() - 3600000 * 24,
      seasonNumber: 1,
      episodeNumber: 1,
      episodeTitle: 'Le Roi sans Visage',
    },
  ];
};

export const saveStoredHistory = (history: WatchHistoryItem[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Storage write error for history:', e);
  }
};

export const updateHistoryProgress = (
  item: Omit<WatchHistoryItem, 'id' | 'lastWatchedAt'>
): void => {
  const current = getStoredHistory();
  const existingIndex = current.findIndex(
    (h) => h.mediaId === item.mediaId && h.episodeNumber === item.episodeNumber
  );

  const updatedItem: WatchHistoryItem = {
    ...item,
    id: `hist-${Date.now()}`,
    lastWatchedAt: Date.now(),
  };

  let newHistory: WatchHistoryItem[];
  if (existingIndex >= 0) {
    newHistory = [
      updatedItem,
      ...current.filter((_, i) => i !== existingIndex),
    ];
  } else {
    newHistory = [updatedItem, ...current].slice(0, 30); // keep last 30
  }

  saveStoredHistory(newHistory);
};
