import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import { TrendingUp, UserPlus } from "lucide-react";
import { getIconComponent } from "../../utils/badgeIcons";
import api from "../../api";
import Card from "../Card";

export default function ProfileHeader() {
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

  if (!user) {
    return null;
  }

  return (
    <Card
      className="space-y-4 border relative overflow-hidden profile-header-card"
      style={{
        borderColor: user.featured_badge?.color
          ? `${user.featured_badge.color}60`
          : "rgba(255, 255, 255, 0.1)",
        background: user.featured_badge?.color
          ? `linear-gradient(135deg, ${user.featured_badge.color}25 0%, ${user.featured_badge.color}10 50%, transparent 100%)`
          : "linear-gradient(135deg, rgba(0, 243, 255, 0.15) 0%, rgba(0, 243, 255, 0.05) 50%, transparent 100%)",
      }}
    >
      <div className="relative overflow-hidden -mx-4 -mt-4">
        <div className="relative p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.display_name || user.username}
                    className="w-24 h-24 border-2 rounded-full object-cover shadow-lg"
                    style={{
                      borderColor: user.featured_badge?.color || "var(--primary)",
                    }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 border-2 rounded-full bg-white/5 flex items-center justify-center shadow-lg"
                    style={{
                      borderColor: user.featured_badge?.color || "var(--primary)",
                    }}
                  >
                    <UserPlus size={32} className="text-text-secondary" />
                  </div>
                )}
                {user.featured_badge && (
                  <div
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor:
                        user.featured_badge.color || "var(--primary)",
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(
                        user.featured_badge.icon
                      );
                      return (
                        <IconComponent
                          size={16}
                          className="text-black"
                          strokeWidth={2.5}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-header text-lg font-bold truncate"
                      style={{
                        color: user.featured_badge?.color || "var(--primary)",
                      }}
                    >
                      {user.display_name || user.username}
                    </div>
                    {user.rank && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <div
                          className="font-mono text-xs px-2 py-0.5 rounded border"
                          style={{
                            color: user.featured_badge?.color || "var(--primary)",
                            backgroundColor: user.featured_badge?.color
                              ? `${user.featured_badge.color}20`
                              : "rgba(0, 243, 255, 0.2)",
                            borderColor: user.featured_badge?.color
                              ? `${user.featured_badge.color}50`
                              : "rgba(0, 243, 255, 0.3)",
                          }}
                        >
                          {user.rank.name}
                        </div>
                      </div>
                    )}
                  </div>
                  {loading ? (
                    <div className="flex items-center gap-4 shrink-0">
                      {[1, 2, 3].map((idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="text-center"
                        >
                          <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: idx * 0.1,
                            }}
                            className="h-6 bg-white/20 rounded w-10 mb-1"
                          />
                          <motion.div
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: idx * 0.15,
                            }}
                            className="h-2 bg-white/10 rounded w-12 mx-auto"
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : stats ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <div
                          className="font-mono text-sm font-bold mb-0.5"
                          style={{
                            color: user.featured_badge?.color || "var(--primary)",
                          }}
                        >
                          {stats.suggestions_count}
                        </div>
                        <div className="font-mono text-[9px] text-text-secondary">
                          PROPOZYCJI
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className="font-mono text-sm font-bold mb-0.5"
                          style={{
                            color: user.featured_badge?.color || "var(--primary)",
                          }}
                        >
                          {stats.votes_count}
                        </div>
                        <div className="font-mono text-[9px] text-text-secondary">
                          GŁOSÓW
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className="font-mono text-sm font-bold mb-0.5"
                          style={{
                            color: user.featured_badge?.color || "var(--primary)",
                          }}
                        >
                          {stats.reputation_score}
                        </div>
                        <div className="font-mono text-[9px] text-text-secondary">
                          REPUTACJA
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                {user.featured_badge && (
                  <div
                    className="mb-2 p-2 rounded border bg-white/5"
                    style={{
                      borderColor: `${user.featured_badge.color}40`,
                      backgroundColor: `${user.featured_badge.color}10`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="p-1.5 rounded border shrink-0"
                        style={{
                          backgroundColor: `${user.featured_badge.color}25`,
                          borderColor: `${user.featured_badge.color}50`,
                        }}
                      >
                        {(() => {
                          const IconComponent = getIconComponent(
                            user.featured_badge.icon
                          );
                          return (
                            <IconComponent
                              size={14}
                              style={{
                                color: user.featured_badge.color || "#ffffff",
                              }}
                            />
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-mono text-xs font-bold truncate mb-0.5"
                          style={{
                            color: user.featured_badge.color || "#ffffff",
                          }}
                        >
                          {user.featured_badge.name}
                        </div>
                        {user.featured_badge.description && (
                          <div className="font-mono text-[9px] text-text-secondary line-clamp-1">
                            {user.featured_badge.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {user.rank && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp
                          size={12}
                          style={{
                            color: user.featured_badge?.color || "var(--primary)",
                          }}
                        />
                        <span
                          className="font-mono text-xs font-bold"
                          style={{
                            color: user.featured_badge?.color || "var(--primary)",
                          }}
                        >
                          {user.xp || 0} XP
                        </span>
                      </div>
                      {user.rank.next_rank && (
                        <span className="font-mono text-[9px] text-text-secondary">
                          {user.rank.next_rank_xp - (user.xp || 0)} do{" "}
                          {user.rank.next_rank}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            user.featured_badge?.color || "var(--primary)",
                          width: `${user.rank.progress || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
