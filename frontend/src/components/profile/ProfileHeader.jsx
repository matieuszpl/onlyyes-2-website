import { useUser } from "../../contexts/UserContext";
import { Trophy, History, Activity } from "lucide-react";
import { cn } from "../../utils/cn";

export default function ProfileHeader({ activeTab, onTabChange }) {
  const { user } = useUser();

  const tabs = [
    { id: "overview", label: "PRZEGLĄD", icon: Trophy },
    { id: "xp-history", label: "HISTORIA XP", icon: Trophy },
    { id: "activity", label: "AKTYWNOŚĆ", icon: Activity },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex items-center gap-4">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-16 h-16 border-2 border-primary rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-header text-base text-primary uppercase tracking-wider">
            {user.username}
          </h3>
          {user.rank && (
            <>
              <div className="font-mono text-xs text-text-secondary mb-2">
                {user.rank.name}
              </div>
              <div
                className="w-full rounded-full h-2 mb-1 overflow-hidden"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: "var(--accent-magenta)",
                    width: `${user.rank.progress}%`,
                    minWidth: user.rank.progress > 0 ? "2px" : "0",
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-accent font-semibold">
                  {user.xp || 0} / {user.rank.next_rank_xp || user.xp || 0} XP
                </span>
                {user.rank.next_rank && (
                  <span className="text-text-secondary/70">
                    {user.rank.next_rank_xp - (user.xp || 0)} do{" "}
                    <span className="text-primary">{user.rank.next_rank}</span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all border-b-2",
                isActive
                  ? "text-primary border-primary"
                  : "text-text-secondary border-transparent hover:text-primary"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
