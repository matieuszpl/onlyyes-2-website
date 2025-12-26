import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { Music, Clock, TrendingUp, Trophy, Star } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import api from "../api";
import UserTooltip from "../components/UserTooltip";

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

  const ranks = [
    { name: "Szumofon", min_xp: 0 },
    { name: "Koneser Bitów", min_xp: 500 },
    { name: "DJ Winamp", min_xp: 1500 },
    { name: "Kierownik Imprezy", min_xp: 5000 },
    { name: "Dyrektor Programowy", min_xp: 10000 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Top użytkownicy według zdobytego XP" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="glass-panel p-4 space-y-3">
            {leaderboard.map((entry, idx) => {
              const isCurrentUser = user && entry.id === user.id;
              const isTopOne = entry.rank === 1;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-lg border transition-all ${
                    isTopOne
                      ? "bg-gradient-to-r from-accent/30 to-primary/20 border-accent border-2 shadow-lg shadow-accent/20"
                      : isCurrentUser
                      ? "bg-accent/20 border-accent"
                      : "bg-bg-secondary/30 border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold font-mono w-12 text-center ${
                        isTopOne ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {isTopOne ? (
                        <div className="flex items-center justify-center">
                          <Trophy size={24} className="text-accent" />
                        </div>
                      ) : (
                        `#${entry.rank}`
                      )}
                    </div>
                    {entry.avatar_url && (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className={`rounded-full ${
                          isTopOne
                            ? "w-16 h-16 border-2 border-accent"
                            : "w-12 h-12"
                        }`}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserTooltip
                          userId={entry.id}
                          username={entry.username}
                        >
                          <span
                            className={`font-bold ${
                              isTopOne ? "text-accent text-lg" : ""
                            }`}
                          >
                            {entry.username}
                          </span>
                        </UserTooltip>
                        {isTopOne && (
                          <Star size={16} className="text-accent fill-accent" />
                        )}
                        {isCurrentUser && !isTopOne && (
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
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-4">
            <h2 className="font-header text-sm text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              JAK ZDOBYWAĆ XP?
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Music size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <div className="font-mono text-xs text-text-secondary">
                    Głosowanie
                  </div>
                  <div className="font-mono text-sm font-bold text-accent">
                    +10 XP
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <div className="font-mono text-xs text-text-secondary">
                    Czas słuchania
                  </div>
                  <div className="font-mono text-sm font-bold text-accent">
                    +1 XP/min
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4">
            <h2 className="font-header text-sm text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trophy size={16} />
              RANGI
            </h2>
            <div className="space-y-2">
              {ranks.map((rank, idx) => (
                <div
                  key={rank.name}
                  className="p-2 bg-white/5 border border-white/10 rounded-sm"
                >
                  <div className="font-mono text-xs text-primary font-bold">
                    {rank.name}
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary">
                    {rank.min_xp === 0
                      ? "Start"
                      : `${rank.min_xp.toLocaleString()} XP`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
