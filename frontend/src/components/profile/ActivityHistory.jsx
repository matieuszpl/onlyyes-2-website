import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { Music, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import ImageGlitch from "../ImageGlitch";
import { useAlbumColors } from "../../hooks/useAlbumColors";
import api from "../../api";
import Card from "../Card";

const getActivityIcon = (type, voteType) => {
  if (type === "suggestion") return Music;
  if (voteType === "LIKE" || voteType === "like" || voteType === "upvote") return ThumbsUp;
  if (voteType === "DISLIKE" || voteType === "dislike" || voteType === "downvote") return ThumbsDown;
  return Clock;
};

const getActivityColor = (type, voteType, status) => {
  if (type === "suggestion") {
    if (status === "approved" || status === "accepted" || status === "APPROVED" || status === "ACCEPTED") return "text-green-400";
    if (status === "rejected" || status === "declined" || status === "REJECTED" || status === "DECLINED") return "text-red-400";
    return "text-cyan-400";
  }
  if (voteType === "LIKE" || voteType === "like" || voteType === "upvote") return "text-green-400";
  if (voteType === "DISLIKE" || voteType === "dislike" || voteType === "downvote") return "text-red-400";
  return "text-primary";
};

const getActivityGradient = (type, voteType, status) => {
  if (type === "suggestion") {
    if (status === "approved" || status === "accepted" || status === "APPROVED" || status === "ACCEPTED") return "from-green-500/30 via-green-400/20 to-green-500/30";
    if (status === "rejected" || status === "declined" || status === "REJECTED" || status === "DECLINED") return "from-red-500/30 via-red-400/20 to-red-500/30";
    return "from-cyan-500/30 via-cyan-400/20 to-cyan-500/30";
  }
  if (voteType === "LIKE" || voteType === "like" || voteType === "upvote") return "from-green-500/30 via-green-400/20 to-green-500/30";
  if (voteType === "DISLIKE" || voteType === "dislike" || voteType === "downvote") return "from-red-500/30 via-red-400/20 to-red-500/30";
  return "from-primary/30 via-primary/20 to-primary/30";
};

const getActivityBorderColor = (type, voteType, status) => {
  if (type === "suggestion") {
    if (status === "approved" || status === "accepted" || status === "APPROVED" || status === "ACCEPTED") return "border-green-400/50";
    if (status === "rejected" || status === "declined" || status === "REJECTED" || status === "DECLINED") return "border-red-400/50";
    return "border-cyan-400/50";
  }
  if (voteType === "LIKE" || voteType === "like" || voteType === "upvote") return "border-green-400/50";
  if (voteType === "DISLIKE" || voteType === "dislike" || voteType === "downvote") return "border-red-400/50";
  return "border-primary/50";
};

function ActivityItemBackground({ thumbnail, type, voteType }) {
  const colors = useAlbumColors(thumbnail);
  
  if (thumbnail && !colors.isDefault) {
    return (
      <div
        className="absolute inset-0 opacity-[0.42] blur-[80px] scale-150 -z-10"
        style={{
          backgroundImage: `url(${thumbnail})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  
  const color = getActivityColor(type, voteType);
  const bgColor = color.includes("green") ? "from-green-500/20" : color.includes("red") ? "from-red-500/20" : "from-cyan-500/20";
  
  return (
    <div className={`absolute inset-0 opacity-[0.15] blur-[60px] -z-10 bg-gradient-to-br ${bgColor} via-transparent to-transparent`} />
  );
}

export default function ActivityHistory() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const res = await api.get("/users/me/history");
      setHistory(res.data);
    } catch (error) {
      console.error("Load history error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="space-y-2">
        {[...Array(5)].map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2"
          >
            <div className="w-8 h-8 bg-white/20 rounded shrink-0 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse" />
              <div className="h-2 bg-white/10 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-2 bg-white/10 rounded w-12 animate-pulse" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      {history.length === 0 ? (
        <p className="font-mono text-xs text-text-secondary p-2">BRAK HISTORII</p>
      ) : (
        <div className="space-y-1.5">
          {history.map((item, index) => {
            const Icon = getActivityIcon(item.type, item.vote_type);
            const color = getActivityColor(item.type, item.vote_type, item.status);
            const gradient = getActivityGradient(item.type, item.vote_type, item.status);
            const borderColor = getActivityBorderColor(item.type, item.vote_type, item.status);
            return (
              <div
                key={item.id ? `${item.id}-${index}` : `activity-${index}`}
                className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 relative overflow-hidden"
              >
                <ActivityItemBackground thumbnail={item.thumbnail} type={item.type} voteType={item.vote_type} />
                <div className={`w-8 h-8 flex items-center justify-center rounded shrink-0 ${color} ${borderColor} relative z-10 overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <Icon size={14} className="relative z-10" />
                </div>
                {item.thumbnail && (
                  <div className="w-10 h-10 border border-primary/50 rounded shrink-0 overflow-hidden relative z-10">
                    <ImageGlitch
                      src={item.thumbnail}
                      alt={item.title}
                      shouldGlitch={false}
                      className="w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="font-header text-xs text-text-primary mb-0.5 uppercase truncate">
                    {item.title || "Unknown"}
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary uppercase truncate">
                    {item.artist || "Unknown"}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-text-secondary shrink-0 relative z-10">
                  {new Date(item.created_at).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
