export type Language = 'fr' | 'ar';

export type TabId = 'live' | 'series' | 'films' | 'profile';

export type ChannelCategory =
  | 'general'
  | 'news'
  | 'sports'
  | 'movies'
  | 'entertainment'
  | 'kids'
  | 'documentaries';

export interface EPGProgram {
  id: string;
  time: string;
  endTime: string;
  title: string;
  titleAr: string;
  synopsis: string;
  synopsisAr: string;
  progressPercent: number;
  isLive: boolean;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  nameAr: string;
  category: ChannelCategory;
  logo: string;
  streamUrl: string;
  backupStreamUrl?: string;
  isHls: boolean;
  resolution: string;
  country: string;
  currentProgram: {
    title: string;
    titleAr: string;
    time: string;
    durationMinutes: number;
    progressPercent: number;
  };
  upcomingProgram: {
    title: string;
    titleAr: string;
    time: string;
    durationMinutes: number;
  };
  epgSchedule: EPGProgram[];
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  titleAr: string;
  duration: string;
  overview: string;
  overviewAr: string;
  streamUrl: string;
  thumbnail: string;
}

export interface Season {
  seasonNumber: number;
  title: string;
  titleAr: string;
  episodes: Episode[];
}

export interface Series {
  id: string;
  title: string;
  titleAr: string;
  tagline: string;
  taglineAr: string;
  overview: string;
  overviewAr: string;
  genres: string[];
  genresAr: string[];
  year: number;
  rating: number;
  creator: string;
  cast: string[];
  poster: string;
  backdrop: string;
  totalSeasons: number;
  seasons: Season[];
  featured?: boolean;
}

export interface Movie {
  id: string;
  title: string;
  titleAr: string;
  tagline: string;
  taglineAr: string;
  overview: string;
  overviewAr: string;
  genres: string[];
  genresAr: string[];
  year: number;
  duration: string;
  durationSeconds: number;
  rating: number;
  director: string;
  cast: string[];
  poster: string;
  backdrop: string;
  streamUrl: string;
  backupStreamUrl?: string;
  isHls: boolean;
  quality: string;
  featured?: boolean;
  isTrending?: boolean;
}

export interface PlaybackItem {
  id: string;
  mediaId: string;
  title: string;
  titleAr: string;
  type: 'movie' | 'series' | 'channel';
  streamUrl: string;
  backupStreamUrl?: string;
  isHls: boolean;
  poster: string;
  backdrop?: string;
  currentTime?: number;
  duration?: number;
  seriesId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  channelCategory?: string;
  channelLogo?: string;
}

export interface WatchHistoryItem {
  id: string;
  mediaId: string;
  type: 'movie' | 'series' | 'channel';
  title: string;
  titleAr: string;
  poster: string;
  progressPercent: number;
  currentTime: number;
  duration: number;
  lastWatchedAt: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  language: Language;
  theme: 'cinema-dark' | 'midnight-navy' | 'deep-purple';
  defaultQuality: 'auto' | '1080p' | '720p' | '480p';
  autoplayNext: boolean;
  preferredAudio: 'fr' | 'ar' | 'en';
  preferredSubtitle: 'fr' | 'ar' | 'en' | 'off';
}
