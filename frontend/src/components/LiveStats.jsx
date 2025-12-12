import { useState, useEffect } from "react";
import { Users, Music, Clock, BarChart3, Play, Zap } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api";
import StatsCard from "./StatsCard";

export default function LiveStats() {
  const [stats, setStats] = useState({
    listeners: 0,
    songs: 0,
    today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get("/radio/info");
        setStats({
          listeners: res.data.listeners_online || 0,
          songs: res.data.songs_in_database || 0,
          today: res.data.songs_played_today || 0,
        });
      } catch (error) {
        console.error("Load stats error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-4 border-red-400/20">
        <h3 className="font-header text-sm text-red-400 uppercase tracking-wider mb-3">
          PANEL ADMINISTRATORA
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="font-mono text-xs text-text-secondary">
              ŁADOWANIE...
            </div>
          ))}
        </div>
      </div>
    );
  }

  const triggerAnimations = () => {
    setAnimKey((prev) => prev + 1);
    const event = new CustomEvent("testAnimations");
    window.dispatchEvent(event);
    document.body.classList.add("animate-test");
    setTimeout(() => {
      document.body.classList.remove("animate-test");
    }, 100);
  };

  const triggerGlitch = () => {
    const event = new CustomEvent("testGlitch");
    window.dispatchEvent(event);
  };

  return (
    <div className="glass-panel p-4 space-y-3 border-red-400/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-red-400" />
          <h3 className="font-header text-sm text-red-400 uppercase tracking-wider">
            PANEL ADMINISTRATORA
          </h3>
        </div>
      </div>
      <div className="space-y-2">
        <StatsCard
          icon={Users}
          label="SŁUCHACZY"
          value={stats.listeners}
          accent="cyan"
        />
        <StatsCard
          icon={Music}
          label="UTWORÓW"
          value={stats.songs}
          accent="primary"
        />
        <StatsCard
          icon={Clock}
          label="DZISIAJ"
          value={stats.today}
          accent="magenta"
        />
      </div>
      <motion.button
        key={animKey}
        onClick={triggerAnimations}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full mt-3 px-3 py-2 bg-red-400/10 border border-red-400/30 hover:border-red-400/50 hover:bg-red-400/20 transition-all rounded-sm flex items-center justify-center gap-2"
      >
        <Play size={14} className="text-red-400" />
        <span className="font-mono text-xs text-red-400 uppercase">
          TESTUJ ANIMACJE
        </span>
      </motion.button>
      <motion.button
        onClick={triggerGlitch}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full mt-2 px-3 py-2 bg-red-400/10 border border-red-400/30 hover:border-red-400/50 hover:bg-red-400/20 transition-all rounded-sm flex items-center justify-center gap-2"
      >
        <Zap size={14} className="text-red-400" />
        <span className="font-mono text-xs text-red-400 uppercase">
          TEST ANIMACJI GLITCH
        </span>
      </motion.button>
    </div>
  );
}
