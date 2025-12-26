import { motion } from "framer-motion";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import { useRadioEvents } from "../../contexts/RadioEventsContext";
import VoteButtons from "../VoteButtons";
import CopyStreamButton from "../CopyStreamButton";
import TextGlitch from "../TextGlitch";
import ImageGlitch from "../ImageGlitch";
import { Play, Pause, Music2, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { useAlbumColors } from "../../hooks/useAlbumColors";

const DEFAULT_ALBUM_ART =
  "https://azura.onlyyes.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

export default function HeroPlayer() {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } =
    useGlobalAudio();
  const { nextSong: nextSongData } = useRadioEvents();
  const [nextSong, setNextSong] = useState(null);
  const [nextSongGlitch, setNextSongGlitch] = useState(false);
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);
  const nextSongColors = useAlbumColors(nextSong?.thumbnail);

  useEffect(() => {
    if (nextSongData) {
      setNextSong((prev) => {
        if (
          !prev ||
          prev.title !== nextSongData.title ||
          prev.artist !== nextSongData.artist
        ) {
          setNextSongGlitch(true);
          setTimeout(() => setNextSongGlitch(false), 400);
          return nextSongData;
        }
        return prev;
      });
    }
  }, [nextSongData]);

  return (
    <motion.div
      layoutId="player"
      className="glass-panel p-3 sm:p-4 space-y-3 sm:space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Teraz Grane */}
      <div className="space-y-3 relative overflow-hidden rounded p-3">
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
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Radio size={14} className="sm:w-[18px] sm:h-[18px] text-primary" />
            <h2 className="font-header text-xs sm:text-sm md:text-base text-primary uppercase tracking-wider">
              TERAZ GRANE
            </h2>
          </div>
          <div className="font-mono text-[10px] sm:text-xs text-text-secondary border border-primary/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded bg-primary/10">
            {isPlaying ? "[LIVE]" : "[PAUZA]"}
          </div>
        </div>

        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 relative z-10">
          <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-cyan to-accent-magenta rounded-full"></div>
          {nowPlaying.thumbnail && (
            <motion.div
              layoutId="album-art"
              className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary/60 rounded shrink-0 overflow-hidden shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
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
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="flex-1 min-w-0">
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
                    className="font-header text-xs sm:text-sm font-bold mb-1 text-text-primary truncate"
                  />
                ) : (
                  <motion.div
                    layoutId="song-title"
                    className="font-header text-xs sm:text-sm font-bold mb-1 text-text-primary truncate"
                  >
                    {nowPlaying.title}
                  </motion.div>
                )}
                {shouldGlitch ? (
                  <TextGlitch
                    text={nowPlaying.artist}
                    altTexts={[
                      nowPlaying.artist.toUpperCase(),
                      nowPlaying.artist
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
                    className="font-mono text-[10px] sm:text-xs text-text-secondary truncate"
                  />
                ) : (
                  <motion.div
                    layoutId="song-artist"
                    className="font-mono text-[10px] sm:text-xs text-text-secondary truncate"
                  >
                    {nowPlaying.artist}
                  </motion.div>
                )}
              </div>
              <VoteButtons songId={nowPlaying.songId} />
            </div>
            <div className="w-full h-0.5 sm:h-1 bg-white/10 rounded-full mb-2 sm:mb-3">
              <div
                className="h-full bg-gradient-to-r from-primary via-accent-cyan to-accent-magenta rounded-full"
                style={{ width: "30%" }}
              />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5 sm:mb-2">
              <button
                onClick={togglePlay}
                className="btn-cut bg-white/10 text-text-secondary px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 font-mono text-[10px] sm:text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 hover:bg-primary hover:text-black"
              >
                {isPlaying ? (
                  <>
                    <Pause size={12} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">STOP</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">PLAY</span>
                  </>
                )}
              </button>
              <CopyStreamButton />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
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
                className="flex-1 h-0.5 sm:h-1 bg-white/10 accent-primary"
              />
              <span className="font-mono text-[10px] sm:text-xs text-text-secondary w-6 sm:w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Następny Utwór */}
      <div className="border-t border-white/10 pt-3 sm:pt-4 space-y-1.5 sm:space-y-2 relative">
        <div className="absolute -left-1 top-3 sm:top-4 bottom-0 w-1 bg-gradient-to-b from-accent-magenta to-accent-cyan rounded-full"></div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Music2 size={12} className="sm:w-4 sm:h-4 text-accent-cyan" />
          <h3 className="font-header text-xs sm:text-sm text-primary uppercase tracking-wider">
            NASTĘPNY UTWÓR
          </h3>
        </div>
        {nextSong ? (
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-accent-cyan/50 transition-all rounded-sm relative overflow-hidden">
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
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-cyan to-accent-magenta rounded-l-sm"></div>
            {nextSong.thumbnail && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-accent-cyan/50 rounded shrink-0 overflow-hidden relative z-10">
                <ImageGlitch
                  src={nextSong.thumbnail}
                  alt={nextSong.title}
                  shouldGlitch={nextSongGlitch}
                  className="w-full h-full"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 relative z-10">
              {nextSongGlitch ? (
                <TextGlitch
                  text={nextSong.title}
                  altTexts={[
                    nextSong.title.toUpperCase(),
                    nextSong.title
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
                  className="font-header text-[10px] sm:text-xs text-text-primary truncate"
                />
              ) : (
                <div className="font-header text-[10px] sm:text-xs text-text-primary truncate">
                  {nextSong.title}
                </div>
              )}
              {nextSongGlitch ? (
                <TextGlitch
                  text={nextSong.artist}
                  altTexts={[
                    nextSong.artist.toUpperCase(),
                    nextSong.artist
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
                  className="font-mono text-[9px] sm:text-[10px] text-text-secondary truncate"
                />
              ) : (
                <div className="font-mono text-[9px] sm:text-[10px] text-text-secondary truncate">
                  {nextSong.artist}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="font-mono text-[9px] sm:text-[10px] text-text-secondary">
            BRAK INFORMACJI
          </div>
        )}
      </div>
    </motion.div>
  );
}
