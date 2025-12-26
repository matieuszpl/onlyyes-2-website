import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import api from "../../api";

export default function ProfileOverview() {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const res = await api.get("/users/me/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Load stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <h4 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
          STATYSTYKI
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 p-4 text-center"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.1,
                }}
                className="h-6 bg-white/20 rounded w-12 mx-auto mb-2"
              />
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.15,
                }}
                className="h-3 bg-white/10 rounded w-16 mx-auto"
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <h4 className="font-header text-sm text-primary uppercase tracking-wider">
        STATYSTYKI
      </h4>
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="font-mono text-xl font-bold text-primary mb-1">
              {stats.suggestions_count}
            </div>
            <div className="font-mono text-xs text-text-secondary">
              PROPOZYCJI
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="font-mono text-xl font-bold text-primary mb-1">
              {stats.votes_count}
            </div>
            <div className="font-mono text-xs text-text-secondary">GŁOSÓW</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="font-mono text-xl font-bold text-primary mb-1">
              {stats.reputation_score}
            </div>
            <div className="font-mono text-xs text-text-secondary">
              REPUTACJA
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
