import { useTheme } from "../contexts/ThemeContext";

export default function CRTEffect() {
  const { theme } = useTheme();

  if (theme !== "oldschool") return null;

  return <div className="crt-effect" />;
}

