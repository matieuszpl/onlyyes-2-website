import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import { useRadioEvents } from "../../contexts/RadioEventsContext";
import VoteButtons from "../VoteButtons";
import TextGlitch from "../TextGlitch";
import ImageGlitch from "../ImageGlitch";
import { Play, Pause, Home, ChevronLeft } from "lucide-react";
import { useAlbumColors } from "../../hooks/useAlbumColors";

const DEFAULT_ALBUM_ART =
  "https://azura.onlyyes.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

function HistoryItem({ song }) {
  const songColors = useAlbumColors(song.thumbnail);

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-sm relative overflow-hidden">
      {song.thumbnail && !songColors.isDefault && (
        <div
          className="absolute inset-0 opacity-[0.15] blur-[40px] -z-10"
          style={{
            backgroundImage: `url(${song.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      {song.thumbnail && (
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-10 h-10 sm:w-12 sm:h-12 border border-primary shrink-0 relative z-10"
        />
      )}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="font-header text-xs sm:text-sm text-text-primary truncate">
          {song.title}
        </div>
        <div className="font-mono text-[10px] sm:text-xs text-text-secondary truncate">
          {song.artist}
        </div>
      </div>
    </div>
  );
}

export default function KioskLayout() {
  const navigate = useNavigate();
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume } =
    useGlobalAudio();
  const { recentSongs, nextSong: nextSongData } = useRadioEvents();
  const [dimmed, setDimmed] = useState(false);
  const [songHistory, setSongHistory] = useState([]);
  const [nextSong, setNextSong] = useState(null);
  const [shouldGlitch, setShouldGlitch] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const prevSongRef = useRef(null);
  const nextSongColors = useAlbumColors(nextSong?.thumbnail);
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  useEffect(() => {
    const checkActivity = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > 5 * 60 * 1000) {
        setDimmed(true);
      }
    }, 1000);

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setDimmed(false);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearInterval(checkActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  useEffect(() => {
    if (recentSongs && recentSongs.length > 0) {
      setSongHistory((prev) => {
        if (!prev || prev.length === 0) return recentSongs;
        const prevFirst = prev[0];
        const newFirst = recentSongs[0];
        if (
          prevFirst.title !== newFirst.title ||
          prevFirst.artist !== newFirst.artist
        ) {
          return recentSongs;
        }
        return prev;
      });
    }
  }, [recentSongs]);

  useEffect(() => {
    if (nextSongData) {
      setNextSong((prev) => {
        if (
          !prev ||
          prev.title !== nextSongData.title ||
          prev.artist !== nextSongData.artist
        ) {
          return nextSongData;
        }
        return prev;
      });
    }
  }, [nextSongData]);

  useEffect(() => {
    if (
      prevSongRef.current &&
      nowPlaying &&
      (prevSongRef.current.title !== nowPlaying.title ||
        prevSongRef.current.artist !== nowPlaying.artist)
    ) {
      setShouldGlitch(true);
      setTimeout(() => setShouldGlitch(false), 400);
    }
    prevSongRef.current = nowPlaying;
  }, [nowPlaying]);

  return (
    <div
      className={`h-screen flex flex-col transition-opacity duration-1000 relative ${
        dimmed ? "opacity-30" : "opacity-100"
      }`}
    >
      {/* Background with blurred album art */}
      {nowPlaying.thumbnail && !nowPlayingColors.isDefault && (
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: `url(${nowPlaying.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(120px) brightness(0.3)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: `rgba(var(--primary-rgb), 0.15)`,
              mixBlendMode: "overlay",
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row kiosk-main-content relative z-10 overflow-y-auto lg:overflow-y-auto">
        {/* Portrait Layout for phones/tablets */}
        <div className="flex-1 flex flex-col lg:hidden min-h-0 kiosk-portrait-layout">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 shrink-0">
            <button
              onClick={() => navigate("/")}
              className="btn-cut bg-white/10 text-text-secondary hover:bg-primary hover:text-black px-2 sm:px-3 py-1.5 sm:py-2 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all"
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
            <div className="font-brand text-xl sm:text-2xl text-primary tracking-wider">
              <TextGlitch
                text="ONLY YES"
                altTexts={[
                  "ONLY YES",
                  "0NLY Y3S",
                  "0NL¥ ¥3$",
                  "0N1Y Y35",
                  "#+:|* {&><@$?",
                ]}
                className="font-brand"
              />
            </div>
            <div className="w-8 sm:w-12"></div>
          </div>

          {/* Current Song - Album Art + Title Side by Side */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 shrink-0">
            <div className="flex gap-2 sm:gap-3 md:gap-4 items-start">
              {nowPlaying.thumbnail && (
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-primary pulse-glow overflow-hidden shrink-0 kiosk-album-art"
                  style={{ aspectRatio: "1 / 1" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <ImageGlitch
                    src={nowPlaying.thumbnail}
                    alt={nowPlaying.title}
                    shouldGlitch={shouldGlitch}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
              <div className="flex-1 min-w-0 kiosk-title-section">
                {shouldGlitch ? (
                  <TextGlitch
                    text={nowPlaying.title}
                    altTexts={[
                      nowPlaying.title.toUpperCase(),
                      nowPlaying.title
                        .split("")
                        .map((c, i) => {
                          if (c === " ") return " ";
                          const chars = "0123456789!@#$%^&*()[]{}|\\/<>?~`";
                          return Math.random() > 0.6
                            ? chars[Math.floor(Math.random() * chars.length)]
                            : c;
                        })
                        .join(""),
                    ]}
                    className="font-header text-sm sm:text-base md:text-lg text-text-primary mb-1 kiosk-song-title"
                  />
                ) : (
                  <h2 className="font-header text-sm sm:text-base md:text-lg text-text-primary mb-1 kiosk-song-title">
                    {nowPlaying.title}
                  </h2>
                )}
                <p className="font-mono text-[10px] sm:text-xs md:text-sm text-text-secondary mb-2 sm:mb-3 kiosk-artist">
                  {nowPlaying.artist}
                </p>
                <div className="kiosk-vote-buttons">
                  <VoteButtons songId={nowPlaying.songId} size="large" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls - Full Width */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 shrink-0 kiosk-controls">
            <button
              onClick={togglePlay}
              className="btn-cut w-full py-2 sm:py-2.5 md:py-3 font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3 transition-all kiosk-play-button"
            >
              {isPlaying ? (
                <>
                  <Pause size={16} className="sm:w-5 sm:h-5" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play size={16} className="sm:w-5 sm:h-5" />
                  <span>ODTWÓRZ</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full">
              <span className="font-mono text-[10px] sm:text-xs text-text-secondary">
                VOL
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1.5 sm:h-2 bg-white/10 accent-primary rounded-full"
              />
              <span className="font-mono text-[10px] sm:text-xs text-text-secondary w-8 sm:w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Next Song - Full Width */}
          {nextSong && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 shrink-0">
              <div className="glass-panel p-2 sm:p-3 relative overflow-hidden">
                {nextSong?.thumbnail && !nextSongColors.isDefault ? (
                  <div
                    className="absolute inset-0 opacity-[0.42] blur-[80px] scale-150 -z-10"
                    style={{
                      backgroundImage: `url(${nextSong.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 opacity-[0.42] blur-[80px] -z-10 bg-gradient-to-br from-gray-600/30 via-gray-500/20 to-gray-700/30" />
                )}
                <h3 className="font-header text-[10px] sm:text-xs text-primary uppercase tracking-wider mb-1.5 sm:mb-2 relative z-10">
                  NASTĘPNY UTWÓR
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                  {nextSong.thumbnail && (
                    <img
                      src={nextSong.thumbnail}
                      alt={nextSong.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-2 border-primary shrink-0"
                      style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-header text-xs sm:text-sm text-text-primary truncate">
                      {nextSong.title}
                    </div>
                    <div className="font-mono text-[10px] sm:text-xs text-text-secondary truncate">
                      {nextSong.artist}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History - Full Width */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="glass-panel p-2 sm:p-3 relative">
              <h3 className="font-header text-[10px] sm:text-xs text-primary uppercase tracking-wider mb-2 sm:mb-3">
                HISTORIA
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {songHistory.length === 0 ? (
                  <div className="font-mono text-[10px] sm:text-xs text-text-secondary">
                    BRAK HISTORII
                  </div>
                ) : (
                  songHistory.map((song, idx) => (
                    <HistoryItem key={idx} song={song} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Hidden on mobile/tablet, visible from lg */}
        <div className="hidden lg:flex flex-1 min-h-0">
          {/* Left Side */}
          <div className="flex-1 flex flex-col p-5 min-h-0">
            {/* ONLY YES Brand Header */}
            <div className="flex items-center justify-center pt-6 pb-4 relative shrink-0">
              <button
                onClick={() => navigate("/")}
                className="absolute left-5 top-6 btn-cut bg-white/10 text-text-secondary hover:bg-primary hover:text-black px-4 py-2 font-mono text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Home size={18} />
                GŁÓWNA
              </button>
              <div className="font-brand text-5xl lg:text-6xl text-primary tracking-wider">
                <TextGlitch
                  text="ONLY YES"
                  altTexts={[
                    "ONLY YES",
                    "0NLY Y3S",
                    "0NL¥ ¥3$",
                    "0N1Y Y35",
                    "#+:|* {&><@$?",
                  ]}
                  className="font-brand"
                />
              </div>
            </div>

            {/* Album Art + Title - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 min-h-0">
              {nowPlaying.thumbnail && (
                <motion.div
                  className="w-64 lg:w-72 h-64 lg:h-72 border-4 border-primary pulse-glow overflow-hidden"
                  style={{ aspectRatio: "1 / 1" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <ImageGlitch
                    src={nowPlaying.thumbnail}
                    alt={nowPlaying.title}
                    shouldGlitch={shouldGlitch}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
              <div className="text-center px-2">
                {shouldGlitch ? (
                  <TextGlitch
                    text={nowPlaying.title}
                    altTexts={[
                      nowPlaying.title.toUpperCase(),
                      nowPlaying.title
                        .split("")
                        .map((c, i) => {
                          if (c === " ") return " ";
                          const chars = "0123456789!@#$%^&*()[]{}|\\/<>?~`";
                          return Math.random() > 0.6
                            ? chars[Math.floor(Math.random() * chars.length)]
                            : c;
                        })
                        .join(""),
                    ]}
                    className="font-header text-2xl lg:text-5xl text-text-primary mb-2"
                  />
                ) : (
                  <h2 className="font-header text-2xl lg:text-5xl text-text-primary mb-2">
                    {nowPlaying.title}
                  </h2>
                )}
                <p className="font-mono text-base lg:text-xl text-text-secondary">
                  {nowPlaying.artist}
                </p>
              </div>

              {/* Vote Buttons - Under Title */}
              <div className="flex justify-center mt-4 mb-6">
                <VoteButtons songId={nowPlaying.songId} size="large" />
              </div>
            </div>

            {/* Controls - Bottom */}
            <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto pb-6">
              <button
                onClick={togglePlay}
                className="btn-cut bg-primary text-white px-12 py-4 font-mono text-base font-bold flex items-center gap-4 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
              >
                {isPlaying ? (
                  <>
                    <Pause size={32} />
                    <span>STOP</span>
                  </>
                ) : (
                  <>
                    <Play size={32} />
                    <span>ODTWÓRZ</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-2 w-full">
                <span className="font-mono text-sm text-text-secondary">
                  VOL
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/10 accent-primary rounded-full"
                />
                <span className="font-mono text-sm text-text-secondary w-12 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - History + Next */}
          <div className="w-[600px] border-l border-white/10 p-4 overflow-y-auto">
            <div className="space-y-3">
              {/* Next Song */}
              {nextSong && (
                <div className="glass-panel p-4 relative overflow-hidden">
                  {nextSong?.thumbnail && !nextSongColors.isDefault ? (
                    <div
                      className="absolute inset-0 opacity-[0.42] blur-[80px] scale-150 -z-10"
                      style={{
                        backgroundImage: `url(${nextSong.thumbnail})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-[0.42] blur-[80px] -z-10 bg-gradient-to-br from-gray-600/30 via-gray-500/20 to-gray-700/30" />
                  )}
                  <h3 className="font-header text-sm text-primary uppercase tracking-wider mb-3 relative z-10">
                    NASTĘPNY UTWÓR
                  </h3>
                  <div className="flex items-center gap-4 relative z-10">
                    {nextSong.thumbnail && (
                      <img
                        src={nextSong.thumbnail}
                        alt={nextSong.title}
                        className="w-24 h-24 border-2 border-primary shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-header text-base text-text-primary truncate">
                        {nextSong.title}
                      </div>
                      <div className="font-mono text-sm text-text-secondary truncate">
                        {nextSong.artist}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              <div className="glass-panel p-4 relative">
                <h3 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
                  HISTORIA
                </h3>
                <div className="space-y-2 overflow-y-auto">
                  {songHistory.length === 0 ? (
                    <div className="font-mono text-xs text-text-secondary">
                      BRAK HISTORII
                    </div>
                  ) : (
                    songHistory.map((song, idx) => (
                      <HistoryItem key={idx} song={song} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
