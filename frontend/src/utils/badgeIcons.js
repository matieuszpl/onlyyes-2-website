import {
  Moon,
  Shield,
  Music,
  Headphones,
  ThumbsUp,
  ThumbsDown,
  Radio,
  Lightbulb,
  Trophy,
} from "lucide-react";

// Mapowanie emotikonów na ikony z lucide-react
export const iconMap = {
  "🌙": Moon,
  "🛡️": Shield,
  "🎵": Music,
  "🎧": Headphones,
  "👍": ThumbsUp,
  "👎": ThumbsDown,
  "📻": Radio,
  "💡": Lightbulb,
  "🏆": Trophy,
};

export const getIconComponent = (iconString) => {
  if (!iconString) return Trophy;
  const IconComponent = iconMap[iconString];
  return IconComponent || Trophy;
};
