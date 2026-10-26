import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Film,
  Heart,
  Play,
  Radio,
  Star,
  Tv,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Channel, Episode, Movie, Series } from '../../types';

export const MediaDetailsModal: React.FC = () => {
  const {
    selectedDetailItem,
    closeDetails,
    startPlayback,
    isFavorite,
    toggleFavorite,
    t,
    profile,
  } = useApp();

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);

  if (!selectedDetailItem) return null;

  const isChannel = 'number' in selectedDetailItem;
  const isSeries = 'seasons' in selectedDetailItem;
  const isMovie = !isChannel && !isSeries;

  const item = selectedDetailItem;
  const favorited = isFavorite(item.id);

  const title = isChannel
    ? (profile.language === 'ar' ? (item as Channel).nameAr : (item as Channel).name)
    : (profile.language === 'ar' ? (item as Movie).titleAr : (item as Movie).title);
  const overview = profile.language === 'ar' ? (item as any).overviewAr || (item as any).synopsisAr : (item as any).overview || (item as any).synopsis;
  const backdrop = (item as any).backdrop || (item as any).poster || (item as any).logo;

  const handlePlayMovie = () => {
    const mov = item as Movie;
    startPlayback({
      id: `play-${mov.id}`,
      mediaId: mov.id,
      title: mov.title,
      titleAr: mov.titleAr,
      type: 'movie',
      streamUrl: mov.streamUrl,
      backupStreamUrl: mov.backupStreamUrl,
      isHls: mov.isHls,
      poster: mov.poster,
      duration: mov.durationSeconds,
    });
    closeDetails();
  };

  const handlePlayChannel = () => {
    const ch = item as Channel;
    startPlayback({
      id: `play-${ch.id}`,
      mediaId: ch.id,
      title: ch.name,
      titleAr: ch.nameAr,
      type: 'channel',
      streamUrl: ch.streamUrl,
      backupStreamUrl: ch.backupStreamUrl,
      isHls: ch.isHls,
      poster: ch.logo,
      channelCategory: ch.category,
      channelLogo: ch.logo,
    });
    closeDetails();
  };

  const handlePlayEpisode = (ep: Episode, seasonNum: number) => {
    const ser = item as Series;
    startPlayback({
      id: `play-${ep.id}`,
      mediaId: ser.id,
      title: ser.title,
      titleAr: ser.titleAr,
      type: 'series',
      streamUrl: ep.streamUrl,
      isHls: ep.streamUrl.includes('.m3u8'),
      poster: ser.poster,
      seriesId: ser.id,
      seasonNumber: seasonNum,
      episodeNumber: ep.episodeNumber,
      episodeTitle: ep.title,
    });
    closeDetails();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#101827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={closeDetails}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors cursor-pointer"
          title={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto">
          {/* Hero Banner with Scrim */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-950">
            <img
              src={backdrop}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-75 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101827] via-[#101827]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#101827]/80 via-transparent to-transparent" />

            {/* Banner Overlay Info */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  {isChannel ? (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {t.liveBadge}
                    </span>
                  ) : (
                    <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {isMovie ? t.tabFilms : t.tabSeries}
                    </span>
                  )}
                  {!(item as any).number && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{(item as any).rating}</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-300">
                    {(item as any).year || (item as any).resolution}
                  </span>
                  {(item as Movie).duration && (
                    <span className="text-xs text-slate-400">· {(item as Movie).duration}</span>
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {title}
                </h2>
                {(item as any).tagline && (
                  <p className="text-xs md:text-sm text-slate-300 italic mt-1">
                    "{profile.language === 'ar' ? (item as any).taglineAr : (item as any).tagline}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {isMovie && (
                  <button
                    onClick={handlePlayMovie}
                    className="py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#7C3AED]/30 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    {t.watchNow}
                  </button>
                )}

                {isChannel && (
                  <button
                    onClick={handlePlayChannel}
                    className="py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#7C3AED]/30 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    {t.watchNow}
                  </button>
                )}

                <button
                  onClick={() => toggleFavorite(item.id)}
                  className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                    favorited
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                  }`}
                  title={favorited ? t.removeFromFavorites : t.addToFavorites}
                >
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Overview / Synopsis */}
            {overview && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Synopsis
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {overview}
                </p>
              </div>
            )}

            {/* Metadata Badges & Cast (Zero-Pill discipline: unboxed clean text) */}
            {((item as any).genres || (item as any).cast || (item as any).director) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                {(item as any).genres && (
                  <div>
                    <span className="font-semibold text-slate-200 block mb-1">{t.genres}</span>
                    <span>
                      {(profile.language === 'ar' ? (item as any).genresAr : (item as any).genres)?.join(' · ')}
                    </span>
                  </div>
                )}
                {(item as any).cast && (
                  <div>
                    <span className="font-semibold text-slate-200 block mb-1">{t.cast}</span>
                    <span>{(item as any).cast.join(', ')}</span>
                  </div>
                )}
                {(item as any).director && (
                  <div>
                    <span className="font-semibold text-slate-200 block mb-1">{t.director}</span>
                    <span className="text-slate-300">{(item as any).director}</span>
                  </div>
                )}
                {(item as any).quality && (
                  <div>
                    <span className="font-semibold text-slate-200 block mb-1">{t.quality}</span>
                    <span className="text-[#06B6D4] font-medium">{(item as any).quality}</span>
                  </div>
                )}
              </div>
            )}

            {/* Series: Seasons and Episodes Browser */}
            {isSeries && (
              <div className="pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">{t.episodes}</h3>

                  {/* Season selector segmented control */}
                  <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    {(item as Series).seasons.map((s) => (
                      <button
                        key={s.seasonNumber}
                        onClick={() => setSelectedSeasonNumber(s.seasonNumber)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          selectedSeasonNumber === s.seasonNumber
                            ? 'bg-[#7C3AED] text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.season} {s.seasonNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Episode Cards Grid */}
                {(() => {
                  const currentSeason =
                    (item as Series).seasons.find((s) => s.seasonNumber === selectedSeasonNumber) ||
                    (item as Series).seasons[0];

                  return (
                    <div className="space-y-3">
                      {currentSeason?.episodes.map((ep) => (
                        <div
                          key={ep.id}
                          onClick={() => handlePlayEpisode(ep, currentSeason.seasonNumber)}
                          className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-[#7C3AED]/40 transition-all cursor-pointer group"
                        >
                          <div className="relative w-28 h-18 md:w-36 md:h-22 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                            <img
                              src={ep.thumbnail}
                              alt={ep.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded">
                              {ep.duration}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-white group-hover:text-[#A78BFA] transition-colors truncate">
                                {ep.episodeNumber}. {profile.language === 'ar' ? ep.titleAr : ep.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {profile.language === 'ar' ? ep.overviewAr : ep.overview}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Live TV: EPG Timeline Schedule */}
            {isChannel && (item as Channel).epgSchedule && (
              <div className="pt-6 border-t border-slate-800">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7C3AED]" />
                  {t.epgTitle}
                </h3>
                <div className="space-y-2.5">
                  {(item as Channel).epgSchedule.map((prog) => {
                    const progTitle = profile.language === 'ar' ? prog.titleAr : prog.title;
                    const progDesc = profile.language === 'ar' ? prog.synopsisAr : prog.synopsis;

                    return (
                      <div
                        key={prog.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          prog.isLive
                            ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-white'
                            : 'bg-slate-900/30 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#06B6D4]">
                              {prog.time} - {prog.endTime}
                            </span>
                            {prog.isLive && (
                              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                {t.liveBadge}
                              </span>
                            )}
                          </div>
                          {prog.isLive && (
                            <span className="text-xs text-slate-400 font-mono">
                              {prog.progressPercent}%
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold">{progTitle}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{progDesc}</p>

                        {prog.isLive && (
                          <div className="w-full h-1 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                              style={{ width: `${prog.progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
