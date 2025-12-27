import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../ToastContainer";
import { User, Image, Link as LinkIcon, X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../Card";
import Button from "../Button";
import DiscordLogo from "../auth/DiscordLogo";
import GoogleLogo from "../auth/GoogleLogo";
import api from "../../api";

export default function ProfileAccountSettings() {
  const { user, refreshUser, logout } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showDisconnectDiscord, setShowDisconnectDiscord] = useState(false);
  const [showDisconnectGoogle, setShowDisconnectGoogle] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.username || "");
    }
  }, [user]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected) {
      refreshUser();
      searchParams.delete("connected");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refreshUser]);

  const handleDisplayNameSave = async () => {
    if (!user) return;
    setNameError("");
    setSaving(true);
    try {
      await api.put("/users/me/display-name", { display_name: displayName });
      setEditingName(false);
      await refreshUser();
    } catch (error) {
      if (error.response?.data?.detail) {
        setNameError(error.response.data.detail);
      } else {
        setNameError("Błąd podczas zapisywania nazwy");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (source) => {
    if (!user) return;
    setSaving(true);
    try {
      await api.put("/users/me/avatar", { avatar_source: source });
      await refreshUser();
    } catch (error) {
      console.error("Update avatar error:", error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConnectDiscord = () => {
    window.location.href = "/api/auth/connect/discord";
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/connect/google";
  };

  const handleDisconnectDiscord = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.delete("/users/me/disconnect/discord");
      showToast("Konto Discord zostało odłączone", "success");
      await refreshUser();
      setShowDisconnectDiscord(false);
    } catch (error) {
      if (error.response?.data?.detail) {
        showToast(error.response.data.detail, "error");
      } else {
        showToast("Błąd podczas odłączania konta Discord", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.delete("/users/me/disconnect/google");
      showToast("Konto Google zostało odłączone", "success");
      await refreshUser();
      setShowDisconnectGoogle(false);
    } catch (error) {
      if (error.response?.data?.detail) {
        showToast(error.response.data.detail, "error");
      } else {
        showToast("Błąd podczas odłączania konta Google", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.delete("/users/me");
      showToast("Konto zostało usunięte", "success");
      logout();
      navigate("/");
      setShowDeleteAccount(false);
    } catch (error) {
      if (error.response?.data?.detail) {
        showToast(error.response.data.detail, "error");
      } else {
        showToast("Błąd podczas usuwania konta", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="space-y-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-3">
            <User size={20} className="text-white/60" />
            <h3 className="text-lg font-light text-white">WYŚWIETLANA NAZWA</h3>
          </div>
          <div className="font-mono text-[10px] text-text-secondary mb-3">
            Nazwa wyświetlana innym użytkownikom na stronie
          </div>
          {editingName ? (
            <div className="space-y-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setNameError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDisplayNameSave();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setDisplayName(user.display_name || user.username || "");
                    setNameError("");
                  }
                }}
                className="w-full px-3 py-2 bg-white/10 border border-primary text-text-primary font-mono text-sm focus:outline-none focus:border-primary-alt"
                autoFocus
                maxLength={30}
              />
              {nameError && (
                <div className="font-mono text-xs text-red-400">{nameError}</div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleDisplayNameSave}
                  disabled={saving}
                  variant="primary"
                  size="sm"
                >
                  ZAPISZ
                </Button>
                <Button
                  onClick={() => {
                    setEditingName(false);
                    setDisplayName(user.display_name || user.username || "");
                    setNameError("");
                  }}
                  variant="default"
                  size="sm"
                >
                  ANULUJ
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-sm text-text-primary">
                  {user.display_name || user.username}
                </div>
                <div className="font-mono text-[10px] text-text-secondary mt-1">
                  3-30 znaków, tylko litery, cyfry, _, - i .
                </div>
              </div>
              <Button
                onClick={() => setEditingName(true)}
                variant="default"
                size="sm"
              >
                ZMIEŃ
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-3">
            <Image size={20} className="text-white/60" />
            <h3 className="text-lg font-light text-white">AVATAR</h3>
          </div>
          <div className="font-mono text-[10px] text-text-secondary mb-3">
            Wybierz avatar z której platformy będzie pokazywany innym użytkownikom
          </div>
          <div className="flex gap-2 flex-wrap">
            {user.has_discord && (
              <button
                onClick={() => handleAvatarChange("DISCORD")}
                disabled={saving || user.avatar_source === "DISCORD"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all ${
                  user.avatar_source === "DISCORD"
                    ? "bg-[#5865F2] text-white border border-[#5865F2]"
                    : "bg-white/10 text-text-primary border border-white/20 hover:bg-white/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <DiscordLogo size={16} className="text-white shrink-0" />
                <span className="font-mono text-xs">DISCORD</span>
              </button>
            )}
            {user.has_google && (
              <button
                onClick={() => handleAvatarChange("GOOGLE")}
                disabled={saving || user.avatar_source === "GOOGLE"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all ${
                  user.avatar_source === "GOOGLE"
                    ? "bg-white text-gray-700 border border-gray-300"
                    : "bg-white/10 text-text-primary border border-white/20 hover:bg-white/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <GoogleLogo size={16} className="shrink-0" />
                <span className="font-mono text-xs">GOOGLE</span>
              </button>
            )}
            <Button
              onClick={() => handleAvatarChange("DEFAULT")}
              disabled={saving || user.avatar_source === "DEFAULT"}
              variant={user.avatar_source === "DEFAULT" ? "primary" : "default"}
              size="sm"
            >
              DOMYŚLNY
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-3">
            <LinkIcon size={20} className="text-white/60" />
            <h3 className="text-lg font-light text-white">POŁĄCZ KONTA</h3>
          </div>
          <div className="font-mono text-[10px] text-text-secondary mb-3">
            Połącz swoje konta Discord i Google, aby logować się przez dowolny z nich
          </div>
          <div className="space-y-3">
            {user.has_discord && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-sm">
                <div className="flex items-center gap-2">
                  <DiscordLogo size={16} className="text-white shrink-0" />
                  <span className="font-mono text-xs text-text-primary">
                    Połączono z kontem Discord: {user.discord_username || user.username}
                  </span>
                </div>
                {user.has_google && (
                  <button
                    onClick={() => setShowDisconnectDiscord(true)}
                    disabled={saving}
                    className="px-2 py-1 font-mono text-[10px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 bg-red-400/10 hover:bg-red-400/20 rounded-sm transition-colors disabled:opacity-50"
                  >
                    ODŁĄCZ
                  </button>
                )}
              </div>
            )}
            {user.has_google && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-sm">
                <div className="flex items-center gap-2">
                  <GoogleLogo size={16} className="shrink-0" />
                  <span className="font-mono text-xs text-text-primary">
                    Połączono z kontem Google: {user.google_username || user.username}
                  </span>
                </div>
                {user.has_discord && (
                  <button
                    onClick={() => setShowDisconnectGoogle(true)}
                    disabled={saving}
                    className="px-2 py-1 font-mono text-[10px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 bg-red-400/10 hover:bg-red-400/20 rounded-sm transition-colors disabled:opacity-50"
                  >
                    ODŁĄCZ
                  </button>
                )}
              </div>
            )}
            {(!user.has_discord || user.has_discord === false) && (
              <button
                onClick={handleConnectDiscord}
                className="w-full flex items-center gap-3 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <DiscordLogo size={18} className="text-white shrink-0" />
                <span className="font-sans text-sm font-medium flex-1 text-left">
                  Połącz z Discord
                </span>
              </button>
            )}
            {(!user.has_google || user.has_google === false) && (
              <button
                onClick={handleConnectGoogle}
                className="w-full flex items-center gap-3 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-sm border border-gray-300 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <GoogleLogo size={18} className="shrink-0" />
                <span className="font-sans text-sm font-medium flex-1 text-left">
                  Połącz z Google
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDisconnectDiscord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDisconnectDiscord(false)}
          >
            <Card
              as={motion.div}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-header text-sm text-primary uppercase tracking-wider">
                  ODŁĄCZ KONTO DISCORD
                </h3>
                <button
                  onClick={() => setShowDisconnectDiscord(false)}
                  className="text-text-secondary hover:text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="font-mono text-xs text-text-secondary mb-4">
                Czy na pewno chcesz odłączyć konto Discord? Będziesz mógł je ponownie połączyć później.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDisconnectDiscord}
                  disabled={saving}
                  variant="red"
                  size="sm"
                  className="flex-1"
                >
                  ODŁĄCZ
                </Button>
                <Button
                  onClick={() => setShowDisconnectDiscord(false)}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  ANULUJ
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {showDisconnectGoogle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDisconnectGoogle(false)}
          >
            <Card
              as={motion.div}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-header text-sm text-primary uppercase tracking-wider">
                  ODŁĄCZ KONTO GOOGLE
                </h3>
                <button
                  onClick={() => setShowDisconnectGoogle(false)}
                  className="text-text-secondary hover:text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="font-mono text-xs text-text-secondary mb-4">
                Czy na pewno chcesz odłączyć konto Google? Będziesz mógł je ponownie połączyć później.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDisconnectGoogle}
                  disabled={saving}
                  variant="red"
                  size="sm"
                  className="flex-1"
                >
                  ODŁĄCZ
                </Button>
                <Button
                  onClick={() => setShowDisconnectGoogle(false)}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  ANULUJ
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {showDeleteAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteAccount(false)}
          >
            <Card
              as={motion.div}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-header text-sm text-red-400 uppercase tracking-wider">
                  USUŃ KONTO
                </h3>
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="text-text-secondary hover:text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="font-mono text-xs text-text-secondary mb-2">
                Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna.
              </p>
              <p className="font-mono text-[10px] text-red-400 mb-4">
                Wszystkie Twoje dane, osiągnięcia, głosy i aktywność zostaną trwale usunięte.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  variant="red"
                  size="sm"
                  className="flex-1"
                >
                  USUŃ KONTO
                </Button>
                <Button
                  onClick={() => setShowDeleteAccount(false)}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  ANULUJ
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

