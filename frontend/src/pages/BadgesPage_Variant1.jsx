// WARIANT 1: Minimalistyczny, nowoczesny design z gradientami i subtelnymi efektami
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import PageHeader from "../components/layout/PageHeader";
import {
  Award,
  CheckCircle2,
  Moon,
  Shield,
  Music,
  Headphones,
  ThumbsUp,
  ThumbsDown,
  Radio,
  Lightbulb,
  Trophy,
  Sparkles,
} from "lucide-react";

const iconMap = {
  "🌙": Moon,
  "🛡️": Shield,
  "🎵": Music,
  "🎧": Headphones,
  "👍": ThumbsUp,
  "👎": ThumbsDown,
  "📻": Radio,
  "💡": Lightbulb,
  "🏆": Trophy,
};

const getIconComponent = (iconString) => {
  if (!iconString) return Trophy;
  const IconComponent = iconMap[iconString];
  return IconComponent || Trophy;
};

export default function BadgesPage() {
  const { user } = useUser();
  const [allBadges, setAllBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    try {
      const allRes = await api.get("/badges");
      setAllBadges(allRes.data);

      if (user) {
        try {
          const userRes = await api.get("/users/me/badges");
          setUserBadges(userRes.data || []);
        } catch (error) {
          if (
            error.response?.status === 401 ||
            error.response?.status === 422
          ) {
            setUserBadges([]);
          } else {
            console.error("Load user badges error:", error);
          }
        }
      } else {
        setUserBadges([]);
      }
    } catch (error) {
      console.error("Load badges error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserBadge = (badgeId) => {
    return userBadges.find((b) => b.id === badgeId);
  };

  const isRepeatable = (badge) => {
    if (!badge.auto_award_config) return false;
    try {
      const config = JSON.parse(badge.auto_award_config);
      return config.count !== undefined;
    } catch {
      return false;
    }
  };

  const getMaxCount = (badge) => {
    if (!badge.auto_award_config) return null;
    try {
      const config = JSON.parse(badge.auto_award_config);
      if (config.count !== undefined) {
        return config.count * 20;
      }
    } catch {
      return null;
    }
    return null;
  };

  const getStatisticText = (badge) => {
    if (!badge.total_users || badge.total_users === 0) {
      return "Brak danych";
    }

    if (badge.users_count === 0) {
      return "Nikt nie zdobył jeszcze tej odznaki";
    }

    if (badge.percentage === 0) {
      return "Mniej niż 0.1% słuchaczy zdobyło tę odznakę";
    }

    return `${badge.percentage}% słuchaczy zdobyło tę odznakę`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="OSIĄGNIĘCIA"
          subtitle="Wszystkie dostępne osiągnięcia"
          icon={Award}
        />
        <div className="glass-panel p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 p-4 text-center rounded-sm"
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="h-12 w-12 bg-white/20 rounded-full mx-auto mb-2"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = userBadges.length;
  const totalCount = allBadges.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="OSIĄGNIĘCIA"
        subtitle="Wszystkie dostępne osiągnięcia"
        icon={Award}
      />

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-sm border border-primary/30">
              <Award size={20} className="text-primary" />
            </div>
            <div>
              <div className="font-mono text-xs text-text-secondary mb-1">
                POSTĘP
              </div>
              <div className="font-header text-lg text-primary">
                {unlockedCount} / {totalCount}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-text-secondary mb-1">
              PROCENT
            </div>
            <div className="font-header text-lg text-accent-cyan">
              {totalCount > 0
                ? Math.round((unlockedCount / totalCount) * 100)
                : 0}
              %
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allBadges.map((badge, idx) => {
            const userBadge = getUserBadge(badge.id);
            const unlocked = !!userBadge;
            const repeatable = isRepeatable(badge);
            const maxCount = getMaxCount(badge);
            const currentCount = userBadge?.count || 0;
            const IconComponent = getIconComponent(badge.icon);

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative group overflow-hidden ${
                  unlocked
                    ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/40"
                    : "bg-white/5 border-2 border-white/10"
                } rounded-lg p-4 transition-all duration-300 hover:scale-105`}
              >
                {/* Gradient overlay dla odblokowanych */}
                {unlocked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                )}

                {/* Sparkle effect dla odblokowanych */}
                {unlocked && (
                  <motion.div
                    className="absolute top-2 right-2"
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles size={16} className="text-primary/60" />
                  </motion.div>
                )}

                {/* Badge indicator */}
                {unlocked && (
                  <div className="absolute top-2 left-2 z-10">
                    {repeatable && maxCount ? (
                      <div className="bg-primary/95 text-black px-2 py-0.5 rounded-full border border-primary font-mono text-[9px] font-bold shadow-lg">
                        {currentCount}x/{maxCount}x
                      </div>
                    ) : (
                      <div className="bg-primary/95 p-1 rounded-full border-2 border-primary shadow-lg">
                        <CheckCircle2
                          size={12}
                          className="text-black fill-black"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center mb-3 relative z-10">
                  <div
                    className={`p-3 rounded-full ${
                      unlocked
                        ? "bg-primary/20 border-2 border-primary/50"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <IconComponent
                      size={40}
                      className={`transition-all duration-300 ${
                        unlocked
                          ? "text-primary drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]"
                          : "text-text-secondary opacity-50"
                      }`}
                      style={{
                        filter: unlocked
                          ? "none"
                          : "grayscale(100%) brightness(0.5)",
                      }}
                    />
                  </div>
                </div>

                {/* Name */}
                <div
                  className={`font-mono text-xs font-bold mb-2 text-center relative z-10 ${
                    unlocked ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {badge.name}
                </div>

                {/* Description */}
                {badge.description && (
                  <div className="font-mono text-[10px] text-text-secondary line-clamp-2 mb-3 min-h-[2.5rem] text-center relative z-10">
                    {badge.description}
                  </div>
                )}

                {/* XP and Date */}
                <div className="space-y-2 mt-3 pt-3 border-t border-white/5 relative z-10">
                  {badge.xp_reward > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Trophy size={10} className="text-accent-cyan" />
                      <div className="font-mono text-[10px] text-accent-cyan font-bold">
                        +{badge.xp_reward} XP
                      </div>
                    </div>
                  )}

                  {unlocked && userBadge?.awarded_at && (
                    <div className="space-y-0.5">
                      <div className="font-mono text-[8px] text-text-secondary text-center">
                        Zdobyto:
                      </div>
                      <div className="font-mono text-[9px] text-primary text-center">
                        {new Date(userBadge.awarded_at).toLocaleDateString(
                          "pl-PL",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  )}

                  <div className="font-mono text-[8px] text-text-secondary text-center mt-2 pt-2 border-t border-white/5">
                    {getStatisticText(badge)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
