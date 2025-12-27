import { useState } from "react";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import VoteButtons from "../components/VoteButtons";
import ImageGlitch from "../components/ImageGlitch";
import Button from "../components/Button";
import Card from "../components/Card";
import TextGlitch from "../components/TextGlitch";
import { Play, Pause, Volume2, VolumeX, Radio, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlbumColors } from "../hooks/useAlbumColors";

const PlayerDesign1 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="border-t-2 border-primary/50 backdrop-blur-xl bg-black/95">
        <div className="relative overflow-hidden p-4">
          {nowPlaying.thumbnail && !nowPlayingColors.isDefault && (
            <div
              className="absolute inset-0 opacity-30 blur-3xl scale-150 -z-10"
              style={{ backgroundImage: `url(${nowPlaying.thumbnail})`, backgroundSize: "cover" }}
            />
          )}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 border-primary/60">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Radio size={12} className="text-primary shrink-0" />
                <span className="font-mono text-[10px] text-primary uppercase tracking-wider">TERAZ GRANE</span>
              </div>
              {shouldGlitch ? (
                <TextGlitch text={nowPlaying.title || "BRAK UTWORU"} className="font-header text-sm font-bold text-text-primary truncate" />
              ) : (
                <div className="font-header text-sm font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              )}
              <div className="font-mono text-xs text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
              <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </Button>
              <div className="relative">
                <button onClick={() => setIsVolumeVisible(!isVolumeVisible)} className="text-text-secondary hover:text-primary">
                  {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <AnimatePresence>
                  {isVolumeVisible && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full right-0 mb-2">
                      <Card className="p-2">
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 h-1 accent-primary" style={{ writingMode: "bt-lr" }} />
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign2 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="bg-gradient-to-r from-accent-cyan/20 via-black/95 to-accent-magenta/20 border-t border-primary/30 backdrop-blur-xl">
        <div className="relative overflow-hidden p-3">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-primary/40 ring-2 ring-primary/20">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-header text-xs font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-[10px] text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
            </div>
            <div className="h-8 w-px bg-white/10 shrink-0" />
            <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm" className="shrink-0">
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </Button>
            <div className="flex items-center gap-2 shrink-0">
              <Volume2 size={14} className="text-text-secondary" />
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 accent-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign3 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <Card className="border-t-2 border-primary rounded-none rounded-t-2xl m-0 p-0">
        <div className="relative overflow-hidden p-4">
          {nowPlaying.thumbnail && !nowPlayingColors.isDefault && (
            <div className="absolute inset-0 opacity-20 blur-2xl -z-10" style={{ backgroundImage: `url(${nowPlaying.thumbnail})`, backgroundSize: "cover" }} />
          )}
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center relative z-10">
            <div className="w-14 h-14 rounded border-2 border-primary/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[9px] text-primary uppercase tracking-widest mb-1">LIVE</div>
              <div className="font-header text-sm font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-xs text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <VoteButtons songId={nowPlaying.songId} />
                <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm">
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 size={12} className="text-text-secondary" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 h-1 accent-primary" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PlayerDesign4 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="bg-black/98 border-t-4 border-primary backdrop-blur-2xl">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-primary uppercase">ON AIR</span>
            </div>
            <div className="font-mono text-[10px] text-text-secondary border border-primary/30 px-2 py-0.5 rounded">{isPlaying ? "[LIVE]" : "[PAUZA]"}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 border border-primary/40">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-header text-xs font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-[10px] text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <VoteButtons songId={nowPlaying.songId} />
            <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm">
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <div className="flex items-center gap-1">
              <Volume2 size={14} className="text-text-secondary" />
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 h-1 accent-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign5 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-xl" />
        <div className="relative border-t border-primary/20 p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-xl" />
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-primary/30">
                {nowPlaying.thumbnail ? (
                  <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Radio size={10} className="text-primary" />
                <span className="font-mono text-[9px] text-primary uppercase">TERAZ GRANE</span>
              </div>
              <div className="font-header text-sm font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-xs text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
              <div className="h-6 w-px bg-white/10" />
              <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </Button>
              <div className="relative">
                <button className="text-text-secondary hover:text-primary">
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 accent-primary rotate-90 origin-center" style={{ transform: "translateX(-50%) rotate(-90deg)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign6 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="bg-black/90 border-t-2 border-accent-cyan/50 backdrop-blur-xl">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden border-2 border-accent-cyan/40 shadow-[0_0_10px_rgba(0,243,255,0.4)]">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-header text-xs font-bold text-text-primary truncate mb-0.5">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-[10px] text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
              <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </Button>
              <div className="flex items-center gap-1">
                <Volume2 size={12} className="text-text-secondary" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-14 h-1 accent-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign7 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="relative bg-black/95 backdrop-blur-xl border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/5 via-transparent to-accent-magenta/5" />
        <div className="relative p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-primary/30 shadow-lg">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[10px] text-primary uppercase tracking-wider">LIVE STREAM</span>
              </div>
              <div className="font-header text-base font-bold text-text-primary truncate mb-1">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-xs text-text-secondary truncate mb-3">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
              <div className="flex items-center gap-2">
                <VoteButtons songId={nowPlaying.songId} />
                <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm">
                  {isPlaying ? <><Pause size={12} /> STOP</> : <><Play size={12} /> PLAY</>}
                </Button>
                <div className="flex items-center gap-1">
                  <Volume2 size={12} className="text-text-secondary" />
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 accent-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign8 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <Card className="border-t-4 border-primary rounded-none m-0 p-0">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 border-2 border-primary/50">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-header text-xs font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-[10px] text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1">
                <VoteButtons songId={nowPlaying.songId} />
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm" className="px-2 py-1">
                  {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                </Button>
                <div className="flex items-center gap-1">
                  <Volume2 size={10} className="text-text-secondary" />
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-12 h-0.5 accent-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PlayerDesign9 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();
  const nowPlayingColors = useAlbumColors(nowPlaying.thumbnail);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="bg-black/98 backdrop-blur-2xl border-t border-primary/30">
        <div className="relative p-4">
          {nowPlaying.thumbnail && !nowPlayingColors.isDefault && (
            <div className="absolute inset-0 opacity-25 blur-3xl -z-10" style={{ backgroundImage: `url(${nowPlaying.thumbnail})`, backgroundSize: "cover" }} />
          )}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-primary/40 ring-4 ring-primary/10">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] text-primary uppercase tracking-widest mb-1">ONLY YES RADIO</div>
              <div className="font-header text-sm font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-xs text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VoteButtons songId={nowPlaying.songId} />
              <Button onClick={togglePlay} variant={isPlaying ? "cyan" : "default"} size="sm" className="rounded-full">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </Button>
              <div className="flex items-center gap-1">
                <Volume2 size={14} className="text-text-secondary" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 h-1 accent-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDesign10 = () => {
  const { isPlaying, togglePlay, nowPlaying, volume, setVolume, shouldGlitch } = useGlobalAudio();

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="bg-gradient-to-b from-black/95 to-black/98 backdrop-blur-xl border-t-2 border-primary/40">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 border border-primary/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              {nowPlaying.thumbnail ? (
                <ImageGlitch src={nowPlaying.thumbnail} alt={nowPlaying.title} shouldGlitch={shouldGlitch} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-cyan to-accent-magenta" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Radio size={10} className="text-primary" />
                <span className="font-mono text-[9px] text-primary uppercase">TERAZ GRANE</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-primary animate-pulse" : "bg-text-secondary"}`} />
              </div>
              <div className="font-header text-xs font-bold text-text-primary truncate">{nowPlaying.title || "BRAK UTWORU"}</div>
              <div className="font-mono text-[10px] text-text-secondary truncate">{nowPlaying.artist || "BRAK ARTYSTY"}</div>
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
        </div>
      </div>
    </div>
  );
};

const designs = [
  { id: 1, name: "Design 1: Klasyczny z tłem", component: PlayerDesign1 },
  { id: 2, name: "Design 2: Okrągły minimalistyczny", component: PlayerDesign2 },
  { id: 3, name: "Design 3: Karta z zaokrąglonymi rogami", component: PlayerDesign3 },
  { id: 4, name: "Design 4: Kompaktowy z statusem", component: PlayerDesign4 },
  { id: 5, name: "Design 5: Gradient z glow", component: PlayerDesign5 },
  { id: 6, name: "Design 6: Cyan border glow", component: PlayerDesign6 },
  { id: 7, name: "Design 7: Większy z live stream", component: PlayerDesign7 },
  { id: 8, name: "Design 8: Minimalistyczna karta", component: PlayerDesign8 },
  { id: 9, name: "Design 9: Okrągły z ringiem", component: PlayerDesign9 },
  { id: 10, name: "Design 10: Gradient bottom", component: PlayerDesign10 },
];

export default function TestPage() {
  const [selectedDesign, setSelectedDesign] = useState(1);
  const SelectedComponent = designs.find((d) => d.id === selectedDesign)?.component || PlayerDesign1;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-header text-2xl font-bold text-text-primary mb-6">Test Redesignów Odtwarzacza</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {designs.map((design) => (
            <button
              key={design.id}
              onClick={() => setSelectedDesign(design.id)}
              className={`p-3 border rounded text-xs font-mono transition-all ${
                selectedDesign === design.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-text-secondary hover:border-primary/50"
              }`}
            >
              {design.id}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <div className="font-mono text-sm text-text-secondary mb-2">Wybrany: {designs.find((d) => d.id === selectedDesign)?.name}</div>
        </div>
        <div className="h-32 bg-black/50 border border-white/10 rounded p-4 flex items-center justify-center">
          <div className="text-text-secondary font-mono text-sm">Podgląd odtwarzacza poniżej (na dole strony)</div>
        </div>
      </div>
      <SelectedComponent />
    </div>
  );
}

