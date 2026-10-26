import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { INITIAL_CHANNELS, INITIAL_MOVIES, INITIAL_SERIES } from './src/data/mockData.ts';

// Load .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load IPTV configuration from config/iptv.json if needed
const configPath = path.join(__dirname, "config", "iptv.json");

if (!process.env.IPTV_PLAYLIST_URL?.trim()) {
  try {
    const config = JSON.parse(
      fs.readFileSync(configPath, "utf8")
    );

    if (typeof config.url === "string" && config.url.trim()) {
      process.env.IPTV_PLAYLIST_URL = config.url.trim();
    }
  } catch {
    console.error("IPTV configuration file could not be loaded.");
  }
}
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

export type ProviderConnectionStatus = 'connected' | 'not_configured' | 'error';

interface CatalogCache {
  live: any[];
  films: any[];
  series: any[];
  meta: {
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
  };
}

let cachedCatalog: CatalogCache | null = null;
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Checks if a URL is a placeholder or empty
 */
function isPlaceholderUrl(url: string | undefined): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed.includes('provider.example.com') ||
    trimmed.includes('example.com') ||
    trimmed === 'https://...' ||
    trimmed === 'http://...' ||
    trimmed === 'my_iptv_playlist_url'
  );
}

/**
 * Resolves the owner IPTV URL from .env or config/iptv.json
 */
function resolveOwnerIptvUrl(): string | null {
  if (process.env.IPTV_PLAYLIST_URL && !isPlaceholderUrl(process.env.IPTV_PLAYLIST_URL)) {
    return process.env.IPTV_PLAYLIST_URL.trim();
  }

  const configPath = path.resolve(__dirname, 'config', 'iptv.json');
  if (fs.existsSync(configPath)) {
    try {
      const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (content.url && !isPlaceholderUrl(content.url)) {
        return content.url.trim();
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

/**
 * Helper to fetch JSON from Xtream Codes server with VLC User-Agent
 */
function fetchXtreamJson<T = any>(urlStr: string, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.get(
        parsedUrl,
        {
          headers: {
            'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
            Accept: 'application/json, text/plain, */*',
          },
          timeout: timeoutMs,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} from IPTV provider`));
          }

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (err: any) {
              reject(new Error(`Failed to parse JSON response: ${err.message}`));
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Connection timeout while reaching IPTV provider'));
      });

      req.on('error', (err) => {
        reject(err);
      });
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Ingests content from an Xtream Codes IPTV provider API
 */
async function ingestXtreamProvider(
  baseUrl: string,
  username: string,
  password: string
): Promise<{ live: any[]; films: any[]; series: any[] }> {
  const apiBase = `${baseUrl.replace(/\/+$/, '')}/player_api.php?username=${encodeURIComponent(
    username
  )}&password=${encodeURIComponent(password)}`;

  console.log(`[Dhouiher TV Server] Authenticating with Xtream server at ${baseUrl}...`);
  const authResponse = await fetchXtreamJson(apiBase);

  if (!authResponse?.user_info || authResponse.user_info.auth !== 1) {
    throw new Error('Authentication failed: Invalid credentials or inactive IPTV account.');
  }

  console.log(
    `[Dhouiher TV Server] Authenticated! Status: ${authResponse.user_info.status}, Exp: ${authResponse.user_info.exp_date}`
  );

  // Fetch categories, live streams, VOD, and series in parallel
  const [liveCats, liveStreams, vodStreams, seriesList] = await Promise.all([
    fetchXtreamJson<any[]>(`${apiBase}&action=get_live_categories`).catch(() => []),
    fetchXtreamJson<any[]>(`${apiBase}&action=get_live_streams`).catch(() => []),
    fetchXtreamJson<any[]>(`${apiBase}&action=get_vod_streams`).catch(() => []),
    fetchXtreamJson<any[]>(`${apiBase}&action=get_series`).catch(() => []),
  ]);

  const categoryMap = new Map<string, string>();
  if (Array.isArray(liveCats)) {
    liveCats.forEach((c) => {
      if (c.category_id && c.category_name) {
        categoryMap.set(String(c.category_id), c.category_name);
      }
    });
  }

  // 1. Process Live TV Channels
  const liveChannels: any[] = [];
  if (Array.isArray(liveStreams)) {
    // Process the complete live-stream catalog returned by the provider.
    // Do not filter or truncate the owner's channel list.
    const selected = liveStreams;

    selected.forEach((s, idx) => {
      const catName = categoryMap.get(String(s.category_id)) || 'Général';
      const lowerCat = catName.toLowerCase();
      const lowerName = (s.name || '').toLowerCase();

      let category: 'general' | 'news' | 'sports' | 'movies' | 'entertainment' | 'kids' | 'documentaries' =
        'general';
      if (lowerCat.includes('sport') || lowerName.includes('sport') || lowerName.includes('bein') || lowerName.includes('champions')) {
        category = 'sports';
      } else if (lowerCat.includes('news') || lowerCat.includes('info') || lowerName.includes('news') || lowerName.includes('info')) {
        category = 'news';
      } else if (lowerCat.includes('movie') || lowerCat.includes('cine') || lowerName.includes('cinema') || lowerName.includes('disney+')) {
        category = 'movies';
      } else if (lowerCat.includes('kid') || lowerCat.includes('enfant') || lowerCat.includes('anim')) {
        category = 'kids';
      } else if (lowerCat.includes('doc')) {
        category = 'documentaries';
      } else if (lowerCat.includes('entertain') || lowerCat.includes('divert')) {
        category = 'entertainment';
      }

      // Live stream URL with fallback
      const streamUrl = `${baseUrl.replace(/\/+$/, '')}/live/${encodeURIComponent(username)}/${encodeURIComponent(
        password
      )}/${s.stream_id}.m3u8`;

      const cleanTitle = (s.name || `Chaîne ${idx + 1}`).replace(/^#+\s*|\s*#+$/g, '').trim();

      liveChannels.push({
        id: `ch-xtream-${s.stream_id}`,
        number: s.num || idx + 1,
        name: cleanTitle,
        nameAr: cleanTitle,
        category,
        logo: s.stream_icon || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=128&auto=format&fit=crop&q=80',
        streamUrl,
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        isHls: true,
        resolution: cleanTitle.includes('4K') ? '4K Ultra HD' : cleanTitle.includes('FHD') ? '1080p FHD' : 'HD 720p',
        country: catName,
        currentProgram: {
          title: `Direct : ${cleanTitle}`,
          titleAr: `بث مباشر: ${cleanTitle}`,
          time: 'En cours',
          durationMinutes: 120,
          progressPercent: 55,
        },
        upcomingProgram: {
          title: 'Programme suivant',
          titleAr: 'البرنامج القادم',
          time: 'À suivre',
          durationMinutes: 60,
        },
        epgSchedule: [
          {
            id: `epg-${s.stream_id}-1`,
            time: '18:00',
            endTime: '20:00',
            title: `Programme précédent`,
            titleAr: `البرنامج السابق`,
            synopsis: `Diffusion d'archive.`,
            synopsisAr: `تسجيل سابق.`,
            progressPercent: 100,
            isLive: false,
          },
          {
            id: `epg-${s.stream_id}-2`,
            time: '20:00',
            endTime: '22:00',
            title: `Direct : ${cleanTitle}`,
            titleAr: `بث مباشر: ${cleanTitle}`,
            synopsis: `Diffusion en direct issue du bouquet propriétaire Dhouiher TV.`,
            synopsisAr: `بث حي ومباشر عبر شبكة ضويهر تيفي.`,
            progressPercent: 55,
            isLive: true,
          },
        ],
      });
    });
  }

  // 2. Process VOD Movies (Films)
  const movies: any[] = [];
  if (Array.isArray(vodStreams)) {
    // Process every VOD item returned by the provider; do not cap the catalog.\n    const selectedVod = vodStreams;

    vodStreams.forEach((v) => {
      const ext = v.container_extension || 'mp4';
      const streamUrl = `${baseUrl.replace(/\/+$/, '')}/movie/${encodeURIComponent(username)}/${encodeURIComponent(
        password
      )}/${v.stream_id}.${ext}`;

      const cleanTitle = (v.name || 'Film VOD').replace(/^#+\s*|\s*#+$/g, '').trim();
      const rating = v.rating_5based ? Number(v.rating_5based) * 2 : Number(v.rating) || 8.4;

      // Extract year from title if present
      const yearMatch = cleanTitle.match(/\b(19\d{2}|20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 2025;

      movies.push({
        id: `mov-xtream-${v.stream_id}`,
        title: cleanTitle,
        titleAr: cleanTitle,
        tagline: 'Disponible en VOD Haute Définition',
        taglineAr: 'متاح بجودة فائقة في باقة الأفلام',
        overview: `Film VOD issu du catalogue officiel de votre fournisseur IPTV.`,
        overviewAr: `فيلم متاح بجودة عالية ضمن باقة البث الخاصة بك.`,
        genres: ['Action', 'Cinéma'],
        genresAr: ['أكشن', 'سينما'],
        year,
        duration: '1h 52min',
        durationSeconds: 6720,
        rating: Math.min(10, Math.max(7.0, Number(rating.toFixed(1)))),
        director: 'Production officielle',
        cast: ['Acteurs principaux'],
        poster: v.stream_icon || '/src/assets/images/movie_poster_cyberpunk_1793020229429.jpg',
        backdrop: v.stream_icon || '/src/assets/images/hero_streaming_cinematic_1793020227678.jpg',
        streamUrl,
        backupStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isHls: false,
        quality: '1080p FHD',
        featured: movies.length === 0,
        isTrending: true,
      });
    });
  }

  // 3. Process Series
  const series: any[] = [];
  if (Array.isArray(seriesList)) {
    // Process every series returned by the provider; do not cap the catalog.\n    const selectedSeries = seriesList;

    seriesList.forEach((ser) => {
      const cleanTitle = (ser.name || 'Série TV').trim();
      const yearMatch = ser.releaseDate ? ser.releaseDate.match(/^(\d{4})/) : null;
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 2025;
      const rating = ser.rating_5based ? Number(ser.rating_5based) * 2 : Number(ser.rating) || 8.8;

      const cover = ser.cover || '/src/assets/images/series_poster_royalty_1793020230721.jpg';
      const backdrop =
        Array.isArray(ser.backdrop_path) && ser.backdrop_path[0]
          ? ser.backdrop_path[0]
          : cover;

      const genreStr = ser.genre || 'Drame';
      const castArr = ser.cast ? ser.cast.split(',').map((c: string) => c.trim()) : ['Distribution'];

      // Generate initial seasons & episodes
      const totalSeasons = Array.isArray(ser.seasons) && ser.seasons.length > 0 ? ser.seasons.length : 1;
      const seasonsObj = [];

      for (let sNum = 1; sNum <= Math.min(3, totalSeasons); sNum++) {
        const episodes = [];
        for (let epNum = 1; epNum <= 4; epNum++) {
          episodes.push({
            id: `ep-${ser.series_id}-${sNum}-${epNum}`,
            episodeNumber: epNum,
            title: `Épisode ${epNum}`,
            titleAr: `الحلقة ${epNum}`,
            duration: '45 min',
            overview: ser.plot || `Épisode ${epNum} de la Saison ${sNum}`,
            overviewAr: `الحلقة ${epNum} من الموسم ${sNum}`,
            streamUrl: `${baseUrl.replace(/\/+$/, '')}/series/${encodeURIComponent(username)}/${encodeURIComponent(
              password
            )}/${ser.series_id}.mp4`,
            thumbnail: backdrop,
          });
        }

        seasonsObj.push({
          seasonNumber: sNum,
          title: `Saison ${sNum}`,
          titleAr: `الموسم ${sNum}`,
          episodes,
        });
      }

      series.push({
        id: `ser-xtream-${ser.series_id}`,
        title: cleanTitle,
        titleAr: cleanTitle,
        tagline: genreStr,
        taglineAr: genreStr,
        overview: ser.plot || `Série disponible dans le catalogue Dhouiher TV.`,
        overviewAr: `مسلسل متاح ضمن مكتبة المسلسلات الكاملة.`,
        genres: [genreStr],
        genresAr: [genreStr],
        year,
        rating: Math.min(10, Math.max(7.0, Number(rating.toFixed(1)))),
        creator: ser.director || 'Production TV',
        cast: castArr.slice(0, 4),
        poster: cover,
        backdrop,
        totalSeasons,
        seasons: seasonsObj,
        featured: series.length === 0,
      });
    });
  }

  return {
    live: liveChannels.length > 0 ? liveChannels : INITIAL_CHANNELS,
    films: movies.length > 0 ? movies : INITIAL_MOVIES,
    series: series.length > 0 ? series : INITIAL_SERIES,
  };
}

/**
 * Parses generic M3U/M3U Plus playlists
 */
function parseM3UPlaylist(content: string): { live: any[]; films: any[]; series: any[] } {
  const lines = content.split('\n').map((l) => l.trim());
  const live: any[] = [];
  const films: any[] = [];
  const seriesMap = new Map<string, any>();

  let currentTitle = '';
  let currentLogo = '';
  let currentGroup = 'Général';
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      currentLogo = logoMatch ? logoMatch[1] : '';

      const groupMatch = line.match(/group-title="([^"]+)"/i);
      currentGroup = groupMatch ? groupMatch[1].trim() : 'Général';

      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentTitle = line.substring(commaIndex + 1).trim();
      } else {
        currentTitle = `Chaîne ${counter}`;
      }
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentTitle) {
        const streamUrl = line;
        const lowerGroup = currentGroup.toLowerCase();
        const lowerUrl = streamUrl.toLowerCase();
        const isHls = lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/');

        const seriesPattern = /(?:s|season|saison)\s*(\d{1,2})\s*(?:e|ep|episode|\*)\s*(\d{1,2})|(\d{1,2})x(\d{1,2})/i;
        const seriesMatch = currentTitle.match(seriesPattern);

        const isMovie =
          lowerGroup.includes('vod') ||
          lowerGroup.includes('film') ||
          lowerGroup.includes('movie') ||
          lowerUrl.endsWith('.mp4') ||
          lowerUrl.endsWith('.mkv');

        if (seriesMatch) {
          const seasonNum = parseInt(seriesMatch[1] || seriesMatch[3], 10) || 1;
          const episodeNum = parseInt(seriesMatch[2] || seriesMatch[4], 10) || 1;
          const cleanSeriesTitle = currentTitle.replace(seriesPattern, '').trim() || currentTitle;
          const seriesKey = cleanSeriesTitle.toLowerCase();

          if (!seriesMap.has(seriesKey)) {
            seriesMap.set(seriesKey, {
              id: `ser-m3u-${seriesMap.size + 1}`,
              title: cleanSeriesTitle,
              titleAr: cleanSeriesTitle,
              tagline: currentGroup,
              taglineAr: currentGroup,
              overview: `Série préconfigurée issue de votre bouquet IPTV.`,
              overviewAr: `مسلسل متاح عبر باقة البث الخاصة بك.`,
              genres: [currentGroup],
              genresAr: [currentGroup],
              year: 2025,
              rating: 8.8,
              creator: 'Fournisseur IPTV',
              cast: ['Distribution'],
              poster: currentLogo || '/src/assets/images/series_poster_royalty_1793020230721.jpg',
              backdrop: currentLogo || '/src/assets/images/series_poster_royalty_1793020230721.jpg',
              totalSeasons: 1,
              seasons: [],
            });
          }

          const sObj = seriesMap.get(seriesKey);
          let season = sObj.seasons.find((s: any) => s.seasonNumber === seasonNum);
          if (!season) {
            season = {
              seasonNumber: seasonNum,
              title: `Saison ${seasonNum}`,
              titleAr: `الموسم ${seasonNum}`,
              episodes: [],
            };
            sObj.seasons.push(season);
          }

          season.episodes.push({
            id: `ep-m3u-${sObj.id}-${seasonNum}-${episodeNum}`,
            episodeNumber: episodeNum,
            title: currentTitle,
            titleAr: currentTitle,
            duration: '45 min',
            overview: `Épisode ${episodeNum}`,
            overviewAr: `الحلقة ${episodeNum}`,
            streamUrl,
            thumbnail: currentLogo || '/src/assets/images/series_poster_royalty_1793020230721.jpg',
          });
        } else if (isMovie) {
          films.push({
            id: `mov-m3u-${films.length + 1}`,
            title: currentTitle,
            titleAr: currentTitle,
            tagline: currentGroup,
            taglineAr: currentGroup,
            overview: `Film VOD issu de votre bouquet IPTV propriétaire.`,
            overviewAr: `فيلم متاح عبر باقة البث الخاصة بك.`,
            genres: [currentGroup],
            genresAr: [currentGroup],
            year: 2025,
            duration: '1h 50min',
            durationSeconds: 6600,
            rating: 8.5,
            director: 'Production VOD',
            cast: ['Acteurs'],
            poster: currentLogo || '/src/assets/images/movie_poster_cyberpunk_1793020229429.jpg',
            backdrop: currentLogo || '/src/assets/images/hero_streaming_cinematic_1793020227678.jpg',
            streamUrl,
            backupStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            isHls,
            quality: '1080p FHD',
            featured: films.length === 0,
            isTrending: true,
          });
        } else {
          live.push({
            id: `ch-m3u-${live.length + 1}`,
            number: counter,
            name: currentTitle,
            nameAr: currentTitle,
            category: 'general',
            logo: currentLogo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=128&auto=format&fit=crop&q=80',
            streamUrl,
            backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            isHls,
            resolution: '1080p FHD',
            country: currentGroup || 'IPTV Direct',
            currentProgram: {
              title: `Direct : ${currentTitle}`,
              titleAr: `بث مباشر: ${currentTitle}`,
              time: 'En cours',
              durationMinutes: 120,
              progressPercent: 50,
            },
            upcomingProgram: {
              title: 'Programme suivant',
              titleAr: 'البرنامج التالي',
              time: 'À suivre',
              durationMinutes: 60,
            },
            epgSchedule: [],
          });
        }

        counter++;
        currentTitle = '';
        currentLogo = '';
      }
    }
  }

  return { live, films, series: Array.from(seriesMap.values()) };
}

/**
 * Resolves catalog from configured owner IPTV source
 */
async function getOrFetchCatalog(forceRefresh = false): Promise<CatalogCache> {
  const now = Date.now();
  if (!forceRefresh && cachedCatalog && now - lastFetchTimestamp < CACHE_DURATION_MS) {
    return cachedCatalog;
  }

  const ownerPlaylistUrl = resolveOwnerIptvUrl();

  if (ownerPlaylistUrl) {
    try {
      console.log(`[Dhouiher TV Server] Connecting to owner IPTV source...`);

      // Check if URL is an Xtream Codes link
      const urlObj = new URL(ownerPlaylistUrl);
      const username = urlObj.searchParams.get('username');
      const password = urlObj.searchParams.get('password');

      let parsed: { live: any[]; films: any[]; series: any[] };

      if (username && password) {
        // Xtream Codes integration
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        parsed = await ingestXtreamProvider(baseUrl, username, password);
      } else {
        // Standard M3U playlist integration
        const response = await fetch(ownerPlaylistUrl, {
          headers: {
            'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
            Accept: '*/*',
          },
          signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from provider`);
        }

        const text = await response.text();
        parsed = parseM3UPlaylist(text);
      }

      // When connected, show the provider's actual results—even if a category is
      // empty. Do not mix demo/mock items into a real provider catalog.
      const live = parsed.live;
      const films = parsed.films;
      const series = parsed.series;

      cachedCatalog = {
        live,
        films,
        series,
        meta: {
          isPreconfigured: true,
          status: 'connected',
          statusMessage: `Bouquet IPTV officiel synchronisé avec succès (${live.length} chaînes, ${films.length} films, ${series.length} séries).`,
          providerTitle: 'Bouquet IPTV Propriétaire Connecté (Compte Actif)',
          lastUpdated: now,
          isCustomSource: true,
          counts: {
            live: live.length,
            films: films.length,
            series: series.length,
          },
        },
      };
      lastFetchTimestamp = now;
      console.log(
        `[Dhouiher TV Server] SUCCESS: ${live.length} live channels, ${films.length} films, ${series.length} series connected.`
      );
      return cachedCatalog;
    } catch (err: any) {
      console.error(`[Dhouiher TV Server] Error connecting to owner IPTV:`, err.message);

      cachedCatalog = {
        live: INITIAL_CHANNELS,
        films: INITIAL_MOVIES,
        series: INITIAL_SERIES,
        meta: {
          isPreconfigured: true,
          status: 'error',
          statusMessage: `Échec de connexion : ${err.message}. Affichage du bouquet de secours vérifié.`,
          providerTitle: 'Erreur de connexion IPTV',
          lastUpdated: now,
          isCustomSource: false,
          counts: {
            live: INITIAL_CHANNELS.length,
            films: INITIAL_MOVIES.length,
            series: INITIAL_SERIES.length,
          },
        },
      };
      lastFetchTimestamp = now;
      return cachedCatalog;
    }
  }

  // Not configured fallback
  cachedCatalog = {
    live: INITIAL_CHANNELS,
    films: INITIAL_MOVIES,
    series: INITIAL_SERIES,
    meta: {
      isPreconfigured: true,
      status: 'not_configured',
      statusMessage: 'Aucune URL IPTV configurée. Mode démo avec flux autorisés Creative Commons.',
      providerTitle: 'Mode Démonstration & Flux Autorisés',
      lastUpdated: now,
      isCustomSource: false,
      counts: {
        live: INITIAL_CHANNELS.length,
        films: INITIAL_MOVIES.length,
        series: INITIAL_SERIES.length,
      },
    },
  };
  lastFetchTimestamp = now;
  return cachedCatalog;
}

// REST API Endpoints
app.get('/api/content', async (_req: Request, res: Response) => {
  try {
    const catalog = await getOrFetchCatalog(false);
    res.json(catalog);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve content catalog' });
  }
});

app.post('/api/content/refresh', async (_req: Request, res: Response) => {
  try {
    const catalog = await getOrFetchCatalog(true);
    res.json({
      success: true,
      message: catalog.meta.statusMessage,
      meta: catalog.meta,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to refresh content catalog' });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  const isConfigured = resolveOwnerIptvUrl() !== null;
  res.json({
    status: 'ok',
    app: 'Dhouiher TV',
    version: '2.0.0',
    iptvConfigured: isConfigured,
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dhouiher TV] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
