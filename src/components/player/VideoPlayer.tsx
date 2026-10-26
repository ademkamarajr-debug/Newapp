import React, { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Maximize,
  Minimize,
  Moon,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Settings,
  Tv,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlaybackItem } from '../../types';

interface VideoPlayerProps {
  item: PlaybackItem;
  onClose: () => void;
  onNextEpisode?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ item, onClose, onNextEpisode }) => {
  const { t, profile, recordProgress, channels, startPlayback } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(item.currentTime || 0);
  const [duration, setDuration] = useState(item.duration || 0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState(item.streamUrl);
  const [selectedQuality, setSelectedQuality] = useState<'auto' | '1080p' | '720p' | '480p'>('auto');
  const [selectedAudio, setSelectedAudio] = useState(profile.preferredAudio);
  const [selectedSubtitle, setSelectedSubtitle] = useState(profile.preferredSubtitle);

  const isLive = item.type === 'channel';

  // Activity timer to hide controls
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettingsMenu(false);
      }, 3500);
    }
  }, [isPlaying]);

  // Clean up Hls instance
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Initialize stream
  const initializeStream = useCallback(
    (url: string) => {
      const video = videoRef.current;
      if (!video) return;

      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');
      destroyHls();

      const isHlsStream = url.includes('.m3u8') || url.includes('/hls/') || item.isHls;

      if (isHlsStream) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });

          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (item.currentTime && item.currentTime > 0 && !isLive) {
              video.currentTime = item.currentTime;
            }
            video.play().then(() => setIsPlaying(true)).catch(() => {
              // Browser autoplay policy might require user click or mute
              setIsPlaying(false);
            });
          });

          hls.on(Hls.Events.BUFFER_APPENDING, () => {
            setIsBuffering(true);
          });

          hls.on(Hls.Events.BUFFER_APPENDED, () => {
            setIsBuffering(false);
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('HLS Network Error, attempting reload:', data);
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('HLS Media Error, recovering:', data);
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('Fatal HLS playback error:', data);
                  destroyHls();
                  setHasError(true);
                  setErrorMessage(t.streamErrorDesc);
                  setIsLoading(false);
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Safari / iOS HLS
          video.src = url;
          if (item.currentTime && item.currentTime > 0 && !isLive) {
            video.currentTime = item.currentTime;
          }
          video.play().then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          }).catch(() => {
            setIsPlaying(false);
            setIsLoading(false);
          });
        } else {
          setHasError(true);
          setErrorMessage('Format HLS non supporté nativement par ce navigateur.');
          setIsLoading(false);
        }
      } else {
        // Direct MP4 / WebM
        video.src = url;
        if (item.currentTime && item.currentTime > 0 && !isLive) {
          video.currentTime = item.currentTime;
        }
        video.play().then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }).catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    },
    [destroyHls, item.currentTime, item.isHls, isLive, t.streamErrorDesc]
  );

  // Mount effect
  useEffect(() => {
    initializeStream(activeStreamUrl);
    return () => {
      destroyHls();
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [activeStreamUrl, destroyHls, initializeStream]);

  // Video listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsBuffering(false);
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(t.streamErrorDesc);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, [t.streamErrorDesc]);

  // Periodic watch progress recording
  useEffect(() => {
    if (!isPlaying || isLive || duration <= 0) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration;
        const percent = Math.min(100, Math.round((cur / dur) * 100));

        recordProgress({
          mediaId: item.mediaId,
          type: item.type,
          title: item.title,
          titleAr: item.titleAr,
          poster: item.poster,
          progressPercent: percent,
          currentTime: Math.floor(cur),
          duration: Math.floor(dur),
          seasonNumber: item.seasonNumber,
          episodeNumber: item.episodeNumber,
          episodeTitle: item.episodeTitle,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, isLive, duration, item, recordProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
      }
      handleUserActivity();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isFullscreen, onClose, handleUserActivity]);

  // Handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((e) => console.warn(e));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const seekDelta = (seconds: number) => {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || isLive) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
  };

  const changeVolume = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    setVolume(val);
    video.volume = val;
    if (val === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    setIsMuted(next);
    video.muted = next;
  };

  const changeSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    setPlaybackSpeed(speed);
    video.playbackRate = speed;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch((e) => console.warn(e));
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRetry = () => {
    initializeStream(activeStreamUrl);
  };

  const handleSwitchToBackup = () => {
    if (item.backupStreamUrl) {
      setActiveStreamUrl(item.backupStreamUrl);
    } else {
      // Default rock-solid public test stream
      setActiveStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onTouchStart={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Loading & Buffering Indicator */}
      {(isLoading || isBuffering) && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none z-20">
          <div className="w-14 h-14 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-medium text-slate-200 tracking-wide">
            {isLoading ? t.streamLoading : t.streamBuffering}
          </span>
        </div>
      )}

      {/* Playback Error Modal / Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080B12]/90 backdrop-blur-md z-30 p-6">
          <div className="max-w-md w-full bg-[#101827] border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t.streamErrorTitle}</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {errorMessage || t.streamErrorDesc}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t.retry}
              </button>
              <button
                onClick={handleSwitchToBackup}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {t.loadBackupStream}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel Switcher Overlay for Live TV */}
      {showChannelDrawer && isLive && (
        <div className="absolute inset-y-0 right-0 w-80 bg-[#101827]/95 backdrop-blur-lg border-l border-slate-800 z-40 p-4 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-[#7C3AED]" />
              <h4 className="text-sm font-semibold text-white">{t.channelSwitch}</h4>
            </div>
            <button
              onClick={() => setShowChannelDrawer(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {channels.map((ch) => {
              const isSelected = ch.id === item.mediaId;
              const chTitle = profile.language === 'ar' ? ch.nameAr : ch.name;
              const progTitle = profile.language === 'ar' ? ch.currentProgram.titleAr : ch.currentProgram.title;

              return (
                <div
                  key={ch.id}
                  onClick={() => {
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
                    setShowChannelDrawer(false);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#7C3AED]/15 border-[#7C3AED] text-white'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <img
                    src={ch.logo}
                    alt={chTitle}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{chTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{ch.number}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{progTitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Overlay UI Controls (Visible on hover/touch) */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header Bar */}
        <div className="p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              title={t.back}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {t.liveBadge}
                  </span>
                )}
                <h2 className="text-sm md:text-base font-bold text-white truncate max-w-xs md:max-w-md">
                  {profile.language === 'ar' ? item.titleAr : item.title}
                </h2>
              </div>
              {item.episodeTitle && (
                <p className="text-xs text-slate-300 mt-0.5">
                  {t.season} {item.seasonNumber} · {t.episodes} {item.episodeNumber} : {item.episodeTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLive && (
              <button
                onClick={() => setShowChannelDrawer(!showChannelDrawer)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.liveChannels}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Play/Pause Big Flash Indicator */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          {!isPlaying && !isLoading && !hasError && (
            <button
              onClick={togglePlay}
              className="w-18 h-18 rounded-full bg-[#7C3AED]/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto flex flex-col gap-2">
          {/* Progress / Seek bar (non-live only) */}
          {!isLive && (
            <div className="relative group w-full flex items-center">
              {/* Buffered bar */}
              <div className="absolute left-0 right-0 h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/30 transition-all duration-200"
                  style={{ width: `${duration > 0 ? (bufferedTime / duration) * 100 : 0}%` }}
                />
              </div>
              {/* Played progress */}
              <div
                className="absolute left-0 h-1.5 bg-[#7C3AED] rounded-full pointer-events-none"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Range input */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-1.5 opacity-0 group-hover:opacity-100 cursor-pointer accent-[#7C3AED] transition-opacity z-10"
              />
            </div>
          )}

          {/* Controls buttons row */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Controls: Play/Pause, Replay10, Forward10, Volume, Time */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                title={isPlaying ? t.pause : t.play}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {!isLive && (
                <>
                  <button
                    onClick={() => seekDelta(-10)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="-10s"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => seekDelta(10)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="+10s"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1.5 group">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                  title={isMuted ? t.unmute : t.mute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-16 md:w-24 h-1 accent-[#7C3AED] bg-white/20 rounded cursor-pointer"
                />
              </div>

              {/* Time display */}
              <div className="text-xs font-mono text-slate-300 tabular-nums">
                {isLive ? (
                  <span className="flex items-center gap-1 text-red-400 font-semibold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    {t.liveStream}
                  </span>
                ) : (
                  <span>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Right Controls: Next Episode, Quality/Settings, Fullscreen */}
            <div className="flex items-center gap-2">
              {onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title={t.nextEpisode}
                >
                  <span className="hidden md:inline">{t.nextEpisode}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Settings Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={`p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer ${
                    showSettingsMenu ? 'bg-white/20 text-[#7C3AED]' : ''
                  }`}
                  title={t.playbackSettings}
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute bottom-10 right-0 w-64 bg-[#101827] border border-slate-800 rounded-xl p-3 shadow-2xl z-50 text-xs">
                    <div className="font-semibold text-white pb-2 border-b border-slate-800 mb-2">
                      {t.playbackSettings}
                    </div>

                    {/* Speed */}
                    <div className="mb-3">
                      <span className="text-slate-400 block mb-1">{t.speed}</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[0.75, 1, 1.25, 1.5].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => changeSpeed(spd)}
                            className={`py-1 rounded text-center cursor-pointer transition-colors ${
                              playbackSpeed === spd
                                ? 'bg-[#7C3AED] text-white font-semibold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality */}
                    <div className="mb-3">
                      <span className="text-slate-400 block mb-1">{t.quality}</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['auto', '1080p', '720p', '480p'] as const).map((q) => (
                          <button
                            key={q}
                            onClick={() => setSelectedQuality(q)}
                            className={`py-1 rounded text-center cursor-pointer uppercase transition-colors ${
                              selectedQuality === q
                                ? 'bg-[#7C3AED] text-white font-semibold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subtitles */}
                    <div>
                      <span className="text-slate-400 block mb-1">{t.subtitles}</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'off', label: 'Off' },
                          { id: 'fr', label: 'Français' },
                          { id: 'ar', label: 'العربية' },
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubtitle(sub.id as any)}
                            className={`py-1 px-1 rounded text-center truncate cursor-pointer transition-colors ${
                              selectedSubtitle === sub.id
                                ? 'bg-[#7C3AED] text-white font-semibold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                title={isFullscreen ? t.exitFullscreen : t.fullscreen}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
