import { useLocation } from "react-router-dom";
import {
  Home,
  Music,
  TrendingUp,
  TrendingDown,
  User,
  Settings,
  Calendar,
  Shield,
  Trophy,
  GitBranch,
  Award,
} from "lucide-react";

const routeIcons = {
  "/": Home,
  "/charts": TrendingUp,
  "/worst-charts": TrendingDown,
  "/requests": Music,
  "/schedule": Calendar,
  "/profile": User,
  "/admin": Shield,
  "/settings": Settings,
  "/leaderboard": Trophy,
  "/changelog": GitBranch,
  "/achievements": Award,
};

const routeTitles = {
  "/": "GŁÓWNA",
  "/charts": "LISTA PRZEBOJÓW",
  "/worst-charts": "LISTA GNIOTÓW",
  "/requests": "PROPOZYCJE",
  "/schedule": "KALENDARZ",
  "/profile": "PROFIL",
  "/admin": "ADMIN",
  "/settings": "USTAWIENIA",
  "/leaderboard": "RANKING",
  "/changelog": "CHANGELOG",
  "/achievements": "OSIĄGNIĘCIA",
};

export default function PageHeader({ title, icon, subtitle }) {
  const location = useLocation();
  const Icon = icon || routeIcons[location.pathname];
  const pageTitle = title || routeTitles[location.pathname] || "";
  const pageSubtitle = subtitle;

  return (
    <div className="mb-8">
      <div className="flex items-start gap-3">
        {Icon && <Icon className="text-primary shrink-0" size={56} />}
        <div>
          <h1 className="font-header text-4xl text-primary uppercase tracking-wider mb-0.5">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="font-mono text-sm text-text-secondary">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
