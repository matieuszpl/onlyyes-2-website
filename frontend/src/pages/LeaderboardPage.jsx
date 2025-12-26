import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { Music, Clock, TrendingUp } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import api from "../api";

function XPProgressBar({ progress, nextRankXp }) {
  if (!nextRankXp) {
    return (
      <div className="w-full bg-bg-secondary/30 rounded-full h-2">
        <div className="bg-accent h-2 rounded-full" style={{ width: "100%" }} />
      </div>
    );
  }

  return (
    <div className="w-full bg-bg-secondary/30 rounded-full h-2">
      <div
        className="bg-accent h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await api.get("/leaderboard?limit=100");
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Load leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader subtitle="Top użytkownicy według zdobytego XP" />
        <div className="glass-panel p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg border bg-bg-secondary/30 border-border"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-8 w-12 bg-white/20 rounded"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-12 w-12 bg-white/10 rounded-full"
                  />
                  <div className="flex-1 space-y-2">
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.1,
                      }}
                      className="h-4 bg-white/20 rounded w-32"
                    />
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.15,
                      }}
                      className="h-2 bg-white/10 rounded w-24"
                    />
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.2,
                      }}
                      className="h-2 bg-white/10 rounded-full w-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Top użytkownicy według zdobytego XP" />

      <div className="glass-panel p-6">
        <div className="mb-6 p-4 bg-bg-secondary/30 border border-border rounded-lg">
          <h2 className="font-mono text-sm font-bold text-primary mb-3">
            JAK ZDOBYWAĆ XP?
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Music size={16} className="text-accent" />
              <span className="text-text-secondary">Głosowanie na utwory:</span>
              <span className="font-mono font-bold text-accent">+10 XP</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock size={16} className="text-accent" />
              <span className="text-text-secondary">Czas słuchania:</span>
              <span className="font-mono font-bold text-accent">+1 XP/min</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp size={16} className="text-accent" />
              <span className="text-text-secondary text-xs italic">
                Więcej aktywności wkrótce...
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = user && entry.id === user.id;
            return (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${
                  isCurrentUser
                    ? "bg-accent/20 border-accent"
                    : "bg-bg-secondary/30 border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold font-mono w-12 text-center">
                    #{entry.rank}
                  </div>
                  {entry.avatar_url && (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{entry.username}</span>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 bg-accent text-bg-primary rounded">
                          TY
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-secondary mb-2">
                      {entry.rank_name}
                    </div>
                    <XPProgressBar
                      progress={entry.progress}
                      nextRankXp={entry.next_rank_xp}
                    />
                    <div className="text-xs text-text-secondary mt-1 flex justify-between">
                      <span>{entry.xp} XP</span>
                      {entry.next_rank && (
                        <span>
                          {entry.next_rank_xp - entry.xp} XP do{" "}
                          {entry.next_rank}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
