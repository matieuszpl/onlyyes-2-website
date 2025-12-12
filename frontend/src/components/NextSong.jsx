import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TextGlitch from "./TextGlitch";
import ImageGlitch from "./ImageGlitch";
import { useRadioEvents } from "../contexts/RadioEventsContext";
import { useAlbumColors } from "../hooks/useAlbumColors";

const DEFAULT_ALBUM_ART =
  "https://azura.matieusz.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

export default function NextSong() {
  const { nextSong: nextSongData } = useRadioEvents();
  const [nextSong, setNextSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldGlitch, setShouldGlitch] = useState(false);
  const colors = useAlbumColors(nextSong?.thumbnail);

  useEffect(() => {
    if (nextSongData) {
      setNextSong((prev) => {
        if (
          !prev ||
          prev.title !== nextSongData.title ||
          prev.artist !== nextSongData.artist
        ) {
          setShouldGlitch(true);
          setTimeout(() => setShouldGlitch(false), 400);
          setLoading(false);
          return nextSongData;
        }
        setLoading(false);
        return prev;
      });
    } else {
      setLoading(false);
    }
  }, [nextSongData]);

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <h3 className="font-header text-sm text-primary uppercase tracking-wider mb-2">
          NASTĘPNY UTWÓR
        </h3>
        <div className="font-mono text-[10px] text-text-secondary">
          ŁADOWANIE...
        </div>
      </div>
    );
  }

  if (!nextSong) {
    return (
      <div className="glass-panel p-4">
        <h3 className="font-header text-sm text-primary uppercase tracking-wider mb-2">
          NASTĘPNY UTWÓR
        </h3>
        <div className="font-mono text-[10px] text-text-secondary">
          BRAK INFORMACJI
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-2">
      <h3 className="font-header text-sm text-primary uppercase tracking-wider">
        NASTĘPNY UTWÓR
      </h3>
      <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-sm relative overflow-hidden">
        {nextSong.thumbnail && !colors.isDefault ? (
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
        {nextSong.thumbnail && (
          <div className="w-10 h-10 border border-primary/50 rounded shrink-0 overflow-hidden relative z-10">
            <ImageGlitch
              src={nextSong.thumbnail}
              alt={nextSong.title}
              shouldGlitch={shouldGlitch}
              className="w-full h-full"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 relative z-10">
          {shouldGlitch ? (
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
              className="font-header text-xs text-text-primary truncate"
            />
          ) : (
            <div className="font-header text-xs text-text-primary truncate">
              {nextSong.title}
            </div>
          )}
          {shouldGlitch ? (
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
              className="font-mono text-[10px] text-text-secondary truncate"
            />
          ) : (
            <div className="font-mono text-[10px] text-text-secondary truncate">
              {nextSong.artist}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
