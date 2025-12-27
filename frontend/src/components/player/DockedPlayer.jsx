import { motion, AnimatePresence } from "framer-motion";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import VoteButtons from "../VoteButtons";
import ImageGlitch from "../ImageGlitch";
import Button from "../Button";
import Card from "../Card";
import TextGlitch from "../TextGlitch";
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react";
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
      className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40"
    >
      <div
        className="border-t border-white/10 backdrop-blur-xl"
        style={{
          background: "rgba(var(--surface-rgb, 18, 18, 18), 0.98)",
        }}
      >
        <div className="relative overflow-hidden p-2 sm:p-3 md:p-4">
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
          <div className="hidden md:flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-1.5">
              <Radio size={14} className="text-primary" />
              <h2 className="font-header text-xs text-primary uppercase tracking-wider">
                TERAZ GRANE
              </h2>
            </div>
            <div className="font-mono text-[10px] text-text-secondary border border-primary/30 px-2 py-0.5 rounded bg-primary/10">
              {isPlaying ? "[LIVE]" : "[PAUZA]"}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 relative z-10">
            <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-cyan to-accent-magenta rounded-full hidden md:block"></div>
            <div className="hidden md:block shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
            </div>
            {nowPlaying.thumbnail && (
              <motion.div
                layoutId="album-art"
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded overflow-hidden border-2 border-primary/60 shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
              >
                <ImageGlitch
                  src={nowPlaying.thumbnail}
                  alt={nowPlaying.title}
                  shouldGlitch={shouldGlitch}
                  className="w-full h-full"
                />
              </motion.div>
            )}
            <div className="flex-1 min-w-0 sm:flex-1">
              {shouldGlitch ? (
                <TextGlitch
                  text={nowPlaying.title || "BRAK UTWORU"}
                  altTexts={[
                    (nowPlaying.title || "BRAK UTWORU").toUpperCase(),
                    (nowPlaying.title || "BRAK UTWORU")
                      .split("")
                      .map((c) => {
                        if (c === " ") return " ";
                        const chars = "0123456789!@#$%^&*()[]{}|\\/<>?~`";
                        return Math.random() > 0.6
                          ? chars[Math.floor(Math.random() * chars.length)]
                          : c;
                      })
                      .join(""),
                  ]}
                  className="font-header text-xs sm:text-sm font-bold text-text-primary truncate"
                />
              ) : (
                <motion.div
                  layoutId="song-title"
                  className="font-header text-xs sm:text-sm font-bold text-text-primary truncate"
                >
                  {nowPlaying.title || "BRAK UTWORU"}
                </motion.div>
              )}
              {shouldGlitch ? (
                <TextGlitch
                  text={nowPlaying.artist || "BRAK ARTYSTY"}
                  altTexts={[
                    (nowPlaying.artist || "BRAK ARTYSTY").toUpperCase(),
                    (nowPlaying.artist || "BRAK ARTYSTY")
                      .split("")
                      .map((c) => {
                        if (c === " ") return " ";
                        const chars = "0123456789!@#$%^&*()[]{}|\\/<>?~`";
                        return Math.random() > 0.6
                          ? chars[Math.floor(Math.random() * chars.length)]
                          : c;
                      })
                      .join(""),
                  ]}
                  className="font-mono text-[10px] sm:text-xs text-text-secondary truncate"
                />
              ) : (
                <motion.div
                  layoutId="song-artist"
                  className="font-mono text-[10px] sm:text-xs text-text-secondary truncate"
                >
                  {nowPlaying.artist || "BRAK ARTYSTY"}
                </motion.div>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 md:gap-3 mt-2 sm:mt-3 relative z-10">
            <Button
              onClick={togglePlay}
              variant={isPlaying ? "cyan" : "default"}
              size="sm"
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <>
                  <Pause size={14} className="sm:w-4 sm:h-4" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play size={14} className="sm:w-4 sm:h-4" />
                  <span>PLAY</span>
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
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
          </div>
          <div className="sm:hidden flex items-center gap-2 mt-2 relative z-10">
            <div className="flex-1 [&>div]:flex-row [&>div]:gap-1">
              <VoteButtons songId={nowPlaying.songId} />
            </div>
            <div className="flex-1">
              <Button
                onClick={togglePlay}
                variant={isPlaying ? "cyan" : "default"}
                size="sm"
                className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2.5"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} />
                    <span>STOP</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>PLAY</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="sm:hidden mt-2 flex items-center gap-2 relative z-10">
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
