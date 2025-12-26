import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import api from "../../api";

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
      <div className="glass-panel p-4 space-y-4">
        <h4 className="font-header text-sm text-primary uppercase tracking-wider">
          HISTORIA AKTYWNOŚCI
        </h4>
        <div className="space-y-2">
          {[...Array(3)].map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 border border-white/10 p-3 rounded-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-4 bg-white/20 rounded w-3/4"
                  />
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.15,
                    }}
                    className="h-3 bg-white/10 rounded w-1/2"
                  />
                </div>
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="h-3 bg-white/10 rounded w-16"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <h4 className="font-header text-sm text-primary uppercase tracking-wider">
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
  );
}
