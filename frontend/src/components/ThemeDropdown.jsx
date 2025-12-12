import { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";

const themes = [
  { id: "default", label: "Domyślny" },
  { id: "work", label: "Pomarańczowy" },
  { id: "rgb", label: "RGB" },
  { id: "holiday", label: "Świąteczny" },
  { id: "oldschool", label: "Oldschool" },
];

export default function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedTheme = themes.find((t) => t.id === theme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-2 py-1.5 font-mono text-xs text-text-primary bg-white/5 border border-white/10 rounded-sm transition-all",
          "hover:border-primary/50 hover:bg-white/10",
          isOpen && "border-primary bg-white/10"
        )}
      >
        <span>{selectedTheme.label}</span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform text-text-secondary",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-white/10 rounded-sm shadow-lg overflow-hidden z-50 backdrop-blur-xl max-h-48 overflow-y-auto">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-2 py-1.5 font-mono text-xs transition-all",
                theme === t.id
                  ? "font-bold border-l-2 border-primary"
                  : "text-text-primary hover:bg-white/10 hover:text-primary"
              )}
              style={
                theme === t.id
                  ? theme === "rgb"
                    ? {
                        background:
                          "linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000)",
                        backgroundSize: "200% 100%",
                        animation: "rgb-gradient 3s linear infinite",
                        color: "#ffffff",
                        boxShadow: "0 0 15px rgba(255, 0, 0, 0.6)",
                      }
                    : {
                        backgroundColor: "var(--primary)",
                        color: "#000000",
                        boxShadow: "0 0 10px rgba(var(--primary-rgb), 0.5)",
                      }
                  : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

