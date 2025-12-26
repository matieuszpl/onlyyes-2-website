import { Link, useLocation } from "react-router-dom";
import { Home, Music, TrendingUp, User, Menu } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { cn } from "../../utils/cn";

export default function BottomNav({ onMenuClick }) {
  const location = useLocation();
  const { user } = useUser();

  const navItems = [
    { path: "/", icon: Home, label: "Główna" },
    { path: "/charts", icon: TrendingUp, label: "Lista" },
    { path: "/requests", icon: Music, label: "Propozycje" },
  ];

  if (user) {
    navItems.push({ path: "/profile", icon: User, label: "Profil" });
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-full border-t border-white/5 flex justify-around items-center h-16 z-50"
      style={{
        margin: 0,
        padding: 0,
        background: "rgba(var(--surface-rgb, 18, 18, 18), 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 0,
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "none",
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
              isActive
                ? "text-primary"
                : "text-text-secondary hover:text-primary"
            )}
          >
            <Icon size={20} />
            <span className="text-xs font-mono">{item.label}</span>
          </Link>
        );
      })}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all text-text-secondary hover:text-primary"
        >
          <Menu size={20} />
          <span className="text-xs font-mono">Menu</span>
        </button>
      )}
    </nav>
  );
}
