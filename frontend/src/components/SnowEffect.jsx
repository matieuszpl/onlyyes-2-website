import { useTheme } from "../contexts/ThemeContext";
import { useEffect, useState } from "react";

export default function SnowEffect() {
  const { theme } = useTheme();
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    if (theme !== "holiday") {
      setSnowflakes([]);
      return;
    }

    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 3 + Math.random() * 4,
      animationDelay: Math.random() * 2,
      size: 4 + Math.random() * 4,
      opacity: 0.5 + Math.random() * 0.5,
    }));

    setSnowflakes(flakes);
  }, [theme]);

  if (theme !== "holiday") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-0 text-white"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.animationDelay}s`,
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}




