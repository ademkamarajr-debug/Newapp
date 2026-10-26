import React, { useMemo, useState } from 'react';
import { Film, Play, Radio, Search, Tv, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Channel, Movie, Series } from '../../types';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, movies, series, channels, startPlayback, openDetails, t, profile } =
    useApp();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movies' | 'series' | 'channels'>('all');

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const matchedMovies = movies
      .filter((m) => m.title.toLowerCase().includes(q) || m.titleAr.includes(q) || m.genres.some((g) => g.toLowerCase().includes(q)))
      .map((m) => ({ ...m, resultType: 'movie' as const }));

    const matchedSeries = series
      .filter((s) => s.title.toLowerCase().includes(q) || s.titleAr.includes(q) || s.genres.some((g) => g.toLowerCase().includes(q)))
      .map((s) => ({ ...s, resultType: 'series' as const }));

    const matchedChannels = channels
      .filter((c) => c.name.toLowerCase().includes(q) || c.nameAr.includes(q) || c.category.toLowerCase().includes(q))
      .map((c) => ({ ...c, resultType: 'channel' as const }));

    let combined: Array<
      | (Movie & { resultType: 'movie' })
      | (Series & { resultType: 'series' })
      | (Channel & { resultType: 'channel' })
    > = [];

    if (filterType === 'all' || filterType === 'movies') combined = [...combined, ...matchedMovies];
    if (filterType === 'all' || filterType === 'series') combined = [...combined, ...matchedSeries];
    if (filterType === 'all' || filterType === 'channels') combined = [...combined, ...matchedChannels];

    return combined;
  }, [query, filterType, movies, series, channels]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-4 md:p-10 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#101827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden mt-8 md:mt-12 flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#7C3AED]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm md:text-base outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
          >
            {t.close}
          </button>
        </div>

        {/* Filter Category Buttons */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: profile.language === 'ar' ? 'الكل' : 'Tous' },
              { id: 'movies', label: t.tabFilms },
              { id: 'series', label: t.tabSeries },
              { id: 'channels', label: t.tabLive },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                filterType === tab.id
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{t.search}</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">{t.noResults}</p>
              <p className="text-xs text-slate-500 mt-1">{t.noResultsDesc}</p>
            </div>
          ) : (
            filteredResults.map((item) => {
              const isChannel = item.resultType === 'channel';
              const isMovie = item.resultType === 'movie';
              const poster = isChannel ? (item as Channel).logo : (item as Movie | Series).poster;
              const title = isChannel
                ? (profile.language === 'ar' ? (item as Channel).nameAr : (item as Channel).name)
                : (profile.language === 'ar' ? (item as Movie).titleAr : (item as Movie).title);

              return (
                <div
                  key={`${item.resultType}-${item.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 transition-all group"
                >
                  <div
                    onClick={() => {
                      setIsSearchOpen(false);
                      openDetails(item as any);
                    }}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <img
                      src={poster}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-16 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {isChannel ? t.tabLive : isMovie ? t.tabFilms : t.tabSeries}
                        </span>
                        {!isChannel && (
                          <span className="text-xs text-amber-400 font-semibold">
                            ★ {(item as Movie).rating}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {isChannel ? (item as Channel).resolution : `${(item as Movie).year}`}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#A78BFA] transition-colors">
                        {title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {isChannel
                          ? (item as Channel).currentProgram.title
                          : (item as Movie).overview}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3">
                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
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
                      }}
                      className="p-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors cursor-pointer"
                      title={t.watchNow}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
