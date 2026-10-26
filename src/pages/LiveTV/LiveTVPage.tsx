import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  Flame,
  Heart,
  Play,
  Radio,
  Search,
  Tv,
} from 'lucide-react';
import { MediaCard } from '../../components/cards/MediaCard';
import { useApp } from '../../context/AppContext';
import { Channel, ChannelCategory } from '../../types';

export const LiveTVPage: React.FC = () => {
  const { channels, favorites, startPlayback, openDetails, t, profile, isLoadingCatalog } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: profile.language === 'ar' ? 'جميع القنوات' : 'Toutes les chaînes' },
    { id: 'general', label: t.catGeneral },
    { id: 'news', label: t.catNews },
    { id: 'sports', label: t.catSports },
    { id: 'movies', label: t.catMovies },
    { id: 'entertainment', label: t.catEntertainment },
    { id: 'kids', label: t.catKids },
    { id: 'documentaries', label: t.catDocumentaries },
  ];

  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.nameAr.includes(searchQuery) ||
        ch.currentProgram.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = !onlyFavorites || favorites.includes(ch.id);

      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [channels, selectedCategory, searchQuery, onlyFavorites, favorites]);

  // Featured live channel
  const featuredChannel = channels[0];

  const handlePlayFeatured = () => {
    if (!featuredChannel) return;
    startPlayback({
      id: `play-${featuredChannel.id}`,
      mediaId: featuredChannel.id,
      title: featuredChannel.name,
      titleAr: featuredChannel.nameAr,
      type: 'channel',
      streamUrl: featuredChannel.streamUrl,
      backupStreamUrl: featuredChannel.backupStreamUrl,
      isHls: featuredChannel.isHls,
      poster: featuredChannel.logo,
      channelCategory: featuredChannel.category,
      channelLogo: featuredChannel.logo,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Featured Channel Spotlight Hero */}
      {featuredChannel && selectedCategory === 'all' && !searchQuery && !onlyFavorites && (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="relative h-72 md:h-96 w-full">
            <img
              src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1600&auto=format&fit=crop&q=80"
              alt={featuredChannel.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-[#080B12]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080B12]/90 via-[#080B12]/40 to-transparent" />

            <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t.liveBadge}
                </span>
                <span className="text-xs font-mono text-[#06B6D4] font-semibold">
                  {featuredChannel.resolution}
                </span>
                <span className="text-xs text-slate-400">· {featuredChannel.country}</span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                {profile.language === 'ar' ? featuredChannel.nameAr : featuredChannel.name}
              </h1>

              <div className="mt-2.5 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 max-w-lg">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span className="font-semibold text-white truncate">
                    {profile.language === 'ar'
                      ? featuredChannel.currentProgram.titleAr
                      : featuredChannel.currentProgram.title}
                  </span>
                  <span className="font-mono text-[11px] text-[#06B6D4] shrink-0 ml-2">
                    {featuredChannel.currentProgram.time}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                    style={{ width: `${featuredChannel.currentProgram.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handlePlayFeatured}
                  className="py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#7C3AED]/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  {t.watchNow}
                </button>
                <button
                  onClick={() => openDetails(featuredChannel)}
                  className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                >
                  {t.epgTitle}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#7C3AED]" />
              {t.liveChannels}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {filteredChannels.length} {profile.language === 'ar' ? 'قناة متاحة' : 'chaînes disponibles en direct'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
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

            {/* Favorites filter toggle */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                onlyFavorites
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={t.myFavorites}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{t.myFavorites}</span>
            </button>
          </div>
        </div>

        {/* Categories Segmented Filter Control */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channels Grid */}
      {isLoadingCatalog && channels.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-video rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80">
          <Tv className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">{t.noResults}</h3>
          <p className="text-xs text-slate-500 mt-1">{t.noResultsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredChannels.map((channel) => (
            <MediaCard key={channel.id} item={channel} aspectRatio="landscape" />
          ))}
        </div>
      )}
    </div>
  );
};
