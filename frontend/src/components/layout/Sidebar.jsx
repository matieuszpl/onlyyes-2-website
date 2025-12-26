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
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { cn } from "../../utils/cn";
import ThemeDropdown from "../ThemeDropdown";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

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
        {user ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 border border-primary/50 rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-text-primary truncate">
                  {user.username}
                </div>
                <div className="font-mono text-[10px] text-text-secondary">
                  {user.is_admin ? "ADMIN" : user.rank?.name || "USER"}
                </div>
              </div>
            </div>
            {user.rank && (
              <div className="space-y-2">
                <div
                  className="w-full rounded-full h-1 overflow-hidden relative"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                >
                  <motion.div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: "var(--accent-magenta)",
                      minWidth: user.rank.progress > 0 ? "2px" : "0",
                    }}
                    initial={{ width: `${user.rank.progress || 0}%` }}
                    animate={{ width: `${user.rank.progress || 0}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <AnimatePresence mode="wait">
                    {xpNotification ? (
                      <motion.span
                        key="notification"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-accent font-bold"
                      >
                        +{xpNotification.xp} XP
                        {xpNotification.message && (
                          <span className="text-primary/80 ml-1">
                            - {xpNotification.message}
                          </span>
                        )}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="xp-display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-accent font-semibold"
                      >
                        {user.xp || 0} /{" "}
                        {user.rank.next_rank_xp || user.xp || 0} XP
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {user.rank.next_rank && !xpNotification && (
                    <span className="text-text-secondary/70 text-[9px]">
                      {user.rank.next_rank_xp - (user.xp || 0)} do{" "}
                      <span className="text-primary">
                        {user.rank.next_rank}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
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
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-black/40 backdrop-blur-xl border-r border-white/5 flex-col z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
