import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import PageHeader from "../components/layout/PageHeader";
import {
  Award,
  CheckCircle2,
  Users,
  Calendar,
  Zap,
  Star,
  Headphones,
  ThumbsUp,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { getIconComponent } from "../utils/badgeIcons";

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
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-20 bg-white/5 border border-white/10 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = userBadges.length;
  const totalCount = allBadges.length;
  const overallProgress =
    totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // Mapowanie kategorii do ikon
  const categoryIcons = {
    Słuchanie: Headphones,
    Głosowanie: ThumbsUp,
    Aktywność: Lightbulb,
    Specjalne: Star,
  };

  // Grupuj osiągnięcia według typu
  const categories = {
    Słuchanie: allBadges.filter(
      (b) =>
        b.auto_award_type === "LISTENING_TIME" ||
        b.auto_award_type === "SHOW_LISTENER"
    ),
    Głosowanie: allBadges.filter(
      (b) => b.auto_award_type === "LIKES" || b.auto_award_type === "DISLIKES"
    ),
    Aktywność: allBadges.filter(
      (b) =>
        b.auto_award_type === "SUGGESTIONS" ||
        b.auto_award_type === "PLAYLIST_CONTRIBUTOR"
    ),
    Specjalne: allBadges.filter(
      (b) =>
        b.auto_award_type === "NIGHT_SHIFT" ||
        b.auto_award_type === "PLAYLIST_GUARDIAN" ||
        !b.auto_award_type
    ),
  };

  const getBadgeColor = (badge) => {
    if (badge.color) {
      return badge.color;
    }
    return "#00f3ff"; // domyślny primary
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="OSIĄGNIĘCIA"
        subtitle="Wszystkie dostępne osiągnięcia"
        icon={Award}
      />

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
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
              {Math.round(overallProgress)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full rounded-full shadow-lg"
              style={{
                background:
                  "linear-gradient(to right, var(--primary), var(--accent-cyan))",
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="space-y-8">
          {Object.entries(categories).map(([categoryName, badges]) => {
            const unlockedInCategory = badges.filter((b) =>
              getUserBadge(b.id)
            ).length;
            const progress =
              badges.length > 0
                ? (unlockedInCategory / badges.length) * 100
                : 0;
            const CategoryIcon = categoryIcons[categoryName] || Zap;

            return (
              <div key={categoryName} className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded border border-primary/30">
                      <CategoryIcon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-header text-lg text-primary">
                        {categoryName}
                      </h3>
                      <div className="font-mono text-xs text-text-secondary">
                        {unlockedInCategory} / {badges.length} osiągnięć
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-header text-2xl text-accent-cyan">
                      {Math.round(progress)}%
                    </div>
                    <div className="font-mono text-[10px] text-text-secondary">
                      POSTĘP
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(to right, var(--primary), var(--accent-cyan))",
                    }}
                  />
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {badges.map((badge, idx) => {
                    const userBadge = getUserBadge(badge.id);
                    const unlocked = !!userBadge;
                    const repeatable = isRepeatable(badge);
                    const maxCount = getMaxCount(badge);
                    const currentCount = userBadge?.count || 0;
                    const IconComponent = getIconComponent(badge.icon);
                    const badgeColor = getBadgeColor(badge);

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative p-4 rounded-lg border-l-4 transition-all ${
                          unlocked
                            ? "hover:bg-opacity-20"
                            : "bg-white/5 border-l-white/20 border-white/10 opacity-60"
                        }`}
                        style={{
                          backgroundColor: unlocked
                            ? `${badgeColor}15`
                            : undefined,
                          borderLeftColor: unlocked ? badgeColor : undefined,
                          borderColor: unlocked ? `${badgeColor}30` : undefined,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${
                              unlocked
                                ? "border-2"
                                : "bg-white/5 border border-white/10"
                            }`}
                            style={{
                              backgroundColor: unlocked
                                ? `${badgeColor}20`
                                : undefined,
                              borderColor: unlocked
                                ? `${badgeColor}50`
                                : undefined,
                            }}
                          >
                            <IconComponent
                              size={32}
                              className={
                                unlocked ? "" : "text-text-secondary opacity-40"
                              }
                              style={{
                                color: unlocked ? badgeColor : undefined,
                                filter: unlocked
                                  ? "none"
                                  : "grayscale(100%) brightness(0.3)",
                              }}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3
                                className="font-mono text-sm font-bold"
                                style={{
                                  color: unlocked ? badgeColor : undefined,
                                }}
                              >
                                {badge.name}
                              </h3>
                              {unlocked && (
                                <div className="flex items-center gap-2">
                                  {repeatable && maxCount ? (
                                    <span
                                      className="px-2 py-0.5 rounded text-[9px] font-mono font-bold border"
                                      style={{
                                        backgroundColor: `${badgeColor}20`,
                                        color: badgeColor,
                                        borderColor: `${badgeColor}50`,
                                      }}
                                    >
                                      {currentCount}x/{maxCount}x
                                    </span>
                                  ) : (
                                    <CheckCircle2
                                      size={14}
                                      style={{ color: badgeColor }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="font-mono text-xs text-text-secondary mb-2 line-clamp-2">
                              {badge.description}
                            </p>
                            <div className="flex items-center gap-4 text-[10px] mb-2">
                              <div className="flex items-center gap-1">
                                <Trophy
                                  size={10}
                                  className="text-accent-cyan"
                                />
                                <span className="font-mono text-accent-cyan font-bold">
                                  +{badge.xp_reward} XP
                                </span>
                              </div>
                              {unlocked && userBadge?.awarded_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar
                                    size={10}
                                    className="text-text-secondary"
                                  />
                                  <span className="font-mono text-text-secondary">
                                    {new Date(
                                      userBadge.awarded_at
                                    ).toLocaleDateString("pl-PL")}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users
                                  size={10}
                                  className="text-text-secondary"
                                />
                                <span className="font-mono text-text-secondary">
                                  {getStatisticText(badge)}
                                </span>
                              </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="mt-2">
                              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${badge.percentage || 0}%`,
                                  }}
                                  transition={{
                                    delay: idx * 0.1 + 0.3,
                                    duration: 0.8,
                                  }}
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: unlocked
                                      ? badgeColor
                                      : "rgba(255, 255, 255, 0.2)",
                                  }}
                                />
                              </div>
                              <div className="text-right mt-0.5">
                                <span className="font-mono text-[9px] text-text-secondary">
                                  {badge.percentage > 0
                                    ? `${badge.percentage}%`
                                    : "0%"}{" "}
                                  słuchaczy
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
