import ThemeSwitcher from "../components/ThemeSwitcher";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import api from "../api";

export default function SettingsPage() {
  const { volume, setVolume, triggerGlitch } = useGlobalAudio();
  const { user, login, logout, refreshUser } = useUser();
  const [searchParams] = useSearchParams();
  const [testGlitch, setTestGlitch] = useState(false);
  const [hideActivity, setHideActivity] = useState(false);
  const [hideActivityHistory, setHideActivityHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (user) {
      setHideActivity(user.hide_activity || false);
      setHideActivityHistory(user.hide_activity_history || false);
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

  const handleLoginGoogle = () => {
    window.location.href = "/api/auth/login/google";
  };

  return (
    <div className="space-y-6">
      <SectionHeader description="Skonfiguruj swoje doświadczenie" useRouteData size="large" />

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
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.display_name || user.username}
                    className="w-12 h-12 border border-primary rounded"
                  />
                )}
                <div className="flex-1">
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
                        className="w-full px-2 py-1 bg-white/10 border border-primary text-text-primary font-mono text-sm focus:outline-none focus:border-primary-alt"
                        autoFocus
                        maxLength={30}
                      />
                      {nameError && (
                        <div className="font-mono text-xs text-red-400">{nameError}</div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDisplayNameSave}
                          variant="primary"
                          size="sm"
                          disabled={saving}
                          className="bg-primary text-black"
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
                          className="bg-white/10 text-text-primary"
                        >
                          ANULUJ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-mono text-sm text-text-primary">
                        {user.display_name || user.username}
                      </div>
                      <div className="font-mono text-xs text-text-secondary">
                        {user.is_admin ? "ADMIN" : "UŻYTKOWNIK"}
                      </div>
                      <button
                        onClick={() => setEditingName(true)}
                        className="font-mono text-[10px] text-primary hover:text-primary-alt mt-1"
                      >
                        ZMIEŃ NAZWĘ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-mono text-sm text-text-primary mb-2">AVATAR</div>
                <div className="flex gap-2 flex-wrap">
                  {user.has_discord && (
                    <button
                      onClick={() => handleAvatarChange("DISCORD")}
                      disabled={saving || user.avatar_source === "DISCORD"}
                      className={`px-3 py-1.5 font-mono text-xs border ${
                        user.avatar_source === "DISCORD"
                          ? "bg-primary text-black border-primary"
                          : "bg-white/10 text-text-primary border-white/20 hover:bg-white/20"
                      } disabled:opacity-50`}
                    >
                      DISCORD
                    </button>
                  )}
                  {user.has_google && (
                    <button
                      onClick={() => handleAvatarChange("GOOGLE")}
                      disabled={saving || user.avatar_source === "GOOGLE"}
                      className={`px-3 py-1.5 font-mono text-xs border ${
                        user.avatar_source === "GOOGLE"
                          ? "bg-primary text-black border-primary"
                          : "bg-white/10 text-text-primary border-white/20 hover:bg-white/20"
                      } disabled:opacity-50`}
                    >
                      GOOGLE
                    </button>
                  )}
                  <button
                    onClick={() => handleAvatarChange("DEFAULT")}
                    disabled={saving || user.avatar_source === "DEFAULT"}
                    className={`px-3 py-1.5 font-mono text-xs border ${
                      user.avatar_source === "DEFAULT"
                        ? "bg-primary text-black border-primary"
                        : "bg-white/10 text-text-primary border-white/20 hover:bg-white/20"
                    } disabled:opacity-50`}
                  >
                    DOMYŚLNY
                  </button>
                </div>
              </div>

              <div>
                <div className="font-mono text-sm text-text-primary mb-2">POŁĄCZ KONTA</div>
                <div className="space-y-2">
                  {(!user.has_discord || user.has_discord === false) && (
                    <Button
                      onClick={handleConnectDiscord}
                      variant="default"
                      size="sm"
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full"
                    >
                      POŁĄCZ Z DISCORD
                    </Button>
                  )}
                  {(!user.has_google || user.has_google === false) && (
                    <Button
                      onClick={handleConnectGoogle}
                      variant="default"
                      size="sm"
                      className="bg-white hover:bg-gray-100 text-black w-full"
                    >
                      POŁĄCZ Z GOOGLE
                    </Button>
                  )}
                  {user.has_discord && user.has_google && (
                    <div className="font-mono text-xs text-text-secondary">
                      Wszystkie konta połączone
                    </div>
                  )}
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
            <div className="space-y-2">
              <Button
                onClick={login}
                variant="primary"
                size="md"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full"
              >
                ZALOGUJ PRZEZ DISCORD
              </Button>
              <Button
                onClick={handleLoginGoogle}
                variant="default"
                size="md"
                className="bg-white hover:bg-gray-100 text-black w-full"
              >
                ZALOGUJ PRZEZ GOOGLE
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

