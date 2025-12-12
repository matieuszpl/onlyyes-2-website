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
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { cn } from "../../utils/cn";
import ThemeDropdown from "../ThemeDropdown";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, login } = useUser();

  const navItems = [
    { path: "/", icon: Home, label: "GŁÓWNA" },
    { path: "/charts", icon: TrendingUp, label: "LISTA PRZEBOJÓW" },
    { path: "/worst-charts", icon: TrendingDown, label: "LISTA GNIOTÓW" },
    { path: "/requests", icon: Music, label: "PROPOZYCJE" },
    { path: "/schedule", icon: Calendar, label: "KALENDARZ" },
  ];

  if (user) {
    navItems.push({ path: "/profile", icon: User, label: "PROFIL" });
    if (user.is_admin) {
      navItems.push({ path: "/admin", icon: Shield, label: "ADMIN" });
    }
  }

  const handleKioskMode = () => {
    navigate("/?mode=kiosk");
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-black/40 backdrop-blur-xl border-r border-white/5 flex-col z-30">
      <div className="p-3 border-b border-white/5">
        {user ? (
          <div className="flex items-center gap-2.5 pt-1">
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
                {user.is_admin ? "ADMIN" : "USER"}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={login}
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

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
          className="flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-text-secondary hover:text-primary hover:bg-white/5 rounded-sm transition-all"
        >
          <Settings size={16} />
          USTAWIENIA
        </Link>
        {user && (
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-text-secondary hover:text-secondary hover:bg-white/5 rounded-sm transition-all"
          >
            <LogOut size={16} />
            WYLOGUJ
          </button>
        )}
      </div>
    </aside>
  );
}
