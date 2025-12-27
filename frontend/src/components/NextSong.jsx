import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import TextGlitch from "./TextGlitch";
import ImageGlitch from "./ImageGlitch";
import { useRadioEvents } from "../contexts/RadioEventsContext";
import { useAlbumColors } from "../hooks/useAlbumColors";
import Card from "./Card";

const DEFAULT_ALBUM_ART =
  "https://azura.onlyyes.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

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
      <Card className="space-y-2">
        <h3 className="font-header text-sm text-primary uppercase tracking-wider">
          NASTĘPNY UTWÓR
        </h3>
        <Card padding="p-2" className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="w-10 h-10 bg-white/10 rounded shrink-0"
          />
          <div className="flex-1 space-y-2">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="h-3 bg-white/20 rounded w-3/4"
            />
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.1,
              }}
              className="h-2 bg-white/10 rounded w-1/2"
            />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={14} className="text-primary/50" />
          </motion.div>
        </div>
      </Card>
    );
  }

  if (!nextSong) {
    return (
      <Card>
        <h3 className="font-header text-sm text-primary uppercase tracking-wider mb-2">
          NASTĘPNY UTWÓR
        </h3>
        <div className="font-mono text-[10px] text-text-secondary">
          BRAK INFORMACJI
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      <h3 className="font-header text-sm text-primary uppercase tracking-wider">
        NASTĘPNY UTWÓR
      </h3>
      <Card padding="p-2" className="flex items-center gap-2 relative overflow-hidden">
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
      </Card>
    </Card>
  );
}
