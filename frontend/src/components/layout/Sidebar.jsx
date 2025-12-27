import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Music,
  TrendingUp,
  TrendingDown,
  User,
  Settings,
  LogOut,
  Calendar,
  Monitor,
  LogIn,
  Shield,
  X,
  Trophy,
  GitBranch,
  Award,
  UserPlus,
  TrendingUp as TrendingUpIcon,
  Star,
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { cn } from "../../utils/cn";
import ThemeDropdown from "../ThemeDropdown";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { getIconComponent } from "../../utils/badgeIcons";
import TextGlitch from "../TextGlitch";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, login, refreshUser } = useUser();
  const [xpNotification, setXpNotification] = useState(null);
  const prevXpRef = useRef(user?.xp || 0);

  const navItems = [
    { path: "/", icon: Home, label: "GŁÓWNA" },
    { path: "/charts", icon: TrendingUp, label: "LISTA PRZEBOJÓW" },
    { path: "/worst-charts", icon: TrendingDown, label: "LISTA GNIOTÓW" },
    { path: "/requests", icon: Music, label: "PROPOZYCJE" },
    { path: "/schedule", icon: Calendar, label: "KALENDARZ" },
    { path: "/leaderboard", icon: Trophy, label: "RANKING" },
    { path: "/badges", icon: Award, label: "OSIĄGNIĘCIA" },
    { path: "/changelog", icon: GitBranch, label: "CHANGELOG" },
  ];

  if (user) {
    navItems.push({ path: "/profile", icon: User, label: "PROFIL" });
    if (user.is_admin) {
      navItems.push({ path: "/admin", icon: Shield, label: "ADMIN" });
    }
  }

  const handleKioskMode = () => {
    navigate("/?mode=kiosk");
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const handleLogin = () => {
    login();
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  useEffect(() => {
    if (!user) return;

    const currentXp = user.xp || 0;
    const prevXp = prevXpRef.current;

    if (currentXp > prevXp) {
      const xpGained = currentXp - prevXp;
      let message = "";

      if (xpGained === 10) {
        message = "polubiono utwór";
      } else if (xpGained >= 1 && xpGained < 10) {
        message = "czas słuchania";
      }

      setXpNotification({ xp: xpGained, message });
      setTimeout(() => setXpNotification(null), 3000);
    }

    prevXpRef.current = currentXp;
  }, [user?.xp]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshUser();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, refreshUser]);

  const sidebarContent = (
    <>
      <div className="p-3 border-b border-white/5">
        {onClose && (
          <div className="flex justify-end mb-2 md:hidden">
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          {location.pathname !== "/" && (
            <motion.div
              key="only-yes-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center mb-4"
            >
              <div className="font-brand text-xl md:text-3xl text-primary tracking-wider p-4">
                <TextGlitch
                  text="ONLY YES"
                  altTexts={[
                    "ONLY YES",
                    "0NLY Y3S",
                    "0NL¥ ¥3$",
                    "0N1Y Y35",
                    "#+:|* {&><@$?",
                  ]}
                  className="font-brand"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {user ? (
          <div
            className={`relative overflow-hidden -mx-3 -my-3 border-b ${
              location.pathname !== "/" ? "border-t" : ""
            }`}
            style={{
              borderColor: user.featured_badge?.color
                ? `${user.featured_badge.color}60`
                : "rgba(255, 255, 255, 0.05)",
              background: user.featured_badge?.color
                ? `linear-gradient(135deg, ${user.featured_badge.color}25 0%, ${user.featured_badge.color}10 50%, transparent 100%)`
                : "linear-gradient(135deg, rgba(0, 243, 255, 0.15) 0%, rgba(0, 243, 255, 0.05) 50%, transparent 100%)",
            }}
          >
            <div className="relative p-3 space-y-3">
              {/* User header */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 border-2 rounded-full object-cover shadow-lg"
                      style={{
                        borderColor:
                          user.featured_badge?.color || "var(--primary)",
                      }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 border-2 rounded-full bg-white/5 flex items-center justify-center shadow-lg"
                      style={{
                        borderColor:
                          user.featured_badge?.color || "var(--primary)",
                      }}
                    >
                      <UserPlus size={20} className="text-text-secondary" />
                    </div>
                  )}
                  {/* Featured badge indicator */}
                  {user.featured_badge && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg"
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
                            size={10}
                            className="text-black"
                            strokeWidth={2.5}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div
                    className="font-header text-sm font-bold truncate mb-1"
                    style={{
                      color: user.featured_badge?.color || "var(--primary)",
                    }}
                  >
                    {user.username}
                  </div>
                  {user.rank && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                        style={{
                          color: user.featured_badge?.color || "var(--primary)",
                          backgroundColor: user.featured_badge?.color
                            ? `${user.featured_badge.color}20`
                            : "rgba(0, 243, 255, 0.2)",
                          borderColor: user.featured_badge?.color
                            ? `${user.featured_badge.color}50`
                            : "rgba(0, 243, 255, 0.3)",
                        }}
                      >
                        {user.rank.name}
                      </div>
                    </div>
                  )}
                  {user.featured_badge && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="p-0.5 rounded border"
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
                              size={10}
                              style={{
                                color: user.featured_badge.color || "#ffffff",
                              }}
                            />
                          );
                        })()}
                      </div>
                      <span className="font-mono text-[9px] text-text-secondary truncate">
                        {user.featured_badge.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* XP Progress */}
              {user.rank && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUpIcon
                        size={10}
                        style={{
                          color:
                            user.featured_badge?.color || "var(--accent-cyan)",
                        }}
                      />
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{
                          color:
                            user.featured_badge?.color || "var(--accent-cyan)",
                        }}
                      >
                        {user.xp || 0} XP
                      </span>
                    </div>
                    {user.rank.next_rank && !xpNotification && (
                      <span className="font-mono text-[9px] text-text-secondary">
                        {user.rank.next_rank_xp - (user.xp || 0)} do{" "}
                        {user.rank.next_rank}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {xpNotification ? (
                        <motion.div
                          key="notification"
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0 }}
                          className="h-full rounded-full"
                          style={{
                            background:
                              "linear-gradient(to right, var(--accent-magenta), var(--primary))",
                            width: "100%",
                          }}
                        />
                      ) : (
                        <motion.div
                          key="progress"
                          initial={{ width: 0 }}
                          animate={{ width: `${user.rank.progress || 0}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              user.featured_badge?.color || "var(--primary)",
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  {xpNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="font-mono text-[9px] text-accent font-bold"
                    >
                      +{xpNotification.xp} XP
                      {xpNotification.message && (
                        <span className="text-primary/80 ml-1">
                          - {xpNotification.message}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="group w-full flex items-center justify-center gap-2 px-2.5 py-2 font-mono text-[10px] font-bold text-black bg-[#5865F2] hover:bg-[#4752C4] rounded-sm transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform hover:shadow-lg"
          >
            <LogIn
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
            DISCORD LOGIN
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 font-mono text-xs transition-all rounded-sm",
                isActive
                  ? "bg-primary/20 text-primary border-l-2 border-primary"
                  : "text-text-secondary hover:text-primary hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/5 space-y-1">
        <div className="px-3 py-2">
          <ThemeDropdown />
        </div>
        <button
          onClick={handleKioskMode}
          className="w-full flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-text-secondary hover:text-primary hover:bg-white/5 rounded-sm transition-all"
        >
          <Monitor size={16} />
          KIOSK
        </button>
        <Link
          to="/settings"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-text-secondary hover:text-primary hover:bg-white/5 rounded-sm transition-all"
        >
          <Settings size={16} />
          USTAWIENIA
        </Link>
        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-text-secondary hover:text-secondary hover:bg-white/5 rounded-sm transition-all"
          >
            <LogOut size={16} />
            WYLOGUJ
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {onClose && (
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-full w-64 bg-black/95 backdrop-blur-xl border-r border-white/5 flex-col z-50 md:hidden flex"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 flex-col z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
