import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import TextGlitch from "./TextGlitch";
import ImageGlitch from "./ImageGlitch";
import { useRadioEvents } from "../contexts/RadioEventsContext";
import { useAlbumColors } from "../hooks/useAlbumColors";

const DEFAULT_ALBUM_ART =
  "https://azura.matieusz.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

function SongItemBackground({ thumbnail }) {
  const colors = useAlbumColors(thumbnail);

  if (thumbnail && !colors.isDefault) {
    return (
      <div
        className="absolute inset-0 opacity-[0.42] blur-[80px] scale-150 -z-10"
        style={{
          backgroundImage: `url(${thumbnail})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 opacity-[0.42] blur-[80px] -z-10 bg-gradient-to-br from-gray-600/30 via-gray-500/20 to-gray-700/30" />
  );
}

export default function SongHistory() {
  const { recentSongs } = useRadioEvents();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shouldGlitch, setShouldGlitch] = useState(false);

  useEffect(() => {
    if (recentSongs && recentSongs.length > 0) {
      setSongs((prev) => {
        if (!prev || prev.length === 0) {
          setLoading(false);
          return recentSongs;
        }
        const prevFirst = prev[0];
        const newFirst = recentSongs[0];
        if (
          prevFirst.title !== newFirst.title ||
          prevFirst.artist !== newFirst.artist
        ) {
          setShouldGlitch(true);
          setTimeout(() => setShouldGlitch(false), 400);
          setLoading(false);
          return recentSongs;
        }
        setLoading(false);
        return prev;
      });
    }
  }, [recentSongs]);

  return (
    <div className="glass-panel p-4 space-y-2">
      <div className="flex items-center gap-2">
        <History size={16} className="text-primary" />
        <h3 className="font-header text-sm text-primary uppercase tracking-wider">
          HISTORIA UTWORÓW
        </h3>
      </div>

      {loading ? (
        <div className="font-mono text-xs text-text-secondary">
          ŁADOWANIE...
        </div>
      ) : songs.length === 0 ? (
        <div className="font-mono text-xs text-text-secondary">
          BRAK HISTORII
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song, idx) => (
            <motion.div
              key={`${song.title}-${song.artist}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 4, scale: 1.02 }}
              className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-sm relative overflow-hidden"
            >
              <SongItemBackground thumbnail={song.thumbnail} />
              {song.thumbnail && (
                <div className="w-10 h-10 border border-primary/50 rounded shrink-0 overflow-hidden relative z-10">
                  <ImageGlitch
                    src={song.thumbnail}
                    alt={song.title}
                    shouldGlitch={shouldGlitch && idx === 0}
                    className="w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 relative z-10">
                {shouldGlitch && idx === 0 ? (
                  <TextGlitch
                    text={song.title}
                    altTexts={[
                      song.title.toUpperCase(),
                      song.title
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
                    className="font-header text-xs text-text-primary truncate"
                  />
                ) : (
                  <div className="font-header text-xs text-text-primary truncate">
                    {song.title}
                  </div>
                )}
                {shouldGlitch && idx === 0 ? (
                  <TextGlitch
                    text={song.artist}
                    altTexts={[
                      song.artist.toUpperCase(),
                      song.artist
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
                    className="font-mono text-[10px] text-text-secondary truncate"
                  />
                ) : (
                  <div className="font-mono text-[10px] text-text-secondary truncate">
                    {song.artist}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
