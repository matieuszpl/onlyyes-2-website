import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import api from "../api";
import TextGlitch from "../components/TextGlitch";
import Card from "../components/Card";

export default function SchedulePage() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShows = async () => {
      try {
        const res = await api.get("/radio/schedules");
        setShows(res.data || []);
      } catch (error) {
        console.error("Load schedules error:", error);
        setShows([]);
      } finally {
        setLoading(false);
      }
    };

    loadShows();
    const interval = setInterval(loadShows, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "00:00";
    try {
      if (typeof timeStr === "number") {
        if (timeStr < 1440) {
          const hours = Math.floor(timeStr / 60);
          const minutes = timeStr % 60;
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        }
      }
      const parts = timeStr.toString().split(":");
      const hours = parts[0] || "00";
      const minutes = parts[1] || "00";
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    } catch {
      return "00:00";
    }
  };

  // Dni tygodnia: poniedziałek = 0, niedziela = 6
  const getDayName = (dayNum) => {
    const days = [
      "Poniedziałek",
      "Wtorek",
      "Środa",
      "Czwartek",
      "Piątek",
      "Sobota",
      "Niedziela",
    ];
    return days[dayNum] || "";
  };

  const getDayShortName = (dayNum) => {
    const days = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
    return days[dayNum] || "";
  };

  // Konwertuj JavaScript getDay() (0=niedziela) na nasz format (0=poniedziałek)
  const getCurrentDay = () => {
    const jsDay = new Date().getDay(); // 0=niedziela, 1=poniedziałek, ..., 6=sobota
    return jsDay === 0 ? 6 : jsDay - 1; // Konwertuj: niedziela(0) -> 6, poniedziałek(1) -> 0, itd.
  };

  const getCurrentShow = () => {
    if (shows.length === 0) return "Auto DJ";

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const currentDay = getCurrentDay();

    for (const show of shows) {
      if (!show.is_enabled) continue;

      // Konwertuj dni z AzuraCast (0=niedziela) na nasz format (0=poniedziałek)
      const showDays = show.days ? show.days.map(day => day === 0 ? 6 : day - 1) : [];

      if (
        !show.days ||
        show.days.length === 0 ||
        showDays.includes(currentDay)
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

  // Grupuj audycje po dniach - ZAWSZE pokazuj wszystkie 7 dni (poniedziałek=0, niedziela=6)
  const showsByDay = {};
  // Inicjalizuj wszystkie dni
  for (let i = 0; i < 7; i++) {
    showsByDay[i] = [];
  }
  
  shows.forEach((show) => {
    if (!show.days || show.days.length === 0) {
      // Audycja codzienna - dodaj do wszystkich dni
      for (let i = 0; i < 7; i++) {
        showsByDay[i].push(show);
      }
    } else {
      // Konwertuj dni z AzuraCast (0=niedziela) na nasz format (0=poniedziałek)
      show.days.forEach((day) => {
        const convertedDay = day === 0 ? 6 : day - 1; // niedziela(0) -> 6, poniedziałek(1) -> 0
        if (showsByDay[convertedDay]) {
          showsByDay[convertedDay].push(show);
        }
      });
    }
  });

  // Sortuj audycje w każdym dniu po czasie rozpoczęcia
  Object.keys(showsByDay).forEach((day) => {
    showsByDay[day].sort((a, b) => {
      const timeA = formatTime(a.start_time);
      const timeB = formatTime(b.start_time);
      return timeA.localeCompare(timeB);
    });
  });

  const renderMatrixView = () => {
    const isToday = getCurrentDay();
    
    return (
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 min-w-max md:min-w-0">
          {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
            const dayShows = showsByDay[dayNum] || [];
            const isTodayDay = dayNum === isToday;
            
            return (
              <div
                key={dayNum}
                className={`p-4 border min-h-[400px] min-w-[280px] md:min-w-0 ${
                  isTodayDay
                    ? "bg-cyan-400/10 border-cyan-400"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className={`text-center mb-4 pb-2 border-b ${isTodayDay ? "border-cyan-400" : "border-white/10"}`}>
                  <div className={`text-sm font-bold ${isTodayDay ? "text-cyan-400" : "text-white"}`}>
                    {getDayName(dayNum)}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayShows.length === 0 ? (
                    <div className="text-xs text-white/40 text-center">Brak</div>
                  ) : (
                    dayShows.map((show, idx) => (
                      <Card
                        key={`${dayNum}-${show.id}-${idx}`}
                        padding="p-2"
                        className="text-xs"
                      >
                        <div className="font-bold text-white mb-1 line-clamp-2">
                          {(show.name || "Auto DJ").replace(/^A\d+\.\s*/, "")}
                        </div>
                        <div className="text-white/50">
                          {formatTime(show.start_time)}-{formatTime(show.end_time)}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
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

        <div className="flex items-center gap-3 mb-8">
          <Calendar className="text-primary hidden sm:block" size={32} />
          <div>
            <h1 className="font-header text-2xl sm:text-4xl text-primary uppercase tracking-wider mb-2">
              KALENDARZ
            </h1>
            <p className="font-mono text-xs sm:text-sm text-text-secondary">
              Harmonogram audycji na cały tydzień
            </p>
          </div>
        </div>

        {/* Skeleton loader dla Matrix View */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 min-w-max md:min-w-0">
            {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => (
              <motion.div
                key={dayNum}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: dayNum * 0.05 }}
                className="p-4 border min-h-[400px] min-w-[280px] md:min-w-0 bg-white/5 border-white/10"
              >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: dayNum * 0.1,
                }}
                className="text-center mb-4 pb-2 border-b border-white/10"
              >
                <div className="h-4 bg-white/20 rounded w-20 mx-auto" />
              </motion.div>
              <div className="space-y-2">
                {[1, 2, 3].map((idx) => (
                  <Card
                    key={idx}
                    as={motion.div}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: (dayNum * 0.1) + (idx * 0.1),
                    }}
                    padding="p-2"
                  >
                    <div className="h-3 bg-white/20 rounded w-full mb-1" />
                    <div className="h-2 bg-white/10 rounded w-16" />
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 mb-8">
        <Calendar className="text-primary shrink-0" size={56} />
        <div>
          <h1 className="font-header text-4xl text-primary uppercase tracking-wider mb-0.5">
            KALENDARZ
          </h1>
          <p className="font-mono text-sm text-text-secondary">
            Harmonogram audycji na cały tydzień
          </p>
        </div>
      </div>

      {renderMatrixView()}
    </div>
  );
}
