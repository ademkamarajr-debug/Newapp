import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_CHANNELS, INITIAL_MOVIES, INITIAL_SERIES } from '../data/mockData';
import {
  Channel,
  Movie,
  PlaybackItem,
  Series,
  TabId,
  UserProfile,
  WatchHistoryItem,
} from '../types';
import {
  DEFAULT_PROFILE,
  getStoredFavorites,
  getStoredHistory,
  getStoredProfile,
  saveStoredFavorites,
  saveStoredHistory,
  saveStoredProfile,
  updateHistoryProgress,
} from '../services/storageService';
import {
  CatalogMetadata,
  fetchPreconfiguredCatalog,
} from '../services/contentService';
import { getTranslation } from '../utils/i18n';

interface AppContextType {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Media Catalog
  channels: Channel[];
  movies: Movie[];
  series: Series[];
  isLoadingCatalog: boolean;
  catalogMeta: CatalogMetadata | null;
  refreshCatalog: () => Promise<void>;

  // User State
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  history: WatchHistoryItem[];
  recordProgress: (item: Omit<WatchHistoryItem, 'id' | 'lastWatchedAt'>) => void;
  clearHistory: () => void;

  // Modals & Active Views
  selectedDetailItem: Movie | Series | Channel | null;
  openDetails: (item: Movie | Series | Channel) => void;
  closeDetails: () => void;

  // Player
  activePlayback: PlaybackItem | null;
  startPlayback: (item: PlaybackItem) => void;
  stopPlayback: () => void;
  changePlaybackStream: (streamUrl: string, isHls: boolean) => void;

  // Toast
  toast: string | null;
  showToast: (message: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // i18n helper
  t: ReturnType<typeof getTranslation>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabId>('films');
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [favorites, setFavorites] = useState<string[]>(getStoredFavorites());
  const [history, setHistory] = useState<WatchHistoryItem[]>(getStoredHistory());

  // Dynamic Catalog State from centralized owner source
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [series, setSeries] = useState<Series[]>(INITIAL_SERIES);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMetadata | null>(null);

  const [selectedDetailItem, setSelectedDetailItem] = useState<Movie | Series | Channel | null>(null);
  const [activePlayback, setActivePlayback] = useState<PlaybackItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync RTL and lang attribute on document element
  useEffect(() => {
    document.documentElement.lang = profile.language;
    document.documentElement.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
  }, [profile.language]);

  // Load centralized catalog on initial mount
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setIsLoadingCatalog(true);
      try {
        const data = await fetchPreconfiguredCatalog(false);
        if (isMounted) {
          setChannels(data.live);
          setMovies(data.films);
          setSeries(data.series);
          setCatalogMeta(data.meta);
        }
      } catch (err) {
        console.warn('Catalog load issue:', err);
      } finally {
        if (isMounted) setIsLoadingCatalog(false);
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const data = await fetchPreconfiguredCatalog(true);
      setChannels(data.live);
      setMovies(data.films);
      setSeries(data.series);
      setCatalogMeta(data.meta);
      showToast(getTranslation(profile.language).syncCatalogSuccess);
    } catch (err) {
      showToast('Erreur lors de la synchronisation.');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    saveStoredProfile(updated);
    showToast(getTranslation(updated.language).profileSavedToast);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      saveStoredFavorites(next);
      const t = getTranslation(profile.language);
      showToast(exists ? t.removeFromFavorites : t.addToFavorites);
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const recordProgress = (item: Omit<WatchHistoryItem, 'id' | 'lastWatchedAt'>) => {
    updateHistoryProgress(item);
    setHistory(getStoredHistory());
  };

  const clearHistoryHandler = () => {
    saveStoredHistory([]);
    setHistory([]);
    showToast(getTranslation(profile.language).historyCleared);
  };

  const openDetails = (item: Movie | Series | Channel) => {
    setSelectedDetailItem(item);
  };

  const closeDetails = () => {
    setSelectedDetailItem(null);
  };

  const startPlayback = (item: PlaybackItem) => {
    setActivePlayback(item);
    // Auto record initial history
    recordProgress({
      mediaId: item.mediaId,
      type: item.type,
      title: item.title,
      titleAr: item.titleAr,
      poster: item.poster,
      progressPercent: item.currentTime && item.duration ? Math.round((item.currentTime / item.duration) * 100) : 5,
      currentTime: item.currentTime || 0,
      duration: item.duration || 3600,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      episodeTitle: item.episodeTitle,
    });
  };

  const stopPlayback = () => {
    setActivePlayback(null);
  };

  const changePlaybackStream = (streamUrl: string, isHls: boolean) => {
    if (activePlayback) {
      setActivePlayback({
        ...activePlayback,
        streamUrl,
        isHls,
      });
    }
  };

  const t = getTranslation(profile.language);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        channels,
        movies,
        series,
        isLoadingCatalog,
        catalogMeta,
        refreshCatalog,
        profile,
        setProfile,
        updateUserProfile,
        favorites,
        toggleFavorite,
        isFavorite,
        history,
        recordProgress,
        clearHistory: clearHistoryHandler,
        selectedDetailItem,
        openDetails,
        closeDetails,
        activePlayback,
        startPlayback,
        stopPlayback,
        changePlaybackStream,
        toast,
        showToast,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
