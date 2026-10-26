# Dhouiher TV — Preconfigured Streaming & Live IPTV Platform

**Dhouiher TV** is a professional, high-performance streaming web application designed with a cinematic dark aesthetic inspired by Netflix, Disney+, and modern IPTV applications. Built with React 19, TypeScript, Tailwind CSS, Express, and `hls.js`.

The application is built as a **preconfigured streaming service**: the content source is managed and secured on the backend by the application owner, eliminating any complex setup, playlist URLs, or credential inputs for the end user.

---

## 🌟 Key Features

### 1. Preconfigured, Zero-Setup User Experience
- **No end-user playlist configuration**: Users simply launch the app and immediately browse the owner-curated catalog.
- **Server-Isolated Security**: All private IPTV provider endpoints and credentials reside in server-side private environment variables (`IPTV_PLAYLIST_URL`), completely hidden from client bundles and network inspection.
- **Intelligent In-Memory Caching**: The server parses and caches M3U/M3U Plus playlists with a 1-hour rolling cache to prevent redundant provider downloads on page navigation.

### 2. Four Dedicated Navigation Tabs
- **LIVE TV (`En direct` / `بث مباشر`)**:
  - Live television channels categorized into: General, News, Sports, Movies, Entertainment, Kids, and Documentaries.
  - Channel cards with live program badges, current and upcoming show details, and progress percentage.
  - Interactive **EPG (Electronic Program Guide)** with time-slotted program schedules.
  - Quick in-player channel switcher drawer to change channels seamlessly without leaving full-screen playback.
  - Channel search and category filters.
  - Favorite channel tagging.
- **SERIES (`Séries` / `مسلسلات`)**:
  - Automatically detected series with hierarchical season & episode breakdown.
  - Featured series hero showcase.
  - Comprehensive series details modal with seasons and episodes selector.
  - Episode progression and direct episode-by-episode streaming.
  - "Continue Watching" row with resume progress.
  - Genre filtering and sorting.
- **FILMS (`Films` / `أfلام`)**:
  - Automatically identified VOD movie catalog.
  - Cinematic hero banner with instant **Watch Now** (`Regarder maintenant`) and **More Info** triggers.
  - Categorized shelves for Trending, Popular, Action, Sci-Fi, and Documentaries.
  - Synopsis, director, cast, resolution specs (4K UHD, HDR10, Dolby Vision), and duration.
  - Continue Watching shelf with interactive progress bars.
- **PROFILE (`Profil` / `حسابي`)**:
  - User display name and avatar customizer.
  - **Full French & Arabic bilingual support with native RTL (`dir="rtl"`) layout and Arabic typography (Cairo font)**.
  - Visual theme selector (Pure Cinema Dark `#080B12`, Midnight Navy `#101827`, Electric Purple).
  - Watch history management with individual deletion and full history clear.
  - Playback preferences: Resolution defaults, autoplay next episode, audio and subtitle preferences.
  - **App & Streaming Status**: Real-time status of the preconfigured owner connection, live catalog statistics, and catalog refresh trigger.

### 3. High-Performance HLS & MP4 Video Player
- Powered by `hls.js` with native Safari/iOS fallback for `.m3u8` streams and HTML5 for direct MP4 videos.
- Responsive player overlay with play/pause, seek bar, time display, volume, mute, playback speed (0.75x to 1.5x), resolution selector, and fullscreen toggle.
- Error handling with clear diagnostic feedback and a one-click **Switch to Backup Stream** (`Basculer sur le flux de secours`) and **Retry** (`Réessayer`) buttons.
- Keyboard shortcuts: `Space`/`k` (play/pause), `ArrowLeft`/`ArrowRight` (-10s / +10s), `ArrowUp`/`ArrowDown` (volume), `f` (fullscreen), `m` (mute), `Esc` (exit).
- Automatic watch progress persistence in `localStorage`.

---

## 🔒 Owner Configuration & Security

The content source is managed via private server-side environment variables:

| Variable | Scope | Description |
|---|---|---|
| `IPTV_PLAYLIST_URL` | **Private (Server-Only)** | The secret owner-managed IPTV M3U / M3U Plus playlist URL containing any required credentials or tokens. Kept solely on the server; never delivered to client browsers. |
| `PORT` | Server | Optional port configuration (defaults to `3000`). |

### How It Works:
1. When the server boots, it checks for `IPTV_PLAYLIST_URL`.
2. If configured, the backend fetches and parses the M3U Plus playlist using a resilient parser that classifies streams into Live TV, Films, and Series (detecting season and episode markers like `S01E02`).
3. If not set or if network is temporarily unreachable, the platform serves a verified, high-fidelity default catalog of Creative Commons and public test streams (Blender Foundation, Mux test streams, Unified Streaming) to guarantee 100% uptime without crashes.
4. The frontend fetches the sanitized catalog from `/api/content`, with zero provider credentials or private query parameters exposed.

---

## 🚀 Setup & Installation

### Development
```bash
# Install dependencies
npm install

# Start full-stack development server (Express + Vite middleware)
npm run dev
```

### Production Build & Run
```bash
# Build the client application
npm run build

# Start the production server
npm run start
```

---

## 🎨 Color Palette

| Token | Hex | Usage |
|---|---|---|
| Background Canvas | `#080B12` | Dominant cinematic dark canvas |
| Surface Navy | `#101827` | Structural cards, drawers, modals |
| Electric Purple | `#7C3AED` | Primary brand accent & active states |
| Radiant Cyan | `#06B6D4` | Secondary accents, highlights, resolutions |

---

## 📜 License
Licensed under Apache 2.0.
