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
} from "lucide-react";
import TextGlitch from "../TextGlitch";

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
};

export default function PageHeader({ title, icon, subtitle }) {
  const location = useLocation();
  const Icon = icon || routeIcons[location.pathname];
  const pageTitle = title || routeTitles[location.pathname] || "";
  const pageSubtitle = subtitle;

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="font-brand text-3xl md:text-4xl text-primary tracking-wider">
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
      </div>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="text-primary" size={32} />}
        <div>
          <h1 className="font-header text-4xl text-primary uppercase tracking-wider mb-2">
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
