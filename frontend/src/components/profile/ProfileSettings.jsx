import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { Settings, LogOut, Volume2, Shield, User } from "lucide-react";
import { useGlobalAudio } from "../../contexts/GlobalAudioContext";
import Card from "../Card";
import Button from "../Button";
import api from "../../api";

export default function ProfileSettings() {
  const { user, login, logout, refreshUser } = useUser();
  const { volume, setVolume } = useGlobalAudio();
  const [hideActivity, setHideActivity] = useState(false);
  const [hideActivityHistory, setHideActivityHistory] = useState(false);
  const [saving, setSaving] = useState(false);

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

  if (!user) {
    return null;
  }

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings size={20} className="text-primary" />
        <h2 className="font-header text-lg text-primary uppercase tracking-wider">
          USTAWIENIA
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Volume2 size={16} className="text-primary" />
            <h3 className="font-mono text-sm text-text-primary">DOMYŚLNY POZIOM GŁOŚNOŚCI</h3>
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
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <h3 className="font-mono text-sm text-text-primary">PRYWATNOŚĆ</h3>
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
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-primary" />
            <h3 className="font-mono text-sm text-text-primary">KONTO</h3>
          </div>
          <Button
            onClick={logout}
            variant="default"
            size="md"
            className="bg-secondary text-white w-full flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            WYLOGUJ
          </Button>
        </div>
      </div>
    </Card>
  );
}

