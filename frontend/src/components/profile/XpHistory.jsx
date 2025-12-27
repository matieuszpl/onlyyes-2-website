import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { TrendingUp, Award, Music, ThumbsUp, Lightbulb } from "lucide-react";
import api from "../../api";
import Card from "../Card";

const getXpIcon = (description) => {
  const desc = description?.toLowerCase() || "";
  if (desc.includes("głos") || desc.includes("vote")) return ThumbsUp;
  if (desc.includes("propozyc") || desc.includes("suggestion")) return Music;
  if (desc.includes("osiągnię") || desc.includes("badge")) return Award;
  if (desc.includes("aktywność") || desc.includes("activity")) return Lightbulb;
  return TrendingUp;
};

const getXpColor = (type, description) => {
  if (type === "vote") return "text-green-400";
  if (type === "listening") return "text-cyan-400";
  const desc = description?.toLowerCase() || "";
  if (desc.includes("osiągnię") || desc.includes("badge")) return "text-yellow-400";
  if (desc.includes("propozyc") || desc.includes("suggestion")) return "text-blue-400";
  return "text-primary";
};

const getXpGradient = (type, description) => {
  if (type === "vote") return "from-green-500/30 via-green-400/20 to-green-500/30";
  if (type === "listening") return "from-cyan-500/30 via-cyan-400/20 to-cyan-500/30";
  const desc = description?.toLowerCase() || "";
  if (desc.includes("osiągnię") || desc.includes("badge")) return "from-yellow-500/30 via-yellow-400/20 to-yellow-500/30";
  if (desc.includes("propozyc") || desc.includes("suggestion")) return "from-blue-500/30 via-blue-400/20 to-blue-500/30";
  return "from-primary/30 via-primary/20 to-primary/30";
};

const getXpBorderColor = (type, description) => {
  if (type === "vote") return "border-green-400/50";
  if (type === "listening") return "border-cyan-400/50";
  const desc = description?.toLowerCase() || "";
  if (desc.includes("osiągnię") || desc.includes("badge")) return "border-yellow-400/50";
  if (desc.includes("propozyc") || desc.includes("suggestion")) return "border-blue-400/50";
  return "border-primary/50";
};

export default function XpHistory() {
  const { user } = useUser();
  const [xpHistory, setXpHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadXpHistory();
    }
  }, [user]);

  const loadXpHistory = async () => {
    try {
      const res = await api.get("/users/me/xp-history");
      setXpHistory(res.data);
    } catch (error) {
      console.error("Load XP history error:", error);
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
              <div className="h-3 bg-white/20 rounded w-24 animate-pulse" />
              <div className="h-2 bg-white/10 rounded w-32 animate-pulse" />
            </div>
            <div className="h-2 bg-white/10 rounded w-12 animate-pulse" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      {xpHistory.length === 0 ? (
        <p className="font-mono text-xs text-text-secondary p-2">
          BRAK HISTORII XP
        </p>
      ) : (
        <div className="space-y-1.5">
          {xpHistory.map((item) => {
            const Icon = getXpIcon(item.description);
            const xpColor = getXpColor(item.type, item.description);
            const xpGradient = getXpGradient(item.type, item.description);
            const xpBorderColor = getXpBorderColor(item.type, item.description);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded shrink-0 ${xpColor} ${xpBorderColor} relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${xpGradient}`} />
                  <Icon size={14} className="relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-mono text-xs font-bold ${xpColor}`}>
                      +{item.xp} XP
                    </span>
                    <span className="font-mono text-[10px] text-text-secondary">
                      {item.description}
                    </span>
                  </div>
                  {item.title && (
                    <div className="font-header text-[10px] text-text-primary uppercase truncate">
                      {item.title} {item.artist && `- ${item.artist}`}
                    </div>
                  )}
                </div>
                <div className="font-mono text-[10px] text-text-secondary shrink-0">
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
