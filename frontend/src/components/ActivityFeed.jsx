import { useState, useEffect } from "react";
import { Music, Heart, UserPlus, Radio, Activity, ThumbsUp, ThumbsDown } from "lucide-react";
import api from "../api";
import UserTooltip from "./UserTooltip";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import ImageGlitch from "./ImageGlitch";
import { getIconComponent } from "../utils/badgeIcons";

const iconMap = {
  heart: Heart,
  music: Music,
  user: UserPlus,
  radio: Radio,
};

const getActivityIcon = (type, voteType) => {
  if (type === "vote") {
    return voteType === "LIKE" || voteType === "like" || voteType === "upvote" ? ThumbsUp : ThumbsDown;
  }
  if (type === "suggestion") {
    return Music;
  }
  return Activity;
};

const getActivityColor = (type, voteType) => {
  if (type === "vote") {
    return voteType === "LIKE" || voteType === "like" || voteType === "upvote" ? "text-green-400" : "text-red-400";
  }
  if (type === "suggestion") {
    return "text-cyan-400";
  }
  return "text-primary";
};

const getActivityGradient = (type, voteType) => {
  if (type === "vote") {
    return voteType === "LIKE" || voteType === "like" || voteType === "upvote" ? "from-green-500/30 via-green-400/20 to-green-500/30" : "from-red-500/30 via-red-400/20 to-red-500/30";
  }
  if (type === "suggestion") {
    return "from-cyan-500/30 via-cyan-400/20 to-cyan-500/30";
  }
  return "from-primary/30 via-primary/20 to-primary/30";
};

const getActivityBorderColor = (type, voteType) => {
  if (type === "vote") {
    return voteType === "LIKE" || voteType === "like" || voteType === "upvote" ? "border-green-400/50" : "border-red-400/50";
  }
  if (type === "suggestion") {
    return "border-cyan-400/50";
  }
  return "border-primary/50";
};

const formatTimeAgo = (minutesAgo) => {
  if (minutesAgo < 1) return "teraz";
  if (minutesAgo < 60) return `${minutesAgo} min temu`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} ${
      hoursAgo === 1 ? "godzinę" : hoursAgo < 5 ? "godziny" : "godzin"
    } temu`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) {
    return `${daysAgo} ${daysAgo === 1 ? "dzień" : "dni"} temu`;
  }

  const weeksAgo = Math.floor(daysAgo / 7);
  if (weeksAgo < 4) {
    return `${weeksAgo} ${
      weeksAgo === 1 ? "tydzień" : weeksAgo < 5 ? "tygodnie" : "tygodni"
    } temu`;
  }

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo === 1) return "miesiąc temu";
  return `${monthsAgo} miesięcy temu`;
};

export default function ActivityFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await api.get("/activity?limit=10");
        const activities = res.data.map((item) => {
          const Icon = iconMap[item.icon] || Music;
          const timestamp = item.timestamp
            ? new Date(item.timestamp)
            : new Date();
          const minutesAgo = Math.floor(
            (Date.now() - timestamp.getTime()) / 60000
          );
          const timeText = formatTimeAgo(minutesAgo);

          return {
            id: item.timestamp || Date.now(),
            text: item.text,
            username: item.username,
            user_id: item.user_id,
            avatar_url: item.avatar_url,
            type: item.type,
            vote_type: item.vote_type,
            time: timeText,
            featured_badge: item.featured_badge,
          };
        });
        setFeed(activities);
      } catch (error) {
        console.error("Load activity error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
    const interval = setInterval(loadActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderActivityText = (item) => {
    if (!item.username || !item.user_id) return item.text;
    const parts = item.text.split(item.username);
    if (parts.length < 2) return item.text;
    const badgeColor = item.featured_badge?.color || "var(--primary)";
    return (
      <>
        {parts[0]}
        <UserTooltip userId={item.user_id} username={item.username}>
          <span 
            className="cursor-pointer font-bold transition-colors"
            style={{
              color: badgeColor,
            }}
          >
            {item.username}
          </span>
        </UserTooltip>
        {parts[1]}
      </>
    );
  };

  return (
    <Card className="space-y-4 relative">
      <SectionHeader
        icon={Activity}
        title="AKTYWNOŚĆ"
        iconGradient="linear-gradient(135deg, rgba(57, 255, 20, 0.65) 0%, rgba(57, 255, 20, 0.40) 50%, transparent 100%)"
        iconColor="rgba(57, 255, 20, 1)"
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2"
            >
              <div className="w-8 h-8 bg-white/20 rounded shrink-0 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/20 rounded w-24 animate-pulse" />
                <div className="h-2 bg-white/10 rounded w-32 animate-pulse" />
              </div>
              <div className="h-2 bg-white/10 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>
      ) : feed.length === 0 ? (
        <p className="font-mono text-xs text-text-secondary p-2">
          BRAK AKTYWNOŚCI
        </p>
      ) : (
        <div className="space-y-1.5">
          {feed.map((item) => {
            const Icon = getActivityIcon(item.type, item.vote_type);
            const color = getActivityColor(item.type, item.vote_type);
            const gradient = getActivityGradient(item.type, item.vote_type);
            const borderColor = getActivityBorderColor(item.type, item.vote_type);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded shrink-0 ${color} ${borderColor} relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <Icon size={14} className="relative z-10" />
                </div>
                <div className="relative shrink-0">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.username}
                      className="w-8 h-8 border-2 rounded-full object-cover"
                      style={{
                        borderColor: item.featured_badge?.color || "var(--primary)",
                      }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 border-2 rounded-full bg-white/5 flex items-center justify-center"
                      style={{
                        borderColor: item.featured_badge?.color || "var(--primary)",
                      }}
                    >
                      <UserPlus size={12} className="text-text-secondary" />
                    </div>
                  )}
                  {item.featured_badge && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border border-white/20 flex items-center justify-center"
                      style={{
                        backgroundColor: item.featured_badge.color || "var(--primary)",
                      }}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(item.featured_badge.icon);
                        return (
                          <IconComponent
                            size={8}
                            className="text-black"
                            strokeWidth={2.5}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-text-primary">
                    {renderActivityText(item)}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-text-secondary shrink-0">
                  {item.time}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
