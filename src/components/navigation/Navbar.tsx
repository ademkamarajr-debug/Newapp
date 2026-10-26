import React from 'react';
import { Film, Radio, Search, Tv, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabId } from '../../types';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, t, profile, isSearchOpen, setIsSearchOpen } = useApp();

  const navItems: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'live', label: t.tabLive, icon: Radio },
    { id: 'series', label: t.tabSeries, icon: Tv },
    { id: 'films', label: t.tabFilms, icon: Film },
    { id: 'profile', label: t.tabProfile, icon: User },
  ];

  return (
    <>
      {/* Desktop Top Bar adhering to 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 w-full bg-[#080B12]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element with logo icon) */}
          <button
            onClick={() => setActiveTab('films')}
            className="flex items-center gap-2.5 text-left group cursor-pointer whitespace-nowrap shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white shadow-lg shadow-[#7C3AED]/25 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-[#A78BFA] transition-colors leading-none">
                DHOUIHER <span className="text-[#06B6D4]">TV</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                {profile.language === 'ar' ? 'المنصة السينمائية' : 'STREAMING & IPTV'}
              </span>
            </div>
          </button>

          {/* Zone 2: Exactly 4 Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 py-1 relative whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-[-14px] left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary contextual Action: Search & Quick Profile Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              title={t.search}
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline text-xs text-slate-400 max-w-[120px] truncate">
                {t.searchPlaceholder}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
            >
              <img
                src={profile.avatar}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#7C3AED]/40"
              />
              <span className="hidden lg:inline text-xs font-medium text-slate-200 max-w-[100px] truncate">
                {profile.name}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080B12]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 safe-bottom">
        <div className="grid grid-cols-4 items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative cursor-pointer transition-colors ${
                  isActive ? 'text-[#7C3AED]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-[70px]">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
