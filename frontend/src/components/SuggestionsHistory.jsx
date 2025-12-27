import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import Card from "./Card";
import { motion } from "framer-motion";
import { Loader2, Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";

export default function SuggestionsHistory() {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await api.get("/suggestions");
        setSuggestions(res.data || []);
      } catch (error) {
        console.error("Load suggestions error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Hourglass className="w-3 h-3 text-yellow-400" />;
      case "APPROVED":
        return <CheckCircle2 className="w-3 h-3 text-green-400" />;
      case "REJECTED":
        return <XCircle className="w-3 h-3 text-red-400" />;
      case "PROCESSED":
        return <CheckCircle2 className="w-3 h-3 text-primary" />;
      default:
        return <Clock className="w-3 h-3 text-text-secondary" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "OCZEKUJE";
      case "APPROVED":
        return "ZAAKCEPTOWANA";
      case "REJECTED":
        return "ODRZUCONA";
      case "PROCESSED":
        return "PRZETWORZONA";
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "teraz";
      if (diffMins < 60) return `${diffMins} min temu`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "godz" : "godz"} temu`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "dzień" : "dni"} temu`;
      
      return date.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  if (!user) {
    return (
      <Card className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📋</span>
          <h3 className="font-header text-sm text-primary uppercase tracking-wider">
            HISTORIA PROPOZYCJI
          </h3>
        </div>
        <p className="font-mono text-xs text-text-secondary">
          ZALOGUJ SIĘ, ABY ZOBACZYĆ HISTORIĘ
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 relative">
      <div className="flex items-center gap-2">
        <span className="text-lg">📋</span>
        <h3 className="font-header text-sm text-primary uppercase tracking-wider">
          HISTORIA PROPOZYCJI
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="w-12 h-12 bg-white/10 border border-white/20 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.1,
                      }}
                      className="h-3 bg-white/20 rounded w-3/4"
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
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="font-mono text-xs text-text-secondary text-center py-4">
          BRAK PROPOZYCJI
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card className="p-2">
                <div className="flex items-start gap-3">
                  {suggestion.thumbnail_url && (
                    <img
                      src={suggestion.thumbnail_url}
                      alt={suggestion.title}
                      className="w-12 h-12 border border-white/10 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-header text-xs text-text-primary truncate mb-0.5">
                      {suggestion.title || "Bez tytułu"}
                    </div>
                    <div className="font-mono text-[10px] text-text-secondary truncate mb-1">
                      {suggestion.artist || "Nieznany artysta"}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(suggestion.status)}
                        <span className={`font-mono text-[9px] ${
                          suggestion.status === "APPROVED" || suggestion.status === "PROCESSED"
                            ? "text-green-400"
                            : suggestion.status === "REJECTED"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}>
                          {getStatusLabel(suggestion.status)}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-text-secondary">
                        • {formatDate(suggestion.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}

