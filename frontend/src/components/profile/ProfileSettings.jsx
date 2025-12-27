import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../ToastContainer";
import { Settings, LogOut, Volume2, Shield, User, X, Trash2 } from "lucide-react";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../Card";
import Button from "../Button";
import api from "../../api";

export default function ProfileSettings() {
  const { user, login, logout, refreshUser } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { volume, setVolume } = useGlobalAudio();
  const [hideActivity, setHideActivity] = useState(false);
  const [hideActivityHistory, setHideActivityHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setHideActivity(user.hide_activity || false);
      setHideActivityHistory(user.hide_activity_history || false);
    }
  }, [user]);

  const handleHideActivityChange = async (value) => {
    if (!user) return;
    setSaving(true);
    try {
      await api.put("/users/me/settings", { hide_activity: value });
      setHideActivity(value);
      await refreshUser();
    } catch (error) {
      console.error("Update settings error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleHideActivityHistoryChange = async (value) => {
    if (!user) return;
    setSaving(true);
    try {
      await api.put("/users/me/settings", { hide_activity_history: value });
      setHideActivityHistory(value);
      await refreshUser();
    } catch (error) {
      console.error("Update settings error:", error);
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
            <Volume2 size={20} className="text-white/60" />
            <h3 className="text-lg font-light text-white">DOMYŚLNY POZIOM GŁOŚNOŚCI</h3>
          </div>
          <div className="font-mono text-[10px] text-text-secondary mb-3">
            Poziom głośności odtwarzacza radia przy każdym załadowaniu strony
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-secondary w-20">GŁOŚNOŚĆ</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/10 accent-primary"
            />
            <span className="font-mono text-xs text-text-secondary w-16">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-3">
            <Shield size={20} className="text-white/60" />
            <h3 className="text-lg font-light text-white">PRYWATNOŚĆ</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-text-primary mb-1">
                  UKRYJ AKTYWNOŚĆ W RANKINGU
                </div>
                <div className="font-mono text-[10px] text-text-secondary">
                  Twoja aktywność nie będzie widoczna na stronie rankingu
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideActivity}
                  onChange={(e) => handleHideActivityChange(e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-text-primary mb-1">
                  UKRYJ W HISTORII AKTYWNOŚCI
                </div>
                <div className="font-mono text-[10px] text-text-secondary">
                  Twoja aktywność nie będzie widoczna w historii na stronie głównej
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideActivityHistory}
                  onChange={(e) => handleHideActivityHistoryChange(e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-3">
            <User size={20} className="text-white/60" />
            <h3 className="text-lg font-light text-white">KONTO</h3>
          </div>
          <div className="font-mono text-[10px] text-text-secondary mb-3">
            Zarządzaj kontem i wyloguj się
          </div>
          <div className="space-y-2">
            <Button
              onClick={logout}
              variant="default"
              size="md"
              fullWidth
              className="bg-secondary hover:bg-secondary/90 text-white border-secondary flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              WYLOGUJ
            </Button>
            <Button
              onClick={() => setShowDeleteAccount(true)}
              variant="red"
              size="md"
              fullWidth
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50 flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              USUŃ KONTO
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
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

