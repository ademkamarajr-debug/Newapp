import React from 'react';
import { Heart, Play, Radio, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Channel, Movie, Series } from '../../types';

interface MediaCardProps {
  item: Movie | Series | Channel;
  aspectRatio?: 'poster' | 'landscape';
  showProgress?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  aspectRatio = 'poster',
  showProgress,
}) => {
  const { openDetails, startPlayback, isFavorite, toggleFavorite, t, profile } = useApp();

  const isChannel = 'number' in item;
  const isSeries = 'seasons' in item;
  const isMovie = !isChannel && !isSeries;

  const favorited = isFavorite(item.id);

  const title = isChannel
    ? (profile.language === 'ar' ? (item as Channel).nameAr : (item as Channel).name)
    : (profile.language === 'ar' ? (item as Movie).titleAr : (item as Movie).title);
  const image = isChannel
    ? (item as Channel).logo
    : aspectRatio === 'landscape'
    ? (item as Movie).backdrop || (item as Movie).poster
    : (item as Movie).poster;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isChannel) {
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
    } else if (isMovie) {
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
    } else {
      const ser = item as Series;
      const ep = ser.seasons[0]?.episodes[0];
      if (ep) {
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
          seasonNumber: 1,
          episodeNumber: 1,
          episodeTitle: ep.title,
        });
      }
    }
  };

  return (
    <div
      onClick={() => openDetails(item)}
      className="group relative flex flex-col rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-[#7C3AED]/50 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-xl hover:shadow-[#7C3AED]/10 hover:-translate-y-1"
    >
      {/* Media Image Container */}
      <div
        className={`relative w-full overflow-hidden bg-slate-950 ${
          aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[3/4]'
        }`}
      >
        <img
          src={image}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Ambient Overlay Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Badges: Top Right Favorite & Top Left Live / Quality */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div>
            {isChannel && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {t.liveBadge}
              </span>
            )}
            {!isChannel && (item as Movie).rating && (
              <span className="bg-black/70 backdrop-blur-md text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {(item as Movie).rating}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={`p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
              favorited
                ? 'bg-rose-500/80 text-white'
                : 'bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white'
            }`}
            title={favorited ? t.removeFromFavorites : t.addToFavorites}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/30 backdrop-blur-xs">
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center shadow-xl shadow-[#7C3AED]/40 transform scale-90 group-hover:scale-100 transition-transform cursor-pointer"
            title={t.watchNow}
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Progress Bar (if continuing watch) */}
        {showProgress !== undefined && showProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-10">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
              style={{ width: `${Math.min(100, showProgress)}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>
              {isChannel
                ? (item as Channel).country
                : `${(item as Movie).year} · ${
                    isSeries
                      ? `${(item as Series).totalSeasons} ${t.seasons}`
                      : (item as Movie).duration
                  }`}
            </span>
            {isChannel && (
              <span className="font-mono text-[#06B6D4] text-[10px]">
                {(item as Channel).resolution}
              </span>
            )}
          </div>
          <h3 className="text-xs md:text-sm font-semibold text-white truncate group-hover:text-[#A78BFA] transition-colors">
            {title}
          </h3>
        </div>

        {isChannel && (
          <p className="text-[11px] text-slate-400 truncate mt-1">
            {profile.language === 'ar'
              ? (item as Channel).currentProgram.titleAr
              : (item as Channel).currentProgram.title}
          </p>
        )}
      </div>
    </div>
  );
};
