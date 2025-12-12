import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../utils/cn";
import { useAlbumColors } from "../hooks/useAlbumColors";

const DEFAULT_ALBUM_ART = "https://azura.matieusz.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

export default function TrendingCard({ title, artist, position, change, thumbnail }) {
  const changeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const changeColor = change > 0 ? "text-accent-cyan" : change < 0 ? "text-accent-magenta" : "text-text-secondary";
  const colors = useAlbumColors(thumbnail);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      className="glass-panel p-3 relative interactive-card overflow-hidden"
    >
      {thumbnail && !colors.isDefault ? (
        <div
          className="absolute inset-0 opacity-[0.42] blur-[80px] scale-150 -z-10"
          style={{
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div className="absolute inset-0 opacity-[0.42] blur-[80px] -z-10 bg-gradient-to-br from-gray-600/30 via-gray-500/20 to-gray-700/30" />
      )}
      <div className="flex items-center gap-3 relative z-10">
        <div className="font-header text-xl font-bold text-primary w-8">
          {position}
        </div>
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title}
            className="w-12 h-12 border border-primary"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-header text-sm text-text-primary truncate">
            {title}
          </div>
          <div className="font-mono text-xs text-text-secondary truncate">
            {artist}
          </div>
        </div>
        <div className={cn("flex items-center gap-1", changeColor)}>
          {change !== 0 && <changeIcon size={16} />}
          <span className="font-mono text-xs">
            {change > 0 ? `+${change}` : change}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

