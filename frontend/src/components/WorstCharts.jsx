import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import api from "../api";

export default function WorstCharts() {
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

  return (
    <div className="glass-panel p-4 space-y-3 relative">
      <div className="flex justify-between items-center">
        <h3 className="font-header text-base text-primary uppercase tracking-wider">
          NAJGORSZE UTWORY
        </h3>
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
        <div className="space-y-2">
          {[...Array(10)].map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-3 bg-white/5 border border-white/10"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.1,
                }}
                className="w-12 h-12 bg-red-500/20 rounded border border-red-500/30 flex items-center justify-center"
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="h-4 bg-white/20 rounded w-3/4"
                />
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.15,
                  }}
                  className="h-3 bg-white/10 rounded w-1/2"
                />
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={14} className="text-red-500/50" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="h-3 bg-white/10 rounded w-16"
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : charts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <AlertTriangle size={32} className="text-red-500/50 mb-3" />
          <div className="font-header text-sm text-text-primary mb-2">
            BRAK GŁOSÓW
          </div>
          <div className="font-mono text-xs text-text-secondary max-w-xs">
            Nie ma jeszcze żadnych głosów w tym okresie. Zagłosuj na utwory,
            które Ci się nie podobają!
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {charts.map((chart) => (
            <div
              key={chart.position}
              className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 hover:border-red-500/50 transition-all"
            >
              <div className="w-12 text-center font-mono text-xl font-bold text-red-500">
                #{chart.position}
              </div>
              <div className="flex-1">
                <div className="font-header text-sm text-text-primary mb-1 uppercase">
                  {chart.title?.startsWith("Song ") ||
                  chart.title?.startsWith("SONG ")
                    ? `SONG ${chart.song_id?.toUpperCase() || "UNKNOWN"}`
                    : chart.title || "UNKNOWN"}
                </div>
                <div className="font-mono text-xs text-text-secondary uppercase">
                  {chart.artist?.startsWith("Artist ") ||
                  chart.artist?.startsWith("ARTIST ")
                    ? `Artist ${chart.song_id?.toLowerCase() || "unknown"}`
                    : chart.artist || "UNKNOWN"}
                </div>
              </div>
              <div className="font-mono text-xs text-text-secondary">
                {chart.votes} GŁOSÓW
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
