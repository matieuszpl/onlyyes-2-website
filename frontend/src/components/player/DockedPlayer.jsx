import { motion } from "framer-motion";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import VoteButtons from "../VoteButtons";
import ImageGlitch from "../ImageGlitch";
import Button from "../Button";
import { Play, Pause, Volume2, Radio } from "lucide-react";
import { useAlbumColors } from "../../hooks/useAlbumColors";

export default function DockedPlayer() {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
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
      <div className="relative bg-gradient-to-b from-black/95 to-black/98 backdrop-blur-xl border-t border-white/10">
        {nowPlaying.thumbnail && !nowPlayingColors.isDefault ? (
          <div
            className="absolute inset-0 opacity-30 blur-3xl scale-150 -z-10"
            style={{
              backgroundImage: `url(${nowPlaying.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <div className="absolute inset-0 opacity-20 blur-3xl -z-10 bg-gradient-to-br from-accent-cyan/40 via-accent-cyan/30 to-accent-cyan/20" />
        )}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, rgba(0, 243, 255, 0.15) 0%, rgba(0, 243, 255, 0.05) 50%, transparent 100%)",
          }}
        />
        <div className="relative p-2 sm:p-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 border border-primary/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Radio size={10} className="text-primary shrink-0" />
                <span className="font-mono text-[9px] text-primary uppercase">TERAZ GRANE</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-primary animate-pulse" : "bg-text-secondary"}`} />
              </div>
              <div className="font-header text-xs sm:text-sm font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-[10px] sm:text-xs text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
              <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm">
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </Button>
              <div className="flex items-center gap-1">
                <Volume2 size={12} className="text-text-secondary" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-14 h-1 accent-primary" />
              </div>
            </div>
          </div>
          <div className="sm:hidden space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 shrink-0 border border-primary/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                {nowPlaying.thumbnail ? (
                  <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Radio size={9} className="text-primary shrink-0" />
                  <span className="font-mono text-[8px] text-primary uppercase">TERAZ GRANE</span>
                  <div className={`w-1 h-1 rounded-full ${isPlaying ? "bg-primary animate-pulse" : "bg-text-secondary"}`} />
                </div>
                <div className="font-header text-[11px] font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
                <div className="font-mono text-[9px] text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <VoteButtons songId={nowPlaying.songId} />
              <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm" className="shrink-0">
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </Button>
              <div className="flex items-center gap-1 shrink-0">
                <Volume2 size={11} className="text-text-secondary" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 h-1 accent-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
