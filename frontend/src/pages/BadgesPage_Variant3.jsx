// WARIANT 3: Kompaktowy grid z efektami hover i animacjami (nowoczesny, dynamiczny)
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
  TrendingUp,
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 p-4 rounded-lg aspect-square"
              />
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: idx * 0.03,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`relative group aspect-square overflow-hidden rounded-lg p-4 transition-all duration-300 ${
                  unlocked
                    ? "bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border-2 border-primary/50 shadow-lg shadow-primary/20"
                    : "bg-white/5 border-2 border-white/10 opacity-60"
                } cursor-pointer`}
              >
                {/* Shine effect dla odblokowanych */}
                {unlocked && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: "-200%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Badge indicator */}
                {unlocked && (
                  <div className="absolute top-2 right-2 z-10">
                    {repeatable && maxCount ? (
                      <div className="bg-primary text-black px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border border-primary/80">
                        {currentCount}x/{maxCount}x
                      </div>
                    ) : (
                      <div className="bg-primary/95 p-1 rounded-full border border-primary shadow-lg">
                        <CheckCircle2
                          size={10}
                          className="text-black fill-black"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Icon - większy, bardziej widoczny */}
                <div className="flex items-center justify-center h-20 mb-3 relative z-10">
                  <IconComponent
                    size={48}
                    className={`transition-all duration-300 ${
                      unlocked
                        ? "text-primary drop-shadow-[0_0_10px_rgba(0,243,255,0.7)] group-hover:scale-110"
                        : "text-text-secondary opacity-30"
                    }`}
                    style={{
                      filter: unlocked
                        ? "none"
                        : "grayscale(100%) brightness(0.3)",
                    }}
                  />
                </div>

                {/* Name */}
                <div
                  className={`font-mono text-xs font-bold mb-1 text-center relative z-10 line-clamp-1 ${
                    unlocked ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {badge.name}
                </div>

                {/* Description - krótka */}
                {badge.description && (
                  <div className="font-mono text-[9px] text-text-secondary line-clamp-2 mb-2 text-center relative z-10 min-h-[2rem]">
                    {badge.description}
                  </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1 relative z-10">
                  {badge.xp_reward > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Trophy size={8} className="text-accent-cyan" />
                      <span className="font-mono text-[9px] text-accent-cyan font-bold">
                        +{badge.xp_reward} XP
                      </span>
                    </div>
                  )}

                  {unlocked && userBadge?.awarded_at && (
                    <div className="text-center">
                      <div className="font-mono text-[8px] text-text-secondary">
                        {new Date(userBadge.awarded_at).toLocaleDateString(
                          "pl-PL",
                          {
                            day: "2-digit",
                            month: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compact stats */}
                  <div className="flex items-center justify-center gap-1 pt-1 border-t border-white/5">
                    <TrendingUp size={8} className="text-text-secondary" />
                    <div className="font-mono text-[8px] text-text-secondary">
                      {badge.percentage > 0 ? `${badge.percentage}%` : "0%"}
                    </div>
                  </div>
                </div>

                {/* Hover tooltip z pełną informacją */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-primary/50 z-20 hidden group-hover:flex flex-col justify-center items-center text-center space-y-2"
                >
                  <div className="font-mono text-xs font-bold text-primary mb-1">
                    {badge.name}
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary mb-2">
                    {badge.description}
                  </div>
                  {unlocked && userBadge?.awarded_at && (
                    <div className="font-mono text-[9px] text-primary">
                      Zdobyto:{" "}
                      {new Date(userBadge.awarded_at).toLocaleDateString(
                        "pl-PL"
                      )}
                    </div>
                  )}
                  <div className="font-mono text-[9px] text-text-secondary">
                    {getStatisticText(badge)}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
