import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import {
  Users,
  ThumbsUp,
  ThumbsDown,
  Radio,
  BarChart3,
  Shield,
  Music,
  Award,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import UserTooltip from "../components/UserTooltip";
import { getIconComponent } from "../utils/badgeIcons";

export default function AdminPanel() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [radioInfo, setRadioInfo] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#ffffff",
    xp_reward: 0,
  });

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate("/");
      return;
    }
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await api.get("/admin/users");
        setUsers(res.data);
      } else if (activeTab === "votes") {
        const res = await api.get("/admin/votes");
        setVotes(res.data);
      } else if (activeTab === "suggestions") {
        const res = await api.get("/suggestions");
        setSuggestions(res.data);
      } else if (activeTab === "radio") {
        const res = await api.get("/admin/radio-info");
        setRadioInfo(res.data);
      } else if (activeTab === "badges") {
        try {
          const res = await api.get("/badges");
          setBadges(res.data || []);
        } catch (error) {
          console.error("Error loading badges:", error);
          setBadges([]);
        }
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.is_admin) {
    return null;
  }

  const handleApprove = async (id) => {
    try {
      await api.post(`/suggestions/${id}/approve`);
      loadData();
    } catch (error) {
      console.error("Approve error:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/suggestions/${id}/reject`);
      loadData();
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  const handleCreateBadge = async () => {
    try {
      await api.post("/admin/badges", newBadge);
      setShowCreateBadge(false);
      setNewBadge({
        name: "",
        description: "",
        icon: "",
        color: "#ffffff",
        xp_reward: 0,
      });
      loadData();
    } catch (error) {
      console.error("Create badge error:", error);
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedUser) return;
    try {
      await api.post("/admin/badges/award", {
        badge_id: selectedBadge.id,
        user_id: selectedUser.id,
      });
      setShowAwardModal(false);
      setSelectedBadge(null);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Błąd podczas nadawania osiągnięcia";
      console.error("Award badge error:", errorMessage, error);
      alert(errorMessage);
    }
  };

  const openAwardModal = (badge) => {
    setSelectedBadge(badge);
    setSelectedUser(null);
    setShowAwardModal(true);
  };

  const tabs = [
    { id: "users", label: "UŻYTKOWNICY", icon: Users },
    { id: "votes", label: "GŁOSY", icon: ThumbsUp },
    { id: "suggestions", label: "PROPOZYCJE", icon: Music },
    { id: "badges", label: "OSIĄGNIĘCIA", icon: Award },
    { id: "radio", label: "RADIO", icon: Radio },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="PANEL ADMINISTRATORA" />

      <div className="flex gap-2 border-b border-white/10 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all border-b-2 ${
                isActive
                  ? "text-primary border-primary"
                  : "text-text-secondary border-transparent hover:text-primary"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass-panel p-4">
          <div className="space-y-2">
            {[...Array(5)].map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm"
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="w-10 h-10 bg-white/10 rounded"
                />
                <div className="flex-1 space-y-2">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-4 bg-white/20 rounded w-32"
                  />
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.15,
                    }}
                    className="h-3 bg-white/10 rounded w-48"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel p-4"
            >
              <div className="mb-4 font-mono text-xs text-text-secondary">
                ŁĄCZNIE: {users.length} użytkowników
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm hover:border-primary/50 transition-all"
                  >
                    {u.avatar_url && (
                      <img
                        src={u.avatar_url}
                        alt={u.username}
                        className="w-10 h-10 border border-primary/50 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UserTooltip userId={u.id} username={u.username}>
                          <div className="font-mono text-sm text-text-primary truncate">
                            {u.username}
                          </div>
                        </UserTooltip>
                        {u.is_admin && (
                          <span className="font-mono text-[10px] text-primary bg-primary/20 px-2 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-text-secondary space-x-3">
                        <span>ID: {u.id}</span>
                        <span>Reputacja: {u.reputation_score}</span>
                        <span>Głosy: {u.votes_count}</span>
                        <span>Propozycje: {u.suggestions_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "votes" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel p-4"
            >
              <div className="mb-4 font-mono text-xs text-text-secondary">
                ŁĄCZNIE: {votes.length} głosów
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {votes.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm hover:border-primary/50 transition-all"
                  >
                    {v.avatar_url && (
                      <img
                        src={v.avatar_url}
                        alt={v.username}
                        className="w-10 h-10 border border-primary/50 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UserTooltip userId={v.user_id} username={v.username}>
                          <div className="font-mono text-sm text-text-primary truncate">
                            {v.username}
                          </div>
                        </UserTooltip>
                        {v.vote_type === "LIKE" ? (
                          <ThumbsUp size={14} className="text-accent-cyan" />
                        ) : (
                          <ThumbsDown
                            size={14}
                            className="text-accent-magenta"
                          />
                        )}
                      </div>
                      <div className="font-mono text-xs text-text-secondary truncate">
                        {v.song_title} - {v.song_artist}
                      </div>
                      <div className="font-mono text-[10px] text-text-secondary mt-1">
                        {new Date(v.created_at).toLocaleString("pl-PL")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "suggestions" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel p-4"
            >
              <div className="mb-4 font-mono text-xs text-text-secondary">
                ŁĄCZNIE: {suggestions.length} propozycji
              </div>
              {suggestions.length === 0 ? (
                <p className="font-mono text-sm text-text-secondary">
                  BRAK PROPOZYCJI
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="bg-white/5 border border-white/10 p-4 hover:border-primary/50 transition-all rounded-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-header text-sm text-text-primary mb-1">
                            {suggestion.title || "Brak tytułu"}
                          </div>
                          <div className="font-mono text-xs text-text-secondary mb-1">
                            {suggestion.artist || "Brak artysty"}
                          </div>
                          <div className="font-mono text-xs text-text-secondary">
                            {suggestion.source_type} • {suggestion.raw_input}
                          </div>
                          <div className="font-mono text-[10px] text-text-secondary mt-2">
                            {new Date(suggestion.created_at).toLocaleString(
                              "pl-PL"
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 font-mono text-xs border shrink-0 ${
                            suggestion.status === "PENDING"
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                              : suggestion.status === "APPROVED"
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-secondary/20 border-secondary text-secondary"
                          }`}
                        >
                          {suggestion.status}
                        </span>
                      </div>

                      {suggestion.status === "PENDING" && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleApprove(suggestion.id)}
                            className="btn-cut bg-primary text-black px-4 py-2 font-mono text-xs font-bold"
                          >
                            ZATWIERDŹ
                          </button>
                          <button
                            onClick={() => handleReject(suggestion.id)}
                            className="btn-cut bg-secondary text-white px-4 py-2 font-mono text-xs font-bold"
                          >
                            ODRZUĆ
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "badges" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="font-mono text-xs text-text-secondary">
                  ŁĄCZNIE: {badges.length} osiągnięć
                </div>
                <button
                  onClick={() => setShowCreateBadge(!showCreateBadge)}
                  className="btn-cut bg-primary text-black px-4 py-2 font-mono text-xs font-bold"
                >
                  {showCreateBadge ? "ANULUJ" : "NOWE OSIĄGNIĘCIE"}
                </button>
              </div>

              {showCreateBadge && (
                <div className="glass-panel p-4 space-y-3">
                  <h3 className="font-header text-sm text-primary uppercase tracking-wider">
                    NOWE OSIĄGNIĘCIE
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nazwa"
                      value={newBadge.name}
                      onChange={(e) =>
                        setNewBadge({ ...newBadge, name: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                    />
                    <textarea
                      placeholder="Opis"
                      value={newBadge.description}
                      onChange={(e) =>
                        setNewBadge({
                          ...newBadge,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                      rows={3}
                    />
                    <input
                      type="text"
                      placeholder="Ikona (emoji lub nazwa)"
                      value={newBadge.icon}
                      onChange={(e) =>
                        setNewBadge({ ...newBadge, icon: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                    />
                    <input
                      type="color"
                      value={newBadge.color}
                      onChange={(e) =>
                        setNewBadge({ ...newBadge, color: e.target.value })
                      }
                      className="w-full h-10 bg-white/5 border border-white/10"
                    />
                    <input
                      type="number"
                      placeholder="Nagroda XP"
                      value={newBadge.xp_reward}
                      onChange={(e) =>
                        setNewBadge({
                          ...newBadge,
                          xp_reward: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={handleCreateBadge}
                    className="btn-cut bg-primary text-black px-4 py-2 font-mono text-xs font-bold"
                  >
                    UTWÓRZ
                  </button>
                </div>
              )}

              <div className="glass-panel p-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {!badges || badges.length === 0 ? (
                    <div className="font-mono text-sm text-text-secondary text-center py-4">
                      BRAK OSIĄGNIĘĆ
                    </div>
                  ) : (
                    badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm hover:border-primary/50 transition-all"
                      >
                        <div
                          className="flex items-center justify-center"
                          style={{ color: badge.color || "#ffffff" }}
                        >
                          {(() => {
                            const IconComponent = getIconComponent(badge.icon);
                            return <IconComponent size={32} />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-text-primary mb-1">
                            {badge.name}
                          </div>
                          {badge.description && (
                            <div className="font-mono text-[10px] text-text-secondary mb-1">
                              {badge.description}
                            </div>
                          )}
                          {badge.auto_award_type && (
                            <div className="font-mono text-[9px] text-primary">
                              AUTO: {badge.auto_award_type}
                            </div>
                          )}
                          {badge.xp_reward > 0 && (
                            <div className="font-mono text-[9px] text-accent-cyan">
                              +{badge.xp_reward} XP
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => openAwardModal(badge)}
                          className="btn-cut bg-primary text-black px-4 py-2 font-mono text-xs font-bold whitespace-nowrap"
                        >
                          NADAJ
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {showAwardModal && selectedBadge && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  onClick={() => setShowAwardModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="glass-panel p-6 max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
                      NADAJ OSIĄGNIĘCIE
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="font-mono text-xs text-text-secondary mb-2">
                          OSIĄGNIĘCIE:
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm">
                          <div
                            className="text-2xl"
                            style={{ color: selectedBadge.color || "#ffffff" }}
                          >
                            {selectedBadge.icon || "🏆"}
                          </div>
                          <div>
                            <div className="font-mono text-sm text-text-primary">
                              {selectedBadge.name}
                            </div>
                            {selectedBadge.description && (
                              <div className="font-mono text-[10px] text-text-secondary">
                                {selectedBadge.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-text-secondary mb-2">
                          UŻYTKOWNIK:
                        </div>
                        <select
                          value={selectedUser?.id || ""}
                          onChange={(e) => {
                            const userId = parseInt(e.target.value);
                            const user = users.find((u) => u.id === userId);
                            setSelectedUser(user || null);
                          }}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                        >
                          <option value="">Wybierz użytkownika...</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.username} (ID: {u.id})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAwardBadge}
                          disabled={!selectedUser}
                          className="btn-cut bg-primary text-black px-4 py-2 font-mono text-xs font-bold flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          POTWIERDŹ
                        </button>
                        <button
                          onClick={() => {
                            setShowAwardModal(false);
                            setSelectedBadge(null);
                            setSelectedUser(null);
                          }}
                          className="btn-cut bg-white/10 text-text-primary px-4 py-2 font-mono text-xs font-bold"
                        >
                          ANULUJ
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "radio" && radioInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-primary" />
                  <h2 className="font-header text-sm text-primary uppercase tracking-wider">
                    STATYSTYKI
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      UŻYTKOWNICY
                    </div>
                    <div className="font-mono text-lg text-primary">
                      {radioInfo.statistics.total_users}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      GŁOSY
                    </div>
                    <div className="font-mono text-lg text-primary">
                      {radioInfo.statistics.total_votes}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      PROPOZYCJE
                    </div>
                    <div className="font-mono text-lg text-primary">
                      {radioInfo.statistics.total_suggestions}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      POLUBIENIA
                    </div>
                    <div className="font-mono text-lg text-accent-cyan">
                      {radioInfo.statistics.total_likes}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      NIE POLUBIENIA
                    </div>
                    <div className="font-mono text-lg text-accent-magenta">
                      {radioInfo.statistics.total_dislikes}
                    </div>
                  </div>
                </div>
              </div>

              {radioInfo.statistics.active_listeners && (
                <div className="glass-panel p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-primary" />
                    <h2 className="font-header text-sm text-primary uppercase tracking-wider">
                      AKTYWNI SŁUCHACZE
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                      <div className="font-mono text-[10px] text-text-secondary mb-1">
                        NA STRONIE
                      </div>
                      <div className="font-mono text-lg text-primary">
                        {radioInfo.statistics.active_listeners.total}
                      </div>
                      <div className="font-mono text-[9px] text-text-secondary mt-1">
                        Użytkownicy:{" "}
                        {radioInfo.statistics.active_listeners.users.active}
                      </div>
                      <div className="font-mono text-[9px] text-text-secondary">
                        Goście:{" "}
                        {radioInfo.statistics.active_listeners.guests.active}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                      <div className="font-mono text-[10px] text-text-secondary mb-1">
                        ODTWARZAJĄ
                      </div>
                      <div className="font-mono text-lg text-accent-cyan">
                        {radioInfo.statistics.active_listeners.playing}
                      </div>
                      <div className="font-mono text-[9px] text-text-secondary mt-1">
                        Użytkownicy:{" "}
                        {radioInfo.statistics.active_listeners.users.playing}
                      </div>
                      <div className="font-mono text-[9px] text-text-secondary">
                        Goście:{" "}
                        {radioInfo.statistics.active_listeners.guests.playing}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {radioInfo.station && (
                <div className="glass-panel p-4">
                  <h2 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
                    INFORMACJE O STACJI
                  </h2>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        Słuchacze online:
                      </span>
                      <span className="text-text-primary">
                        {radioInfo.station.listeners_online || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        Utwory w bazie:
                      </span>
                      <span className="text-text-primary">
                        {radioInfo.station.songs_in_database || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        Odtworzone dziś:
                      </span>
                      <span className="text-text-primary">
                        {radioInfo.station.songs_played_today || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {radioInfo.now_playing && (
                <div className="glass-panel p-4">
                  <h2 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
                    TERAZ GRANE
                  </h2>
                  <div className="font-mono text-sm">
                    <div className="text-text-primary mb-1">
                      {radioInfo.now_playing.title || "Unknown"}
                    </div>
                    <div className="text-text-secondary text-xs">
                      {radioInfo.now_playing.artist || "Unknown"}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
