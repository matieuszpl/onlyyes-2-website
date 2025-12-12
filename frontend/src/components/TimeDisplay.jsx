import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="glass-panel p-4 relative">

      <div className="flex items-center gap-3">
        <Clock size={20} className="text-primary" />
        <div>
          <div className="font-mono text-sm font-bold text-primary">
            {formatTime(time)}
          </div>
          <div className="font-mono text-xs text-text-secondary">
            {formatDate(time)}
          </div>
        </div>
      </div>
    </div>
  );
}

