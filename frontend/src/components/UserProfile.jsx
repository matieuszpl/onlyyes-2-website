import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import api from "../api";

export default function UserProfile() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [xpHistory, setXpHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const [historyRes, statsRes, xpHistoryRes] = await Promise.all([
        api.get("/users/me/history"),
        api.get("/users/me/stats"),
        api.get("/users/me/xp-history"),
      ]);
      setHistory(historyRes.data);
      setStats(statsRes.data);
      setXpHistory(xpHistoryRes.data);
    } catch (error) {
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="glass-panel p-4 relative">
        <p className="font-mono text-sm text-text-secondary">
          ZALOGUJ SIĘ, ABY ZOBACZYĆ PROFIL
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel p-4 space-y-3 relative">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="w-16 h-16 bg-white/10 rounded border-2 border-primary"
          />
          <div className="flex-1 space-y-2">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="h-5 bg-white/20 rounded w-32"
            />
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.1,
              }}
              className="h-3 bg-white/10 rounded w-24"
            />
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.2,
              }}
              className="h-2 bg-white/10 rounded-full w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((idx) => (
            <motion.div
              key={idx}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: idx * 0.1,
              }}
              className="bg-white/5 border border-white/10 p-4 text-center"
            >
              <div className="h-6 bg-white/20 rounded w-12 mx-auto mb-2" />
              <div className="h-3 bg-white/10 rounded w-16 mx-auto" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-3 relative">
      <div className="flex items-center gap-4">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-16 h-16 border-2 border-primary"
          />
        )}
        <div className="flex-1">
          <h3 className="font-header text-base text-primary uppercase tracking-wider">
            {user.username}
          </h3>
          {user.rank && (
            <>
              <div className="font-mono text-xs text-text-secondary mb-2">
                {user.rank.name}
              </div>
              <div className="w-full bg-bg-secondary/20 rounded-full h-3 mb-1 overflow-hidden">
                <div
                  className="bg-accent h-3 rounded-full transition-all duration-500"
                  style={{ width: `${user.rank.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-accent font-semibold">
                  {user.xp || 0} / {user.rank.next_rank_xp || user.xp || 0} XP
                </span>
                {user.rank.next_rank && (
                  <span className="text-text-secondary/70">
                    {user.rank.next_rank_xp - (user.xp || 0)} do{" "}
                    <span className="text-primary">{user.rank.next_rank}</span>
                  </span>
                )}
              </div>
            </>
          )}
          <div className="font-mono text-xs text-text-secondary mt-2">
            REP: {stats?.reputation_score || 0} PTS
          </div>
        </div>
      </div>

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

      <div>
        <h4 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
          HISTORIA XP
        </h4>
        {xpHistory.length === 0 ? (
          <p className="font-mono text-xs text-text-secondary">
            BRAK HISTORII XP
          </p>
        ) : (
          <div className="space-y-2">
            {xpHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 p-3 hover:border-primary/50 transition-all rounded-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-accent">
                        +{item.xp} XP
                      </span>
                      <span className="font-mono text-xs text-text-secondary">
                        {item.description}
                      </span>
                    </div>
                    {item.title && (
                      <div className="font-header text-xs text-text-primary">
                        {item.title} {item.artist && `- ${item.artist}`}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
                    {new Date(item.created_at).toLocaleDateString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
          HISTORIA AKTYWNOŚCI
        </h4>
        {history.length === 0 ? (
          <p className="font-mono text-xs text-text-secondary">BRAK HISTORII</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 p-3 hover:border-primary/50 transition-all rounded-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-header text-sm text-text-primary mb-1">
                      {item.title} - {item.artist}
                    </div>
                    <div className="font-mono text-xs text-text-secondary">
                      {item.type === "suggestion" ? "PROPOZYCJA" : "GŁOS"} •{" "}
                      {item.status || item.vote_type}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
