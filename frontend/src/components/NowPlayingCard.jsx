import { motion } from "framer-motion";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import TextGlitch from "./TextGlitch";
import ImageGlitch from "./ImageGlitch";
import Button from "./Button";
import Card from "./Card";
import { Play, Pause, Heart, HeartOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAlbumColors } from "../hooks/useAlbumColors";

const DEFAULT_ALBUM_ART = "https://azura.onlyyes.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

export default function NowPlayingCard() {
  const { isPlaying, togglePlay, nowPlaying } = useGlobalAudio();
  const [liked, setLiked] = useState(false);
  const [shouldGlitch, setShouldGlitch] = useState(false);
  const prevSongRef = useRef(null);
  const colors = useAlbumColors(nowPlaying.thumbnail);

  useEffect(() => {
    if (prevSongRef.current && nowPlaying && (
      prevSongRef.current.title !== nowPlaying.title ||
      prevSongRef.current.artist !== nowPlaying.artist
    )) {
      setShouldGlitch(true);
      setTimeout(() => setShouldGlitch(false), 400);
    }
    prevSongRef.current = nowPlaying;
  }, [nowPlaying]);

  return (
    <Card
      as={motion.div}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="relative overflow-hidden"
    >
      {nowPlaying.thumbnail && !colors.isDefault ? (
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-header text-sm text-primary uppercase tracking-wider">
            TERAZ GRANE
          </h3>
          <div className="font-mono text-xs text-text-secondary border border-white/10 px-3 py-1">
            {isPlaying ? "[LIVE]" : "[PAUZA]"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {nowPlaying.thumbnail && (
            <motion.div
              className="w-32 h-32 border-4 border-primary pulse-glow overflow-hidden"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <ImageGlitch
                src={nowPlaying.thumbnail}
                alt={nowPlaying.title}
                shouldGlitch={shouldGlitch}
                className="w-full h-full"
              />
            </motion.div>
          )}
          <div className="flex-1">
            {shouldGlitch ? (
              <TextGlitch
                text={nowPlaying.title}
                altTexts={[
                  nowPlaying.title.toUpperCase(),
                  nowPlaying.title.split("").map((c, i) => {
                    if (c === " ") return " ";
                    const chars = "0123456789!@#$%^&*()[]{}|\\/<>?~`";
                    return Math.random() > 0.6 ? chars[Math.floor(Math.random() * chars.length)] : c;
                  }).join(""),
                ]}
                className="font-header text-xl text-text-primary mb-2"
              />
            ) : (
              <motion.h4
                key={nowPlaying.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-header text-xl text-text-primary mb-2"
              >
                {nowPlaying.title}
              </motion.h4>
            )}
            <p className="font-mono text-base text-text-secondary mb-4">
              {nowPlaying.artist}
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={togglePlay}
                variant={isPlaying ? "cyan" : "primary"}
                size="md"
                className={isPlaying ? "" : "bg-primary text-black"}
                style={isPlaying ? {} : undefined}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "STOP" : "PLAY"}
              </Button>
              <button
                onClick={() => setLiked(!liked)}
                className={liked ? "text-accent-magenta" : "text-text-secondary hover:text-accent-magenta"}
              >
                {liked ? <Heart size={20} fill="currentColor" /> : <HeartOff size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

