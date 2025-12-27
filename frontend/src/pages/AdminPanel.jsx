import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import Card from "../components/Card";
import Button from "../components/Button";
import {
  Users,
  ThumbsUp,
  ThumbsDown,
  Radio,
  BarChart3,
  Shield,
  Music,
  Award,
  Bug,
  Lightbulb,
} from "lucide-react";
import SectionHeader from "../components/SectionHeader";
import UserTooltip from "../components/UserTooltip";
import { getIconComponent } from "../utils/badgeIcons";

export default function AdminPanel() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [issues, setIssues] = useState([]);
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
      } else if (activeTab === "issues") {
        const res = await api.get("/admin/issues");
        setIssues(res.data);
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

  const handleApproveIssue = async (id) => {
    try {
      await api.post(`/admin/issues/${id}/approve`);
      loadData();
    } catch (error) {
      console.error("Approve issue error:", error);
    }
  };

  const handleRejectIssue = async (id) => {
    try {
      await api.post(`/admin/issues/${id}/reject`);
      loadData();
    } catch (error) {
      console.error("Reject issue error:", error);
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
    { id: "issues", label: "ZGŁOSZENIA", icon: Bug },
    { id: "badges", label: "OSIĄGNIĘCIA", icon: Award },
    { id: "radio", label: "RADIO", icon: Radio },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="PANEL ADMINISTRATORA" useRouteData size="large" />

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
        <Card>
          <div className="space-y-2">
            {[...Array(5)].map((_, idx) => (
              <Card
                key={idx}
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                padding="p-4"
                className="flex items-center gap-3"
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
              </Card>
            ))}
          </div>
        </Card>
      ) : (
        <>
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              as={motion.div}
              className=""
            >
              <div className="mb-4 font-mono text-xs text-text-secondary">
                ŁĄCZNIE: {users.length} użytkowników
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((u) => (
                  <Card
                    key={u.id}
                    padding="p-4"
                    className="flex items-center gap-3"
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
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "votes" && (
            <Card
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className=""
            >
              <div className="mb-4 font-mono text-xs text-text-secondary">
                ŁĄCZNIE: {votes.length} głosów
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {votes.map((v) => (
                  <div
                    key={v.id}
                    padding="p-4"
                    className="flex items-center gap-3"
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
            </Card>
          )}

          {activeTab === "suggestions" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              as={motion.div}
              className=""
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
                    <Card key={suggestion.id}>
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
                          <Button
                            onClick={() => handleApprove(suggestion.id)}
                            variant="primary"
                            size="sm"
                            className="bg-primary text-black"
                          >
                            ZATWIERDŹ
                          </Button>
                          <Button
                            onClick={() => handleReject(suggestion.id)}
                            variant="default"
                            size="sm"
                            className="bg-secondary text-white"
                          >
                            ODRZUĆ
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "issues" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              as={motion.div}
              className=""
            >
              <div className="mb-4 font-mono text-xs text-text-secondary">
                ŁĄCZNIE: {issues.length} zgłoszeń
              </div>
              {issues.length === 0 ? (
                <p className="font-mono text-sm text-text-secondary">
                  BRAK ZGŁOSZEŃ
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {issues.map((issue) => (
                    <Card key={issue.id}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {issue.issue_type === "BUG" ? (
                              <Bug size={16} className="text-red-400" />
                            ) : (
                              <Lightbulb size={16} className="text-accent" />
                            )}
                            <div className="font-header text-sm text-text-primary">
                              {issue.title}
                            </div>
                          </div>
                          <div className="font-mono text-xs text-text-secondary mb-2 whitespace-pre-wrap">
                            {issue.description}
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[10px] text-text-secondary">
                            {issue.username ? (
                              <>
                                {issue.avatar_url && (
                                  <img
                                    src={issue.avatar_url}
                                    alt={issue.username}
                                    className="w-6 h-6 border border-primary/50 rounded"
                                  />
                                )}
                                <span>{issue.username}</span>
                              </>
                            ) : (
                              <span>Gość</span>
                            )}
                            <span>•</span>
                            <span>
                              {new Date(issue.created_at).toLocaleString(
                                "pl-PL"
                              )}
                            </span>
                            {issue.approved_at && (
                              <>
                                <span>•</span>
                                <span className="text-accent">
                                  Zaakceptowano:{" "}
                                  {new Date(issue.approved_at).toLocaleString(
                                    "pl-PL"
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 font-mono text-xs border shrink-0 ${
                            issue.status === "PENDING"
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                              : issue.status === "APPROVED"
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-secondary/20 border-secondary text-secondary"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>

                      {issue.status === "PENDING" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApproveIssue(issue.id)}
                            variant="primary"
                            size="sm"
                            className="bg-primary text-black"
                          >
                            ZATWIERDŹ
                          </Button>
                          <Button
                            onClick={() => handleRejectIssue(issue.id)}
                            variant="default"
                            size="sm"
                            className="bg-secondary text-white"
                          >
                            ODRZUĆ
                          </Button>
                        </div>
                      )}
                    </Card>
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
                <Button
                  onClick={() => setShowCreateBadge(!showCreateBadge)}
                  variant="primary"
                  size="sm"
                  className="bg-primary text-black"
                >
                  {showCreateBadge ? "ANULUJ" : "NOWE OSIĄGNIĘCIE"}
                </Button>
              </div>

              {showCreateBadge && (
                <Card className="space-y-3">
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
                  <Button
                    onClick={handleCreateBadge}
                    variant="primary"
                    size="sm"
                    className="bg-primary text-black"
                  >
                    UTWÓRZ
                  </Button>
                </Card>
              )}

              <Card>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {!badges || badges.length === 0 ? (
                    <div className="font-mono text-sm text-text-secondary text-center py-4">
                      BRAK OSIĄGNIĘĆ
                    </div>
                  ) : (
                    badges.map((badge) => (
                      <Card
                        key={badge.id}
                        padding="p-4"
                        className="flex items-center gap-3"
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
                        <Button
                          onClick={() => openAwardModal(badge)}
                          variant="primary"
                          size="sm"
                          className="bg-primary text-black whitespace-nowrap"
                        >
                          NADAJ
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </Card>

              {showAwardModal && selectedBadge && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  onClick={() => setShowAwardModal(false)}
                >
                  <Card
                    as={motion.div}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    padding="p-6"
                    className="max-w-md w-full mx-4"
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
                        <Card padding="p-4" className="flex items-center gap-3">
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
                        </Card>
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
                        <Button
                          onClick={handleAwardBadge}
                          disabled={!selectedUser}
                          variant="primary"
                          size="sm"
                          className="bg-primary text-black flex-1"
                        >
                          POTWIERDŹ
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAwardModal(false);
                            setSelectedBadge(null);
                            setSelectedUser(null);
                          }}
                          variant="default"
                          size="sm"
                        >
                          ANULUJ
                        </Button>
                      </div>
                    </div>
                  </Card>
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
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-primary" />
                  <h2 className="font-header text-sm text-primary uppercase tracking-wider">
                    STATYSTYKI
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Card padding="p-4">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      UŻYTKOWNICY
                    </div>
                    <div className="font-mono text-lg text-primary">
                      {radioInfo.statistics.total_users}
                    </div>
                  </Card>
                  <Card padding="p-4">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      GŁOSY
                    </div>
                    <div className="font-mono text-lg text-primary">
                      {radioInfo.statistics.total_votes}
                    </div>
                  </Card>
                  <Card padding="p-4">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      PROPOZYCJE
                    </div>
                    <div className="font-mono text-lg text-primary">
                      {radioInfo.statistics.total_suggestions}
                    </div>
                  </Card>
                  <Card padding="p-4">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      POLUBIENIA
                    </div>
                    <div className="font-mono text-lg text-accent-cyan">
                      {radioInfo.statistics.total_likes}
                    </div>
                  </Card>
                  <Card padding="p-4">
                    <div className="font-mono text-[10px] text-text-secondary mb-1">
                      NIE POLUBIENIA
                    </div>
                    <div className="font-mono text-lg text-accent-magenta">
                      {radioInfo.statistics.total_dislikes}
                    </div>
                  </Card>
                </div>
              </Card>

              {radioInfo.statistics.active_listeners && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-primary" />
                    <h2 className="font-header text-sm text-primary uppercase tracking-wider">
                      AKTYWNI SŁUCHACZE
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card padding="p-4">
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
                    </Card>
                    <Card padding="p-4">
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
                    </Card>
                  </div>
                </Card>
              )}

              {radioInfo.station && (
                <Card>
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
                </Card>
              )}

              {radioInfo.now_playing && (
                <Card>
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
                </Card>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
