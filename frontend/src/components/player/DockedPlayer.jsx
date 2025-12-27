import { motion, AnimatePresence } from "framer-motion";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import VoteButtons from "../VoteButtons";
import ImageGlitch from "../ImageGlitch";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useAlbumColors } from "../../hooks/useAlbumColors";

export default function DockedPlayer() {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } =
    useGlobalAudio();
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <motion.div
      layoutId="docked-player"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-56 z-40"
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-t border-white/10 relative overflow-hidden"
        style={{
          borderRadius: 0,
          margin: 0,
          borderBottom: "none",
          background: "rgba(var(--surface-rgb, 18, 18, 18), 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 -4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {nowPlaying.thumbnail && !nowPlayingColors.isDefault ? (
          <div
            className="absolute inset-0 opacity-[0.42] blur-[80px] scale-150 -z-10"
            style={{
              backgroundImage: `url(${nowPlaying.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <div className="absolute inset-0 opacity-[0.42] blur-[80px] -z-10 bg-gradient-to-br from-gray-600/30 via-gray-500/20 to-gray-700/30" />
        )}
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Left: Vote Buttons + Album Art + Song Info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="hidden md:block shrink-0">
                <VoteButtons songId={nowPlaying.songId} />
              </div>
              {nowPlaying.thumbnail && (
                <motion.div
                  layoutId="album-art"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded overflow-hidden border border-primary/60 shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
                >
                  <ImageGlitch
                    src={nowPlaying.thumbnail}
                    alt={nowPlaying.title}
                    shouldGlitch={shouldGlitch}
                    className="w-full h-full"
                  />
                </motion.div>
              )}
              <div className="flex-1 min-w-0">
                <motion.div
                  layoutId="song-title"
                  className="font-header text-xs sm:text-sm text-primary truncate"
                >
                  {nowPlaying.title || "BRAK UTWORU"}
                </motion.div>
                <motion.div
                  layoutId="song-artist"
                  className="font-mono text-[10px] sm:text-xs text-text-secondary truncate"
                >
                  {nowPlaying.artist || "BRAK ARTYSTY"}
                </motion.div>
              </div>
            </div>

            {/* Center: Play Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={togglePlay}
                className="btn-cut bg-white/10 text-text-secondary px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 font-mono text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-primary hover:text-black"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">STOP</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">PLAY</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Volume */}
            <div className="hidden sm:flex items-center gap-2 md:gap-3 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setIsVolumeVisible(!isVolumeVisible)}
                  className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
                  aria-label="Volume"
                >
                  {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <AnimatePresence>
                  {isVolumeVisible && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      as={Card}
                      className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded border border-white/10"
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-white/10 accent-primary"
                        style={{ writingMode: "bt-lr" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile: Vote Buttons Only */}
            <div className="sm:hidden shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
            </div>
          </div>

          {/* Mobile: Volume Slider */}
          <div className="sm:hidden mt-2 flex items-center gap-2">
            <Volume2 size={14} className="text-text-secondary shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-white/10 accent-primary"
            />
            <span className="font-mono text-[10px] text-text-secondary w-8 shrink-0">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
