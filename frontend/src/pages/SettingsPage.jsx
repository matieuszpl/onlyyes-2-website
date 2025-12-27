import ThemeSwitcher from "../components/ThemeSwitcher";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import { useUser } from "../contexts/UserContext";
import { useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";

export default function SettingsPage() {
  const { volume, setVolume, triggerGlitch } = useGlobalAudio();
  const { user, login, logout } = useUser();
  const [testGlitch, setTestGlitch] = useState(false);

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

