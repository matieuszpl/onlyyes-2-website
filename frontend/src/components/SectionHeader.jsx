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

const routeSubtitles = {
  "/charts": "Najpopularniejsze utwory według głosów społeczności",
  "/worst-charts": "Najgorsze utwory według głosów społeczności",
  "/requests": "Proponuj utwory do radia",
  "/schedule": "Harmonogram audycji na cały tydzień",
};

const routeIconGradients = {
  "/charts": "linear-gradient(135deg, rgba(255, 234, 0, 0.65) 0%, rgba(255, 234, 0, 0.40) 50%, transparent 100%)",
  "/worst-charts": "linear-gradient(135deg, rgba(255, 20, 20, 0.65) 0%, rgba(255, 20, 20, 0.40) 50%, transparent 100%)",
  "/requests": "linear-gradient(135deg, rgba(139, 92, 246, 0.65) 0%, rgba(139, 92, 246, 0.40) 50%, transparent 100%)",
  "/schedule": "linear-gradient(135deg, rgba(var(--accent-magenta-rgb), 0.65) 0%, rgba(var(--accent-magenta-rgb), 0.40) 50%, transparent 100%)",
  "/profile": "linear-gradient(135deg, rgba(0, 243, 255, 0.65) 0%, rgba(0, 243, 255, 0.40) 50%, transparent 100%)",
  "/admin": "linear-gradient(135deg, rgba(239, 68, 68, 0.65) 0%, rgba(239, 68, 68, 0.40) 50%, transparent 100%)",
  "/settings": "linear-gradient(135deg, rgba(0, 243, 255, 0.65) 0%, rgba(0, 243, 255, 0.40) 50%, transparent 100%)",
  "/leaderboard": "linear-gradient(135deg, rgba(255, 234, 0, 0.65) 0%, rgba(255, 234, 0, 0.40) 50%, transparent 100%)",
  "/changelog": "linear-gradient(135deg, rgba(0, 243, 255, 0.65) 0%, rgba(0, 243, 255, 0.40) 50%, transparent 100%)",
  "/achievements": "linear-gradient(135deg, rgba(57, 255, 20, 0.65) 0%, rgba(57, 255, 20, 0.40) 50%, transparent 100%)",
};

const routeIconColors = {
  "/charts": "rgba(255, 234, 0, 1)",
  "/worst-charts": "rgba(255, 20, 20, 1)",
  "/requests": "rgba(139, 92, 246, 1)",
  "/schedule": "rgba(var(--accent-magenta-rgb), 1)",
  "/profile": "rgba(0, 243, 255, 1)",
  "/admin": "rgba(239, 68, 68, 1)",
  "/settings": "rgba(0, 243, 255, 1)",
  "/leaderboard": "rgba(255, 234, 0, 1)",
  "/changelog": "rgba(0, 243, 255, 1)",
  "/achievements": "rgba(57, 255, 20, 1)",
};

export default function SectionHeader({
  icon: Icon,
  title,
  description,
  subtitle,
  actions,
  iconGradient,
  iconColor,
  className = "",
  useRouteData = false,
  size = "default",
}) {
  const location = useLocation();
  const defaultGradient = "linear-gradient(135deg, rgba(0, 243, 255, 0.60) 0%, rgba(0, 243, 255, 0.35) 50%, transparent 100%)";
  const defaultColor = "rgba(0, 243, 255, 1)";
  
  let finalIcon = Icon;
  let finalTitle = title;
  let finalDescription = description || subtitle;
  let finalGradient = iconGradient || defaultGradient;
  let finalColor = iconColor || defaultColor;
  
  if (useRouteData) {
    finalIcon = finalIcon || routeIcons[location.pathname];
    finalTitle = finalTitle || routeTitles[location.pathname] || "";
    finalDescription = finalDescription || routeSubtitles[location.pathname];
    finalGradient = iconGradient || routeIconGradients[location.pathname] || defaultGradient;
    finalColor = iconColor || routeIconColors[location.pathname] || defaultColor;
  }
  
  const titleSize = size === "large" ? "text-4xl" : "text-lg";
  const containerClass = size === "large" ? "mb-8" : "";
  const IconComponent = finalIcon;
  
  return (
    <div className={`flex items-stretch justify-between ${containerClass} ${className}`}>
      <div className="flex items-center gap-2">
        {IconComponent && (
          <div 
            className="flex items-center justify-center shrink-0 self-stretch relative"
            style={{
              background: finalGradient,
              border: `1px solid ${finalColor.replace('1)', '0.6)')}`,
              aspectRatio: "1 / 1",
              height: "100%",
              minHeight: size === "large" ? "48px" : undefined,
            }}
          >
            <div 
              className="absolute flex items-center justify-center"
              style={{
                inset: finalDescription ? "8px" : "6px",
              }}
            >
              <IconComponent 
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  color: finalColor,
                }}
              />
            </div>
          </div>
        )}
        <div className="flex flex-col justify-center">
          <h3 className={`font-header ${titleSize} text-primary uppercase tracking-wider border-b border-primary/30 pb-0.5 whitespace-nowrap`}>
            {finalTitle}
          </h3>
          {finalDescription && (
            <div className="font-mono text-xs text-text-secondary mt-0.5 whitespace-nowrap truncate">
              {finalDescription}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-1 items-center">{actions}</div>}
    </div>
  );
}

