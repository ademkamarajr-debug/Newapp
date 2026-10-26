/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MediaDetailsModal } from './components/media/MediaDetailsModal';
import { Navbar } from './components/navigation/Navbar';
import { VideoPlayer } from './components/player/VideoPlayer';
import { SearchModal } from './components/ui/SearchModal';
import { Toast } from './components/ui/Toast';
import { AppProvider, useApp } from './context/AppContext';
import { FilmsPage } from './pages/Films/FilmsPage';
import { LiveTVPage } from './pages/LiveTV/LiveTVPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { SeriesPage } from './pages/Series/SeriesPage';
import { Film, Radio, ShieldCheck, Tv } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeTab, activePlayback, stopPlayback, series, startPlayback, profile } = useApp();

  // Next episode handler if playing a series
  const handleNextEpisode = () => {
    if (!activePlayback || activePlayback.type !== 'series' || !activePlayback.seriesId) return;

    const matchedSeries = series.find((s) => s.id === activePlayback.seriesId);
    if (!matchedSeries) return;

    const currentSeason = matchedSeries.seasons.find(
      (s) => s.seasonNumber === (activePlayback.seasonNumber || 1)
    );
    if (!currentSeason) return;

    const currentEpNum = activePlayback.episodeNumber || 1;
    const nextEp = currentSeason.episodes.find((e) => e.episodeNumber === currentEpNum + 1);

    if (nextEp) {
      startPlayback({
        id: `play-${nextEp.id}`,
        mediaId: matchedSeries.id,
        title: matchedSeries.title,
        titleAr: matchedSeries.titleAr,
        type: 'series',
        streamUrl: nextEp.streamUrl,
        isHls: nextEp.streamUrl.includes('.m3u8'),
        poster: matchedSeries.poster,
        seriesId: matchedSeries.id,
        seasonNumber: currentSeason.seasonNumber,
        episodeNumber: nextEp.episodeNumber,
        episodeTitle: nextEp.title,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F3F4F6] flex flex-col selection:bg-[#7C3AED] selection:text-white">
      {/* Navigation Top Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 pt-6">
        {activeTab === 'live' && <LiveTVPage />}
        {activeTab === 'series' && <SeriesPage />}
        {activeTab === 'films' && <FilmsPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#080B12] border-t border-slate-900 py-10 px-4 md:px-8 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA]">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-400">DHOUIHER TV</span>
            <span>·</span>
            <span>{profile.language === 'ar' ? 'جميع الحقوق محفوظة 2026' : '© 2026 Tous droits réservés'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {profile.language === 'ar'
                ? 'بث تجريبي قانوني معتمد عبر مشغل HLS متطور'
                : 'Lecteur HLS certifié · Flux de test libres de droits autorisés'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <SearchModal />
      <MediaDetailsModal />

      {/* Fullscreen Video Player */}
      {activePlayback && (
        <VideoPlayer
          item={activePlayback}
          onClose={stopPlayback}
          onNextEpisode={activePlayback.type === 'series' ? handleNextEpisode : undefined}
        />
      )}

      {/* Toast notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
