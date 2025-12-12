import { useTheme } from "../contexts/ThemeContext";
import { Palette } from "lucide-react";
import { cn } from "../utils/cn";

const themes = [
  { id: "default", label: "Domyślny", color: "#00f3ff" },
  { id: "work", label: "Pomarańczowy", color: "#f26d00" },
  { id: "rgb", label: "RGB", color: "transparent" },
  { id: "holiday", label: "Świąteczny", color: "#dc143c" },
  { id: "oldschool", label: "Oldschool", color: "#c4ff00" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Palette size={16} className="text-text-secondary" />
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "w-6 h-6 border-2 transition-all",
              theme === t.id
                ? "border-primary scale-110"
                : "border-white/20 hover:border-white/40"
            )}
            style={{
              backgroundColor:
                t.color === "transparent" ? "transparent" : t.color,
              backgroundImage:
                t.color === "transparent"
                  ? "linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000)"
                  : undefined,
            }}
            title={t.label}
          />
        ))}
      </div>
    </div>
  );
}
