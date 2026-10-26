import { Channel, Movie, Series } from '../types';
import { INITIAL_CHANNELS, INITIAL_MOVIES, INITIAL_SERIES } from '../data/mockData';

export type ProviderConnectionStatus = 'connected' | 'not_configured' | 'error';

export interface CatalogMetadata {
  isPreconfigured: boolean;
  status: ProviderConnectionStatus;
  statusMessage: string;
  providerTitle: string;
  lastUpdated: number;
  isCustomSource: boolean;
  counts: {
    live: number;
    films: number;
    series: number;
  };
}

export interface CatalogData {
  live: Channel[];
  films: Movie[];
  series: Series[];
  meta: CatalogMetadata;
}

const SESSION_CACHE_KEY = 'dhouiher_tv_catalog_cache_v3';

export const fetchPreconfiguredCatalog = async (forceRefresh = false): Promise<CatalogData> => {
  // Check session cache if not forced
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // If cached less than 10 minutes ago, return immediately
        if (parsed?.meta?.lastUpdated && Date.now() - parsed.meta.lastUpdated < 10 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore storage error
    }
  }

  try {
    const url = forceRefresh ? '/api/content/refresh' : '/api/content';
    const method = forceRefresh ? 'POST' : 'GET';
    const res = await fetch(url, { method });

    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }

    const data: CatalogData = await res.json();
    if (data && Array.isArray(data.live) && Array.isArray(data.films) && Array.isArray(data.series)) {
      try {
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        // ignore storage quota error
      }
      return data;
    }
  } catch (err) {
    console.warn('[Dhouiher TV] Server content fetch error, using local fallback:', err);
  }

  // Graceful fallback to verified built-in catalog
  const fallbackData: CatalogData = {
    live: INITIAL_CHANNELS,
    films: INITIAL_MOVIES,
    series: INITIAL_SERIES,
    meta: {
      isPreconfigured: true,
      status: 'not_configured',
      statusMessage: 'En attente de configuration. Mode démo avec flux autorisés Creative Commons.',
      providerTitle: 'Mode Démonstration & Flux Autorisés (En attente de configuration)',
      lastUpdated: Date.now(),
      isCustomSource: false,
      counts: {
        live: INITIAL_CHANNELS.length,
        films: INITIAL_MOVIES.length,
        series: INITIAL_SERIES.length,
      },
    },
  };

  return fallbackData;
};
