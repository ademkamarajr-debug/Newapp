import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Film,
  Flame,
  Heart,
  Info,
  Play,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { MediaCard } from '../../components/cards/MediaCard';
import { useApp } from '../../context/AppContext';
import { Movie } from '../../types';

export const FilmsPage: React.FC = () => {
  const { movies, history, startPlayback, openDetails, t, profile, isLoadingCatalog } = useApp();
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'latest'>('rating');
  const [visibleCount, setVisibleCount] = useState(40);

useEffect(() => {
  setVisibleCount(40);
}, [filteredMovies]);

  // Featured movie
  const featured = movies.find((m) => m.featured) || movies[0];

  // Continue watching movies from history
  const continueWatchingMovies = useMemo(() => {
    return history.filter((h) => h.type === 'movie');
  }, [history]);

  // Extract all unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [movies]);

  // Filtered movies
  const filteredMovies = useMemo(() => {
    return movies
      .filter((m) => {
        const matchesGenre = selectedGenre === 'all' || m.genres.includes(selectedGenre);
        const matchesSearch =
          searchQuery.trim() === '' ||
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.titleAr.includes(searchQuery) ||
          m.overview.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesGenre && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.year - a.year;
      });
  }, [movies, selectedGenre, searchQuery, sortBy]);

  const handlePlayFeatured = () => {
    if (!featured) return;
    startPlayback({
      id: `play-${featured.id}`,
      mediaId: featured.id,
      title: featured.title,
      titleAr: featured.titleAr,
      type: 'movie',
      streamUrl: featured.streamUrl,
      backupStreamUrl: featured.backupStreamUrl,
      isHls: featured.isHls,
      poster: featured.poster,
      duration: featured.durationSeconds,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Featured Movie Cinematic Hero Banner */}
      {featured && selectedGenre === 'all' && !searchQuery && (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="relative h-80 md:h-[450px] w-full">
            <img
              src={featured.backdrop}
              alt={featured.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-65"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-[#080B12]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080B12]/95 via-[#080B12]/40 to-transparent" />

            <div className="absolute bottom-6 md:bottom-12 left-6 md:left-12 right-6 max-w-2xl">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider uppercase">
                  {t.tabFilms}
                </span>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{featured.rating}</span>
                </div>
                <span className="text-xs text-slate-300">
                  {featured.year} · {featured.duration}
                </span>
                <span className="text-xs text-[#06B6D4] font-medium hidden sm:inline">
                  · {featured.quality}
                </span>
              </div>

              <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {profile.language === 'ar' ? featured.titleAr : featured.title}
              </h1>

              <p className="text-xs md:text-sm text-slate-300 italic mt-1 font-light">
                "{profile.language === 'ar' ? featured.taglineAr : featured.tagline}"
              </p>

              <p className="text-xs md:text-sm text-slate-300 mt-2.5 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl">
                {profile.language === 'ar' ? featured.overviewAr : featured.overview}
              </p>

              <div className="flex items-center gap-3.5 mt-5">
                <button
                  onClick={handlePlayFeatured}
                  className="py-3 px-7 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#7C3AED]/35 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  {t.watchNow}
                </button>
                <button
                  onClick={() => openDetails(featured)}
                  className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Info className="w-4 h-4" />
                  {t.moreInfo}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching Movies Shelf */}
      {continueWatchingMovies.length > 0 && selectedGenre === 'all' && !searchQuery && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7C3AED]" />
            {t.continueWatching}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {continueWatchingMovies.map((hist) => {
              const matched = movies.find((m) => m.id === hist.mediaId);
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
                    <span className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-wider">
                      {hist.progressPercent}% {profile.language === 'ar' ? 'مكتمل' : 'regardé'}
                    </span>
                    <h4 className="text-sm font-semibold text-white truncate mt-0.5 group-hover:text-[#A78BFA] transition-colors">
                      {profile.language === 'ar' ? hist.titleAr : hist.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{matched.duration}</p>
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
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-[#7C3AED]" />
              {t.trending}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {filteredMovies.length} {profile.language === 'ar' ? 'فيلم متاح بجودة فائقة' : 'films disponibles en qualité cinéma'}
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

      {/* Movies Grid */}
      {isLoadingCatalog && movies.length === 0 ? (
        <>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {filteredMovies.slice(0, visibleCount).map((movie) => (
      <MediaCard key={movie.id} item={movie} aspectRatio="poster" />
    ))}
  </div>

  {visibleCount < filteredMovies.length && (
    <div className="flex justify-center pt-6">
      <button
        type="button"
        onClick={() =>
          setVisibleCount((count) =>
            Math.min(count + 40, filteredMovies.length)
          )
        }
        className="px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-colors"
      >
        عرض المزيد ({filteredMovies.length - visibleCount})
      </button>
    </div>
  )}
</>
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80">
          <Film className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">{t.noResults}</h3>
          <p className="text-xs text-slate-500 mt-1">{t.noResultsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMovies.map((movie) => (
            <MediaCard key={movie.id} item={movie} aspectRatio="poster" />
          ))}
        </div>
      )}
    </div>
  );
};
