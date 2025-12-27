// WARIANT 2: Duże karty z naciskiem na ikony i wizualne efekty (inspirowane Steam)
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
  Users,
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
        <Card padding="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 p-6 rounded-lg"
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="h-20 w-20 bg-white/20 rounded-lg mx-auto mb-4"
                />
              </motion.div>
          ))}
        </div>
      </Card>
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

      <Card padding="p-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative group overflow-hidden ${
                  unlocked
                    ? "bg-gradient-to-br from-primary/30 via-primary/10 to-bg-secondary border-2 border-primary/60 shadow-xl shadow-primary/20"
                    : "bg-white/5 border-2 border-white/10 opacity-70"
                } rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
              >
                {/* Animated background dla odblokowanych */}
                {unlocked && (
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      background: [
                        "radial-gradient(circle at 0% 0%, rgba(0, 243, 255, 0.3), transparent 50%)",
                        "radial-gradient(circle at 100% 100%, rgba(0, 243, 255, 0.3), transparent 50%)",
                        "radial-gradient(circle at 0% 0%, rgba(0, 243, 255, 0.3), transparent 50%)",
                      ],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Badge indicator */}
                {unlocked && (
                  <div className="absolute top-4 right-4 z-10">
                    {repeatable && maxCount ? (
                      <div className="bg-primary text-black px-3 py-1.5 rounded-full border-2 border-primary/80 shadow-lg font-mono text-xs font-bold">
                        {currentCount}x/{maxCount}x
                      </div>
                    ) : (
                      <div className="bg-primary/95 p-2 rounded-full border-2 border-primary shadow-lg ring-2 ring-primary/30">
                        <CheckCircle2
                          size={16}
                          className="text-black fill-black"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Large Icon */}
                <div className="flex items-center justify-center mb-4 relative z-10">
                  <div
                    className={`p-4 rounded-2xl transition-all duration-300 ${
                      unlocked
                        ? "bg-primary/20 border-2 border-primary/50 shadow-lg shadow-primary/30"
                        : "bg-white/5 border border-white/10"
                    } ${unlocked ? "group-hover:scale-110" : ""}`}
                  >
                    <IconComponent
                      size={64}
                      className={`transition-all duration-300 ${
                        unlocked
                          ? "text-primary drop-shadow-[0_0_12px_rgba(0,243,255,0.8)]"
                          : "text-text-secondary opacity-40"
                      }`}
                      style={{
                        filter: unlocked
                          ? "none"
                          : "grayscale(100%) brightness(0.3)",
                      }}
                    />
                  </div>
                </div>

                {/* Name */}
                <div
                  className={`font-header text-lg font-bold mb-3 text-center relative z-10 ${
                    unlocked ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {badge.name}
                </div>

                {/* Description */}
                {badge.description && (
                  <div className="font-mono text-sm text-text-secondary mb-4 min-h-[3rem] text-center relative z-10 leading-relaxed">
                    {badge.description}
                  </div>
                )}

                {/* Stats Bar */}
                <div className="mb-4 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-accent-cyan" />
                      <span className="font-mono text-xs text-accent-cyan font-bold">
                        +{badge.xp_reward} XP
                      </span>
                    </div>
                    {unlocked && userBadge?.awarded_at && (
                      <div className="text-right">
                        <div className="font-mono text-[9px] text-text-secondary">
                          Zdobyto:
                        </div>
                        <div className="font-mono text-xs text-primary">
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
                  </div>

                  {/* Progress bar dla statystyk */}
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${badge.percentage || 0}%` }}
                      transition={{ delay: idx * 0.1 + 0.3, duration: 0.8 }}
                      className={`h-full ${
                        unlocked ? "bg-primary" : "bg-white/20"
                      } rounded-full`}
                    />
                  </div>
                </div>

                {/* Statistics */}
                <div className="flex items-center gap-2 justify-center pt-3 border-t border-white/5 relative z-10">
                  <Users size={12} className="text-text-secondary" />
                  <div className="font-mono text-[10px] text-text-secondary">
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
