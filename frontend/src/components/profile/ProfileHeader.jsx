import { useUser } from "../../contexts/UserContext";
import { Trophy, History, Activity, Award, TrendingUp, UserPlus } from "lucide-react";
import { cn } from "../../utils/cn";
import { getIconComponent } from "../../utils/badgeIcons";

export default function ProfileHeader({ activeTab, onTabChange }) {
  const { user } = useUser();

  const tabs = [
    { id: "overview", label: "PRZEGLĄD", icon: Trophy },
    { id: "badges", label: "OSIĄGNIĘCIA", icon: Award },
    { id: "xp-history", label: "HISTORIA XP", icon: History },
    { id: "activity", label: "AKTYWNOŚĆ", icon: Activity },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="relative overflow-hidden -mx-4 -mt-4">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: user.featured_badge?.color
              ? `linear-gradient(135deg, ${user.featured_badge.color}15 0%, transparent 100%)`
              : "linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, transparent 100%)",
          }}
        />
        <div className="relative p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-16 h-16 border-2 rounded-full object-cover shadow-lg"
                  style={{
                    borderColor:
                      user.featured_badge?.color || "var(--primary)",
                  }}
                />
              ) : (
                <div
                  className="w-16 h-16 border-2 rounded-full bg-white/5 flex items-center justify-center shadow-lg"
                  style={{
                    borderColor:
                      user.featured_badge?.color || "var(--primary)",
                  }}
                >
                  <UserPlus size={24} className="text-text-secondary" />
                </div>
              )}
              {user.featured_badge && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor:
                      user.featured_badge.color || "var(--primary)",
                  }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(
                      user.featured_badge.icon
                    );
                    return (
                      <IconComponent
                        size={12}
                        className="text-black"
                        strokeWidth={2.5}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="font-header text-base text-primary font-bold truncate mb-1">
                {user.username}
              </div>
              {user.rank && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-mono text-xs text-primary bg-primary/20 px-2 py-0.5 rounded border border-primary/30">
                    {user.rank.name}
                  </div>
                </div>
              )}
              {user.featured_badge && (
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="p-1 rounded border"
                    style={{
                      backgroundColor: `${user.featured_badge.color}20`,
                      borderColor: `${user.featured_badge.color}50`,
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(
                        user.featured_badge.icon
                      );
                      return (
                        <IconComponent
                          size={12}
                          style={{
                            color: user.featured_badge.color || "#ffffff",
                          }}
                        />
                      );
                    })()}
                  </div>
                  <span className="font-mono text-[10px] text-text-secondary truncate">
                    {user.featured_badge.name}
                  </span>
                </div>
              )}
              {user.rank && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-accent-cyan" />
                      <span className="font-mono text-xs text-accent-cyan font-bold">
                        {user.xp || 0} XP
                      </span>
                    </div>
                    {user.rank.next_rank && (
                      <span className="font-mono text-[9px] text-text-secondary">
                        {user.rank.next_rank_xp - (user.xp || 0)} do{" "}
                        {user.rank.next_rank}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(to right, var(--primary), var(--accent-cyan))",
                        width: `${user.rank.progress || 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
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
