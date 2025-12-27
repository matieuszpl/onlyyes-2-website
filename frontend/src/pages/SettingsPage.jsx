import ThemeSwitcher from "../components/ThemeSwitcher";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import api from "../api";

export default function SettingsPage() {
  const { volume, setVolume, triggerGlitch } = useGlobalAudio();
  const { user, login, logout, refreshUser } = useUser();
  const [testGlitch, setTestGlitch] = useState(false);
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

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Skonfiguruj swoje doświadczenie" />

      <Card padding="p-6" className="space-y-6">
        <div>
          <h2 className="font-header text-xl text-primary mb-4">MOTYW</h2>
          <ThemeSwitcher />
        </div>

        <div>
          <h2 className="font-header text-xl text-primary mb-4">DŹWIĘK</h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-text-secondary w-20">GŁOŚNOŚĆ</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/10 accent-primary"
            />
            <span className="font-mono text-sm text-text-secondary w-16">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        <div>
          <h2 className="font-header text-xl text-primary mb-4">PRYWATNOŚĆ</h2>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-text-primary mb-1">
                    UKRYJ AKTYWNOŚĆ W RANKINGU
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
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
                  <div className="font-mono text-sm text-text-primary mb-1">
                    UKRYJ W HISTORII AKTYWNOŚCI
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
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
          ) : null}
        </div>

        <div>
          <h2 className="font-header text-xl text-primary mb-4">KONTO</h2>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 border border-primary"
                  />
                )}
                <div>
                  <div className="font-mono text-sm text-text-primary">{user.username}</div>
                  <div className="font-mono text-xs text-text-secondary">
                    {user.is_admin ? "ADMIN" : "UŻYTKOWNIK"}
                  </div>
                </div>
              </div>
              {user.is_admin && (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      triggerGlitch();
                      setTestGlitch(true);
                      setTimeout(() => setTestGlitch(false), 400);
                    }}
                    variant="magenta"
                    size="md"
                    className="bg-accent-magenta text-white"
                  >
                    TESTUJ ANIMACJĘ GLITCH
                  </Button>
                </div>
              )}
              <Button
                onClick={logout}
                variant="default"
                size="md"
                className="bg-secondary text-white"
              >
                WYLOGUJ
              </Button>
            </div>
          ) : (
            <Button
              onClick={login}
              variant="primary"
              size="md"
              className="bg-primary text-black"
            >
              ZALOGUJ PRZEZ DISCORD
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

