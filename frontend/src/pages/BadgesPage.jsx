import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/Card";
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
import TextGlitch from "../components/TextGlitch";

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

  const categoryIcons = {
    Słuchanie: Headphones,
    Głosowanie: ThumbsUp,
    Aktywność: Lightbulb,
    Specjalne: Star,
  };

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
        b.auto_award_type === "PLAYLIST_CONTRIBUTOR" ||
        b.auto_award_type === "BUG_REPORTS" ||
        b.auto_award_type === "FEATURE_REQUESTS"
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
    return "#00f3ff";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="font-brand text-3xl md:text-4xl text-primary tracking-wider">
            <TextGlitch
              text="ONLY YES"
              altTexts={[
                "ONLY YES",
                "0NLY Y3S",
                "0NL¥ ¥3$",
                "0N1Y Y35",
                "#+:|* {&><@$?",
              ]}
              className="font-brand"
            />
          </div>
        </div>
        <Card padding="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-20 bg-white/5 border border-white/10 animate-pulse"
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const unlockedCount = userBadges.length;
  const totalCount = allBadges.length;
  const overallProgress =
    totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const renderSplitScreen = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card padding="p-6">
          <div className="text-xs text-white/40 mb-4 uppercase">Statystyki</div>
          <div>
            <div className="text-xs text-white/40 mb-1">Postęp</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-light text-white">
                {unlockedCount} / {totalCount}
              </div>
                <div className="text-right flex-1 flex flex-col items-end">
                  <div className="text-sm text-white mb-1">
                    {Math.round(overallProgress)}%
                  </div>
                <div className="w-1/2 h-1.5 bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="p-6">
          <div className="text-xs text-white/40 mb-4 uppercase">Kategorie</div>
          <div className="space-y-3">
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
                <div key={categoryName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon size={16} className="text-white/60" />
                      <span className="text-sm text-white">{categoryName}</span>
                    </div>
                    <div className="text-right flex-1 flex flex-col items-end">
                      <div className="text-sm text-white mb-1">
                        {Math.round(progress)}%
                      </div>
                      <div className="w-1/2 h-1.5 bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-cyan-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {Object.entries(categories).map(([categoryName, badges]) => {
          if (badges.length === 0) return null;
          
          const CategoryIcon = categoryIcons[categoryName] || Zap;

          return (
            <div key={categoryName} className="space-y-3">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                <CategoryIcon size={20} className="text-white/60" />
                <h3 className="text-lg font-light text-white">{categoryName}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-4 border transition-all relative ${
                        unlocked
                          ? "bg-white/5 border-white/20"
                          : "bg-white/2 border-white/5 opacity-50"
                      }`}
                    >
                      {unlocked && userBadge?.awarded_at && (
                        <div className="absolute top-3 right-3 text-xs text-white/40">
                          {new Date(userBadge.awarded_at).toLocaleDateString("pl-PL")}
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 flex items-center justify-center ${
                            unlocked ? "bg-white/10" : "bg-white/5"
                          }`}
                        >
                          <IconComponent
                            size={20}
                            className={unlocked ? "" : "opacity-30"}
                            style={{ color: unlocked ? badgeColor : undefined }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm font-light mb-1 ${
                              unlocked ? "text-white" : "text-white/40"
                            }`}
                          >
                            {badge.name}
                          </h3>
                          <p className="text-xs text-white/50 line-clamp-2 mb-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={unlocked ? "text-cyan-400" : "text-white/40"}>
                              +{badge.xp_reward} XP
                            </span>
                            {unlocked && repeatable && maxCount && (
                              <span className="text-white/40">{currentCount}x/{maxCount}x</span>
                            )}
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 mb-8">
        <Award className="text-primary shrink-0" size={56} />
        <div>
          <h1 className="font-header text-4xl text-primary uppercase tracking-wider mb-0.5">
            OSIĄGNIĘCIA
          </h1>
          <p className="font-mono text-sm text-text-secondary">
            Wszystkie dostępne osiągnięcia
          </p>
        </div>
      </div>

      {renderSplitScreen()}
    </div>
  );
}
