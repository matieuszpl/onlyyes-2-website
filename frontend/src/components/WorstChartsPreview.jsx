import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import ImageGlitch from "./ImageGlitch";
import { useAlbumColors } from "../hooks/useAlbumColors";
import api from "../api";
import Card from "./Card";
import SectionHeader from "./SectionHeader";

const DEFAULT_ALBUM_ART =
  "https://azura.onlyyes.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

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

export default function WorstChartsPreview({ limit = 10 }) {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  useEffect(() => {
    loadCharts();
  }, [selectedPeriod]);

  const loadCharts = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/charts/worst?period=${selectedPeriod}&limit=${limit}`
      );
      setCharts(res.data);
    } catch (error) {
      console.error("Load worst charts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case "week":
        return "TYDZIEŃ";
      case "month":
        return "MIESIĄC";
      case "all":
        return "WSZYSTKIE";
      default:
        return "TYDZIEŃ";
    }
  };

  const getTrendIndicator = (chart) => {
    if (chart.is_new) {
      return null;
    }
    if (
      chart.previous_position === null ||
      chart.previous_position === undefined
    ) {
      return null;
    }
    if (chart.position < chart.previous_position) {
      return { icon: TrendingUp, color: "text-red-400" };
    }
    if (chart.position > chart.previous_position) {
      return { icon: TrendingDown, color: "text-green-400" };
    }
    return { icon: Minus, color: "text-yellow-400" };
  };

  return (
    <Card className="space-y-4 relative">
      <SectionHeader
        icon={ThumbsDown}
        title={`NAJGORSZE ${limit}`}
        description={getPeriodLabel(selectedPeriod)}
              iconGradient="linear-gradient(135deg, rgba(255, 20, 20, 0.65) 0%, rgba(255, 20, 20, 0.40) 50%, transparent 100%)"
              iconColor="rgba(255, 20, 20, 1)"
        actions={
          <>
            <button
              onClick={() => setSelectedPeriod("week")}
              className={`px-2 py-1 font-mono text-xs border transition-all ${
                selectedPeriod === "week"
                  ? "bg-red-500/20 border-red-500 text-red-500"
                  : "bg-white/10 border-white/10 text-text-primary hover:border-red-500/50"
              }`}
            >
              T
            </button>
            <button
              onClick={() => setSelectedPeriod("month")}
              className={`px-2 py-1 font-mono text-xs border transition-all ${
                selectedPeriod === "month"
                  ? "bg-red-500/20 border-red-500 text-red-500"
                  : "bg-white/10 border-white/10 text-text-primary hover:border-red-500/50"
              }`}
            >
              M
            </button>
            <button
              onClick={() => setSelectedPeriod("all")}
              className={`px-2 py-1 font-mono text-xs border transition-all ${
                selectedPeriod === "all"
                  ? "bg-red-500/20 border-red-500 text-red-500"
                  : "bg-white/10 border-white/10 text-text-primary hover:border-red-500/50"
              }`}
            >
              W
            </button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(limit)].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2"
            >
              <div className="w-8 h-8 bg-white/20 rounded shrink-0 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-white/10 rounded w-1/2 animate-pulse" />
              </div>
              <div className="h-2 bg-white/10 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>
      ) : charts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <AlertTriangle size={24} className="text-red-500/50 mb-2" />
          <div className="font-mono text-xs text-text-secondary">
            BRAK GŁOSÓW
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {charts.map((chart, idx) => {
            const trend = getTrendIndicator(chart);
            const TrendIcon = trend?.icon;
            return (
              <motion.div
                key={chart.position}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 relative overflow-hidden"
              >
                <SongItemBackground thumbnail={chart.thumbnail} />
                <div className="w-8 text-center font-mono text-xs font-bold text-red-500 shrink-0 relative z-10">
                  #{chart.position}
                </div>
                {chart.thumbnail && (
                  <div className="w-10 h-10 border border-red-500/50 rounded shrink-0 overflow-hidden relative z-10">
                    <ImageGlitch
                      src={chart.thumbnail}
                      alt={chart.title}
                      shouldGlitch={false}
                      className="w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="font-header text-xs text-text-primary mb-0.5 uppercase truncate">
                    {chart.title || "Unknown"}
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary uppercase truncate">
                    {chart.artist || "Unknown"}
                  </div>
                  {chart.is_new && (
                    <div className="font-mono text-[9px] text-cyan-400 mt-0.5">
                      NOWOŚĆ NA LIŚCIE NAJGORSZYCH
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 relative z-10">
                  {TrendIcon && <TrendIcon size={14} className={trend.color} />}
                  <div className="font-mono text-[10px] text-text-secondary text-right">
                    {chart.votes} GŁOSÓW
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
