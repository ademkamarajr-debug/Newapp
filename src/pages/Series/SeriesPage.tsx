import React, { useMemo, useState } from 'react';
import { Filter, Play, Search, Star, Tv } from 'lucide-react';
import { MediaCard } from '../../components/cards/MediaCard';
import { useApp } from '../../context/AppContext';
import { Series } from '../../types';

export const SeriesPage: React.FC = () => {
  const { series, history, startPlayback, openDetails, t, profile, isLoadingCatalog } = useApp();
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'latest'>('rating');

  // Featured series
  const featured = series.find((s) => s.featured) || series[0];

  // Continue watching series filter from history
  const continueWatchingSeries = useMemo(() => {
    return history.filter((h) => h.type === 'series');
  }, [history]);

  // Extract all unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => s.genres.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [series]);

  // Filtered series
  const filteredSeries = useMemo(() => {
    return series
      .filter((s) => {
        const matchesGenre = selectedGenre === 'all' || s.genres.includes(selectedGenre);
        const matchesSearch =
          searchQuery.trim() === '' ||
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.titleAr.includes(searchQuery) ||
          s.overview.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesGenre && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.year - a.year;
      });
  }, [series, selectedGenre, searchQuery, sortBy]);

  const handlePlayFeatured = () => {
    if (!featured) return;
    const ep = featured.seasons[0]?.episodes[0];
    if (ep) {
      startPlayback({
        id: `play-${ep.id}`,
        mediaId: featured.id,
        title: featured.title,
        titleAr: featured.titleAr,
        type: 'series',
        streamUrl: ep.streamUrl,
        isHls: ep.streamUrl.includes('.m3u8'),
        poster: featured.poster,
        seriesId: featured.id,
        seasonNumber: 1,
        episodeNumber: 1,
        episodeTitle: ep.title,
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Featured Series Hero Banner */}
      {featured && selectedGenre === 'all' && !searchQuery && (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="relative h-80 md:h-[420px] w-full">
            <img
              src={featured.backdrop}
              alt={featured.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top filter brightness-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-[#080B12]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080B12]/90 via-[#080B12]/40 to-transparent" />

            <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 max-w-2xl">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider uppercase">
                  {t.tabSeries}
                </span>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{featured.rating}</span>
                </div>
                <span className="text-xs text-slate-300">
                  {featured.year} · {featured.totalSeasons} {t.seasons}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                {profile.language === 'ar' ? featured.titleAr : featured.title}
              </h1>

              <p className="text-xs md:text-sm text-slate-300 mt-2 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl">
                {profile.language === 'ar' ? featured.overviewAr : featured.overview}
              </p>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handlePlayFeatured}
                  className="py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#7C3AED]/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  {t.watchNow}
                </button>
                <button
                  onClick={() => openDetails(featured)}
                  className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                >
                  {t.moreInfo}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching Series Shelf */}
      {continueWatchingSeries.length > 0 && selectedGenre === 'all' && !searchQuery && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#7C3AED]" />
            {t.continueWatching}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {continueWatchingSeries.map((hist) => {
              const matched = series.find((s) => s.id === hist.mediaId);
              if (!matched) return null;
              return (
                <div
                  key={hist.id}
                  onClick={() => openDetails(matched)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-[#7C3AED]/40 transition-all cursor-pointer group"
                >
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                    <img
                      src={hist.poster}
                      alt={hist.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-wider">
                      {t.season} {hist.seasonNumber} · Ep. {hist.episodeNumber}
                    </span>
                    <h4 className="text-sm font-semibold text-white truncate mt-0.5 group-hover:text-[#A78BFA] transition-colors">
                      {profile.language === 'ar' ? hist.titleAr : hist.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{hist.episodeTitle}</p>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                        style={{ width: `${hist.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">{t.popularSeries}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {filteredSeries.length} {profile.language === 'ar' ? 'سلسلة متوفرة' : 'séries disponibles'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] transition-colors w-44 md:w-56"
              />
            </div>

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="rating">{t.sortPopular}</option>
              <option value="latest">{t.sortLatest}</option>
            </select>
          </div>
        </div>

        {/* Genre Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedGenre === 'all'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.allGenres}
          </button>
          {allGenres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Series Grid */}
      {isLoadingCatalog && series.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80">
          <Tv className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">{t.noResults}</h3>
          <p className="text-xs text-slate-500 mt-1">{t.noResultsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSeries.map((ser) => (
            <MediaCard key={ser.id} item={ser} aspectRatio="poster" />
          ))}
        </div>
      )}
    </div>
  );
};
