import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import ImageGlitch from "./ImageGlitch";
import { useAlbumColors } from "../hooks/useAlbumColors";
import api from "../api";

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

export default function WorstChartsArchive() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  useEffect(() => {
    loadCharts();
  }, [selectedPeriod]);

  const loadCharts = async () => {
    try {
      const res = await api.get(`/charts/worst?period=${selectedPeriod}`);
      setCharts(res.data);
    } catch (error) {
      console.error("Load worst charts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIndicator = (chart) => {
    if (chart.is_new) {
      return null;
    }
    if (chart.previous_position === null || chart.previous_position === undefined) {
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
    <div className="glass-panel p-4 space-y-3 relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="font-header text-base text-primary uppercase tracking-wider">
            LISTA GNIOTÓW
          </h3>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-white/10 border border-white/10 px-3 py-1 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="week">TYDZIEŃ</option>
          <option value="month">MIESIĄC</option>
          <option value="all">WSZYSTKIE</option>
        </select>
      </div>

      {loading ? (
        <div className="font-mono text-xs text-text-secondary">ŁADOWANIE...</div>
      ) : (
        <div className="space-y-2">
          {charts.map((chart, idx) => {
            const trend = getTrendIndicator(chart);
            const TrendIcon = trend?.icon;
            return (
              <motion.div
                key={chart.position}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ x: 4, scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 hover:border-red-500/50 transition-all rounded-sm relative overflow-hidden"
              >
                <SongItemBackground thumbnail={chart.thumbnail} />
                <div className="w-12 text-center font-mono text-xl font-bold text-red-500 shrink-0 relative z-10">
                  #{chart.position}
                </div>
                {chart.thumbnail && (
                  <div className="w-12 h-12 border border-red-500/50 rounded shrink-0 overflow-hidden relative z-10">
                    <ImageGlitch
                      src={chart.thumbnail}
                      alt={chart.title}
                      shouldGlitch={false}
                      className="w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="font-header text-sm text-text-primary mb-1 uppercase">
                    {chart.title || "Unknown"}
                  </div>
                  <div className="font-mono text-xs text-text-secondary uppercase">
                    {chart.artist || "Unknown"}
                  </div>
                  {chart.is_new && (
                    <div className="font-mono text-[10px] text-cyan-400 mt-1">
                      NOWOŚĆ NA LIŚCIE NAJGORSZYCH
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 relative z-10">
                  {TrendIcon && (
                    <TrendIcon size={16} className={trend.color} />
                  )}
                  <div className="font-mono text-xs text-text-secondary text-right">
                    {chart.votes} GŁOSÓW
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

