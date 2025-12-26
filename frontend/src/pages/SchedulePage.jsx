import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../api";
import PageHeader from "../components/layout/PageHeader";

export default function SchedulePage() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShows = async () => {
      try {
        const res = await api.get("/radio/schedules");
        setShows(res.data);
      } catch (error) {
        console.error("Load schedules error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadShows();
    const interval = setInterval(loadShows, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      return `${hours}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  const getDayName = (dayNum) => {
    const days = [
      "Niedziela",
      "Poniedziałek",
      "Wtorek",
      "Środa",
      "Czwartek",
      "Piątek",
      "Sobota",
    ];
    return days[dayNum] || "";
  };

  const getCurrentShow = () => {
    if (shows.length === 0) return "Auto DJ";

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const currentDay = now.getDay();

    for (const show of shows) {
      if (!show.is_enabled) continue;

      if (
        !show.days ||
        show.days.length === 0 ||
        show.days.includes(currentDay)
      ) {
        const startTime = formatTime(show.start_time);
        const endTime = formatTime(show.end_time);

        if (startTime && endTime) {
          if (startTime <= endTime) {
            if (startTime <= currentTime && currentTime <= endTime) {
              return (show.name || "Auto DJ").replace(/^A\d+\.\s*/, "");
            }
          } else {
            if (currentTime >= startTime || currentTime <= endTime) {
              return (show.name || "Auto DJ").replace(/^A\d+\.\s*/, "");
            }
          }
        }
      }
    }
    return "Auto DJ";
  };

  const showsByDay = {};
  shows.forEach((show) => {
    if (!show.days || show.days.length === 0) {
      if (!showsByDay["all"]) showsByDay["all"] = [];
      showsByDay["all"].push(show);
    } else {
      show.days.forEach((day) => {
        if (!showsByDay[day]) showsByDay[day] = [];
        showsByDay[day].push(show);
      });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="KALENDARZ AUDYCJI"
        subtitle="Zaplanowane audycje i programy"
      />

      <div className="glass-panel p-6 space-y-4 relative">
        <div className="corner-bracket corner-bracket-top-left" />
        <div className="corner-bracket corner-bracket-top-right" />
        <div className="corner-bracket corner-bracket-bottom-left" />
        <div className="corner-bracket corner-bracket-bottom-right" />

        <div className="p-4 bg-primary/20 border border-primary">
          <div className="font-mono text-xs text-text-secondary mb-1">
            TERAZ GRANE
          </div>
          <div className="font-header text-xl text-primary">
            {getCurrentShow()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((dayNum) => (
            <motion.div
              key={dayNum}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: dayNum * 0.1 }}
              className="glass-panel p-6 space-y-4 relative"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: dayNum * 0.1,
                }}
                className="h-6 bg-white/20 rounded w-32"
              />
              <div className="space-y-2">
                {[1, 2].map((idx) => (
                  <motion.div
                    key={idx}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: (dayNum * 0.1) + (idx * 0.1),
                    }}
                    className="p-3 bg-white/5 border border-white/10"
                  >
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : Object.keys(showsByDay).length === 0 ? (
        <div className="glass-panel p-6">
          <div className="font-mono text-sm text-text-secondary">
            BRAK AUDYCJI
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
            if (!showsByDay[dayNum] || showsByDay[dayNum].length === 0)
              return null;

            return (
              <div key={dayNum} className="glass-panel p-6 space-y-4 relative">
                <div className="corner-bracket corner-bracket-top-left" />
                <div className="corner-bracket corner-bracket-top-right" />
                <div className="corner-bracket corner-bracket-bottom-left" />
                <div className="corner-bracket corner-bracket-bottom-right" />

                <h3 className="font-header text-lg text-primary uppercase tracking-wider">
                  {getDayName(dayNum)}
                </h3>

                <div className="space-y-2">
                  {showsByDay[dayNum].map((show) => (
                    <div
                      key={show.id}
                      className="p-3 bg-white/5 border border-white/10 hover:border-primary/50 transition-all"
                    >
                      <div className="font-header text-sm text-text-primary mb-1">
                        {(show.name || "Auto DJ").replace(/^A\d+\.\s*/, "")}
                      </div>
                      <div className="font-mono text-xs text-text-secondary">
                        {formatTime(show.start_time)} -{" "}
                        {formatTime(show.end_time)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
