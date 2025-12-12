import { useState, useEffect } from "react";
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
        <div className="font-mono text-xs text-text-secondary">ŁADOWANIE...</div>
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
                  {chart.title?.startsWith("Song ") || chart.title?.startsWith("SONG ")
                    ? `SONG ${chart.song_id?.toUpperCase() || "UNKNOWN"}`
                    : chart.title || "UNKNOWN"}
                </div>
                <div className="font-mono text-xs text-text-secondary uppercase">
                  {chart.artist?.startsWith("Artist ") || chart.artist?.startsWith("ARTIST ")
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

