import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import api from "../api";

export default function UserProfile() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        api.get("/users/me/history"),
        api.get("/users/me/stats"),
      ]);
      setHistory(historyRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="glass-panel p-4 relative">
        <p className="font-mono text-sm text-text-secondary">
          ZALOGUJ SIĘ, ABY ZOBACZYĆ PROFIL
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <div className="font-mono text-xs text-text-secondary">
          ŁADOWANIE...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-3 relative">
      <div className="flex items-center gap-4">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-16 h-16 border-2 border-primary"
          />
        )}
        <div>
          <h3 className="font-header text-base text-primary uppercase tracking-wider">
            {user.username}
          </h3>
          <div className="font-mono text-xs text-text-secondary">
            REP: {stats?.reputation_score || 0} PTS
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="font-mono text-xl font-bold text-primary mb-1">
              {stats.suggestions_count}
            </div>
            <div className="font-mono text-xs text-text-secondary">
              PROPOZYCJI
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="font-mono text-xl font-bold text-primary mb-1">
              {stats.votes_count}
            </div>
            <div className="font-mono text-xs text-text-secondary">GŁOSÓW</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="font-mono text-xl font-bold text-primary mb-1">
              {stats.reputation_score}
            </div>
            <div className="font-mono text-xs text-text-secondary">
              REPUTACJA
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
          HISTORIA AKTYWNOŚCI
        </h4>
        {history.length === 0 ? (
          <p className="font-mono text-xs text-text-secondary">BRAK HISTORII</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 p-3 hover:border-primary/50 transition-all rounded-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-header text-sm text-text-primary mb-1">
                      {item.title} - {item.artist}
                    </div>
                    <div className="font-mono text-xs text-text-secondary">
                      {item.type === "suggestion" ? "PROPOZYCJA" : "GŁOS"} •{" "}
                      {item.status || item.vote_type}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
