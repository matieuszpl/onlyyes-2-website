import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Heart, UserPlus, Radio, X, Activity } from "lucide-react";
import api from "../api";
import UserTooltip from "./UserTooltip";

const iconMap = {
  heart: Heart,
  music: Music,
  user: UserPlus,
  radio: Radio,
};

const getActivityColor = (type, voteType) => {
  if (type === "vote") {
    return voteType === "LIKE" ? "text-green-400" : "text-red-400";
  }
  if (type === "suggestion") {
    return "text-accent-cyan";
  }
  return "text-primary";
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

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
            icon: Icon,
            text: item.text,
            username: item.username,
            user_id: item.user_id,
            avatar_url: item.avatar_url,
            type: item.type,
            vote_type: item.vote_type,
            color: getActivityColor(item.type, item.vote_type),
            time: timeText,
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

  const handleUserClick = async (userId) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setUserStats(null);
      return;
    }
    setSelectedUser(userId);
    setLoadingStats(true);
    try {
      const res = await api.get(`/users/${userId}/stats`);
      setUserStats(res.data);
    } catch (error) {
      console.error("Load user stats error:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const renderActivityText = (item) => {
    if (!item.username || !item.user_id) return item.text;
    const parts = item.text.split(item.username);
    if (parts.length < 2) return item.text;
    return (
      <>
        {parts[0]}
        <UserTooltip userId={item.user_id} username={item.username}>
          <span
            onClick={() => handleUserClick(item.user_id)}
            className="text-primary hover:text-accent-cyan cursor-pointer font-bold transition-colors"
          >
            {item.username}
          </span>
        </UserTooltip>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="glass-panel p-4 space-y-2 relative">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={14} className="text-primary" />
        <h3 className="font-header text-sm text-primary uppercase tracking-wider">
          AKTYWNOŚĆ
        </h3>
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[...Array(5)].map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-sm"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.1,
                }}
                className="w-3.5 h-3.5 bg-white/20 rounded"
              />
              <div className="flex-1 space-y-1">
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="h-2.5 bg-white/20 rounded w-3/4"
                />
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.15,
                  }}
                  className="h-2 bg-white/10 rounded w-1/2"
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="font-mono text-[10px] text-text-secondary">
          BRAK AKTYWNOŚCI
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {feed.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-sm"
              >
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt={item.username}
                    className="w-6 h-6 border border-primary/50 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 border border-primary/50 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <UserPlus size={12} className="text-text-secondary" />
                  </div>
                )}
                <Icon size={12} className={item.color} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-text-primary">
                    {renderActivityText(item)}
                  </div>
                  <div className="font-mono text-[9px] text-text-secondary">
                    {item.time}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedUser && userStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel p-4 border border-primary/50 z-50"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-header text-sm text-primary uppercase">
                  {userStats.username}
                </div>
                {userStats.avatar_url && (
                  <img
                    src={userStats.avatar_url}
                    alt={userStats.username}
                    className="w-12 h-12 rounded-full mt-2"
                  />
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserStats(null);
                }}
                className="text-text-secondary hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">PROPOZYCJE:</span>
                <span className="text-text-primary">
                  {userStats.suggestions_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">GŁOSY:</span>
                <span className="text-text-primary">
                  {userStats.votes_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">REPUTACJA:</span>
                <span className="text-primary">
                  {userStats.reputation_score}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
