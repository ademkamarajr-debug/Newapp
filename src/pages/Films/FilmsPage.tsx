
import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Film,
  Heart,
  Info,
  Play,
  Search,
  Star,
} from 'lucide-react';
import { MediaCard } from '../../components/cards/MediaCard';
import { useApp } from '../../context/AppContext';

export const FilmsPage: React.FC = () => {
  const {
    movies,
    history,
    startPlayback,
    openDetails,
    t,
    profile,
    isLoadingCatalog,
  } = useApp();

  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'latest'>('rating');
  const [visibleCount, setVisibleCount] = useState(40);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach((movie) => {
      (movie.genres || []).forEach((genre) => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies
      .filter((movie) => {
        const matchesGenre =
          selectedGenre === 'all' ||
          (movie.genres || []).includes(selectedGenre);

        const matchesSearch =
          !normalizedSearch ||
          (movie.title || '').toLowerCase().includes(normalizedSearch) ||
          (movie.titleAr || '').includes(searchQuery.trim()) ||
          (movie.overview || '').toLowerCase().includes(normalizedSearch);

        return matchesGenre && matchesSearch;
      })
      .sort((a, b) =>
        sortBy === 'rating'
          ? (b.rating || 0) - (a.rating || 0)
          : (b.year || 0) - (a.year || 0)
      );
  }, [movies, selectedGenre, normalizedSearch, searchQuery, sortBy]);

  useEffect(() => {
    setVisibleCount(40);
  }, [selectedGenre, normalizedSearch, sortBy]);

  const featured = useMemo(
    () => movies.find((movie) => movie.featured) || movies[0],
    [movies]
  );

  const continueWatchingMovies = useMemo(
    () => history.filter((item) => item.type === 'movie').slice(0, 6),
    [history]
  );

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
      {featured && selectedGenre === 'all' && !searchQuery && (
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="relative h-80 w-full md:h-[450px]">
            <img
              src={featured.backdrop || featured.poster}
              alt={featured.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-[#080B12]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080B12]/90 via-[#080B12]/30 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 max-w-2xl md:bottom-12 md:left-12">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#7C3AED] px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                  {t.tabFilms}
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {featured.rating}
                </span>
                <span className="text-xs text-slate-300">
                  {featured.year} · {featured.duration}
                </span>
              </div>

              <h1 className="text-2xl font-black leading-tight text-white md:text-5xl">
                {profile.language === 'ar' ? featured.titleAr : featured.title}
              </h1>

              <p className="mt-2 line-clamp-3 max-w-xl text-sm text-slate-300">
                {profile.language === 'ar'
                  ? featured.overviewAr
                  : featured.overview}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayFeatured}
                  className="flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6D28D9]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {t.watchNow}
                </button>
                <button
                  type="button"
                  onClick={() => openDetails(featured)}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-xs font-medium text-white hover:bg-white/20"
                >
                  <Info className="h-4 w-4" />
                  {t.moreInfo}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {continueWatchingMovies.length > 0 &&
        selectedGenre === 'all' &&
        !searchQuery && (
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Clock className="h-4 w-4 text-[#7C3AED]" />
              {t.continueWatching}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {continueWatchingMovies.map((item) => {
                const matched = movies.find(
                  (movie) => movie.id === item.mediaId
                );
                if (!matched) return null;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => openDetails(matched)}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-left hover:bg-slate-800/60"
                  >
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-950">
                      <img
                        src={item.poster || matched.poster}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[#06B6D4]">
                        {item.progressPercent}% 
                      </span>
                      <h4 className="mt-1 truncate text-sm font-semibold text-white">
                        {profile.language === 'ar'
                          ? item.titleAr
                          : item.title}
                      </h4>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {matched.duration}
                      </p>
                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-[#7C3AED]"
                          style={{
                            width: `${Math.min(100, Math.max(0, item.progressPercent || 0))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
              <Film className="h-5 w-5 text-[#7C3AED]" />
              {t.trending}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {filteredMovies.length}{' '}
              {profile.language === 'ar'
                ? 'فيلم متاح'
                : 'films disponibles'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-44 rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none md:w-56"
              />
            </div>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as 'rating' | 'latest')
              }
              className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="rating">{t.sortPopular}</option>
              <option value="latest">{t.sortLatest}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedGenre('all')}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold ${
              selectedGenre === 'all'
                ? 'bg-[#7C3AED] text-white'
                : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            {t.allGenres}
          </button>

          {allGenres.map((genre) => (
            <button
              type="button"
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold ${
                selectedGenre === genre
                  ? 'bg-[#7C3AED] text-white'
                  : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {isLoadingCatalog && movies.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="aspect-[3/4] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
            />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 py-16 text-center">
          <Film className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-300">
            {t.noResults}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t.noResultsDesc}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMovies.slice(0, visibleCount).map((movie) => (
              <MediaCard
                key={movie.id}
                item={movie}
                aspectRatio="poster"
              />
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
                className="rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6D28D9]"
              >
                {profile.language === 'ar'
                  ? `عرض المزيد (${filteredMovies.length - visibleCount})`
                  : `Afficher plus (${filteredMovies.length - visibleCount})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
