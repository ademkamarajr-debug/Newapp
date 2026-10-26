import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Film,
  Globe,
  Heart,
  Info,
  Palette,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Trash2,
  Tv,
  User,
} from 'lucide-react';
import { MediaCard } from '../../components/cards/MediaCard';
import { useApp } from '../../context/AppContext';
import { Language, UserProfile } from '../../types';

export const ProfilePage: React.FC = () => {
  const {
    profile,
    updateUserProfile,
    history,
    clearHistory,
    favorites,
    movies,
    series,
    channels,
    catalogMeta,
    refreshCatalog,
    isLoadingCatalog,
    showToast,
    t,
  } = useApp();

  // Active sub-tab inside Profile (Strictly personal preferences & about status)
  const [subTab, setSubTab] = useState<'profile' | 'favorites' | 'history' | 'playback' | 'about'>('profile');

  // Profile form state
  const [nameInput, setNameInput] = useState(profile.name);
  const [avatarInput, setAvatarInput] = useState(profile.avatar);

  // Available avatars
  const availableAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  ];

  // Favorited items
  const favoritedItems = [
    ...movies.filter((m) => favorites.includes(m.id)),
    ...series.filter((s) => favorites.includes(s.id)),
    ...channels.filter((c) => favorites.includes(c.id)),
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: nameInput.trim() || profile.name,
      avatar: avatarInput,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-[#101827] border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <img
            src={profile.avatar}
            alt={profile.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#7C3AED]/40 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{profile.name}</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">
                VIP Premium
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">{profile.email}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
              <span>
                {favorites.length} {t.myFavorites}
              </span>
              <span>·</span>
              <span>
                {history.length} {profile.language === 'ar' ? 'عنصر في السجل' : 'titres vus'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Language Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl">
          <Globe className="w-4 h-4 text-[#7C3AED] ml-1.5" />
          <button
            onClick={() => updateUserProfile({ language: 'fr' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              profile.language === 'fr'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => updateUserProfile({ language: 'ar' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              profile.language === 'ar'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            العربية
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800/80 pb-3 no-scrollbar">
        {[
          { id: 'profile', label: t.editProfile, icon: User },
          { id: 'favorites', label: t.myFavorites, icon: Heart },
          { id: 'history', label: t.watchHistory, icon: Clock },
          { id: 'playback', label: t.playbackSettings, icon: Sliders },
          { id: 'about', label: t.aboutTitle, icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: Profile Edit */}
      {subTab === 'profile' && (
        <div className="max-w-2xl bg-[#101827] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[#7C3AED]" />
            {t.editProfile}
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                {t.displayName}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-3">
                Choisir un avatar
              </label>
              <div className="flex items-center gap-3">
                {availableAvatars.map((av, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatarInput(av)}
                    className={`relative rounded-2xl overflow-hidden p-0.5 cursor-pointer transition-all ${
                      avatarInput === av ? 'ring-4 ring-[#7C3AED]' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={av}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Theme Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-3">
                {t.theme}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'cinema-dark', name: t.themeCinemaDark, color: '#080B12' },
                  { id: 'midnight-navy', name: t.themeMidnightNavy, color: '#101827' },
                  { id: 'deep-purple', name: t.themeDeepPurple, color: '#7C3AED' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => updateUserProfile({ theme: th.id as any })}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-20 ${
                      profile.theme === th.id
                        ? 'bg-slate-800/80 border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: th.color }}
                    />
                    <span className="text-xs font-medium text-slate-200">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm shadow-lg shadow-[#7C3AED]/30 transition-transform active:scale-95 cursor-pointer"
            >
              {t.saveChanges}
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 2: Favorites */}
      {subTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-current" />
              {t.myFavorites}
            </h2>
            <span className="text-xs text-slate-400">
              {favoritedItems.length} {profile.language === 'ar' ? 'عنصر' : 'favoris'}
            </span>
          </div>

          {favoritedItems.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#101827] border border-slate-800">
              <Heart className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">{t.emptyFavorites}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.emptyFavoritesDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favoritedItems.map((item) => (
                <MediaCard key={item.id} item={item} aspectRatio="poster" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Watch History */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#7C3AED]" />
              {t.watchHistory}
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.clearHistory}
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#101827] border border-slate-800">
              <Clock className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">{t.emptyHistory}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.emptyHistoryDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((hist) => {
                const title = profile.language === 'ar' ? hist.titleAr : hist.title;
                return (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#101827] border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={hist.poster}
                        alt={title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-20 rounded-xl object-cover bg-slate-900 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {hist.type === 'channel'
                              ? t.tabLive
                              : hist.type === 'movie'
                              ? t.tabFilms
                              : t.tabSeries}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {hist.progressPercent}% {profile.language === 'ar' ? 'مكتمل' : 'vu'}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
                        {hist.episodeTitle && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {t.season} {hist.seasonNumber} · {t.episodes} {hist.episodeNumber} : {hist.episodeTitle}
                          </p>
                        )}
                        <div className="w-full max-w-xs h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                            style={{ width: `${hist.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Playback Settings */}
      {subTab === 'playback' && (
        <div className="max-w-2xl bg-[#101827] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7C3AED]" />
            {t.playbackSettings}
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {t.defaultQuality}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['auto', '1080p', '720p', '480p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => updateUserProfile({ defaultQuality: q })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase cursor-pointer transition-colors ${
                    profile.defaultQuality === q
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white block">
                {t.autoplayNextEpisode}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Enchaîne sans interruption à la fin de chaque épisode.
              </span>
            </div>
            <button
              onClick={() => updateUserProfile({ autoplayNext: !profile.autoplayNext })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                profile.autoplayNext ? 'bg-[#7C3AED]' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  profile.autoplayNext ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {t.preferredAudioTrack}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fr', label: 'Français' },
                { id: 'en', label: 'English' },
                { id: 'ar', label: 'العربية' },
              ].map((aud) => (
                <button
                  key={aud.id}
                  onClick={() => updateUserProfile({ preferredAudio: aud.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    profile.preferredAudio === aud.id
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {t.preferredSubtitleTrack}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'off', label: 'Désactivé' },
                { id: 'fr', label: 'Français' },
                { id: 'ar', label: 'العربية' },
                { id: 'en', label: 'English' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => updateUserProfile({ preferredSubtitle: sub.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    profile.preferredSubtitle === sub.id
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Preconfigured App Info & Status (Replaces all M3U inputs) */}
      {subTab === 'about' && (
        <div className="max-w-2xl bg-[#101827] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                {t.aboutTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{t.providerManagedDesc}</p>
            </div>
            <button
              onClick={refreshCatalog}
              disabled={isLoadingCatalog}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title={t.syncCatalog}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCatalog ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.syncCatalog}</span>
            </button>
          </div>

          {/* Dynamic Status Indicator Banner */}
          {catalogMeta?.status === 'connected' ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-300 block">
                  {catalogMeta.providerTitle || 'Bouquet IPTV Propriétaire Connecté'}
                </span>
                <span className="text-[11px] text-emerald-400/80 mt-0.5 block leading-relaxed">
                  {catalogMeta.statusMessage}
                </span>
              </div>
            </div>
          ) : catalogMeta?.status === 'error' ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-rose-300 block">
                  Erreur de connexion au fournisseur IPTV
                </span>
                <span className="text-[11px] text-rose-400/80 mt-0.5 block leading-relaxed">
                  {catalogMeta.statusMessage}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300 block">
                  En attente de configuration de votre playlist IPTV
                </span>
                <span className="text-[11px] text-amber-400/80 mt-1 block leading-relaxed">
                  L'application utilise actuellement le bouquet de secours vérifié. Pour connecter votre flux privé, indiquez votre URL dans la variable serveur <code className="bg-amber-400/10 px-1 py-0.5 rounded text-amber-200 font-mono text-[10px]">IPTV_PLAYLIST_URL</code> dans votre fichier <code className="bg-amber-400/10 px-1 py-0.5 rounded text-amber-200 font-mono text-[10px]">.env</code> ou transmettez-la dans le chat de développement.
                </span>
              </div>
            </div>
          )}

          {/* Content Bouquet Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-2xl font-black text-white font-mono block">
                {channels.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t.channelsCount}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-2xl font-black text-white font-mono block">
                {movies.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t.filmsCount}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-2xl font-black text-white font-mono block">
                {series.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t.seriesCount}
              </span>
            </div>
          </div>

          {/* Technical Engine Specifications */}
          <div className="space-y-2 pt-2 text-xs text-slate-400">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <span>Application</span>
              <span className="text-slate-200 font-semibold">Dhouiher TV v2.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <span>Architecture</span>
              <span className="text-slate-200 font-semibold">Owner-Managed Preconfigured Core</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <span>Streaming Engine</span>
              <span className="text-[#06B6D4] font-medium">{t.engineVersion}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Security</span>
              <span className="text-emerald-400 font-medium">Server-Isolated Credentials</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
