import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import api from "../api";
import Card from "./Card";

export default function ScheduledShows() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShows = async () => {
      try {
        const res = await api.get("/radio/schedules");
        const data = res.data || [];
        setShows(data);
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
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}`;
        } else {
          const totalSeconds = timeStr;
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}`;
        }
      }
      const parts = timeStr.toString().split(":");
      const hours = parts[0] || "00";
      const minutes = parts[1] || "00";
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    } catch {
      return "00:00";
    }
  };

  const getFriendlyTime = (startTime, days, isTomorrow = false) => {
    if (!startTime) return "";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = startTime.split(":").map(Number);
    const startTimeMinutes = hours * 60 + minutes;

    if (isTomorrow) {
      return `jutro o ${startTime}`;
    }

    let diffMins = startTimeMinutes - currentTime;
    if (diffMins < 0) {
      diffMins += 24 * 60;
    }

    if (diffMins === 0) {
      return "teraz";
    } else if (diffMins < 60) {
      return `za ${diffMins} ${
        diffMins === 1 ? "minutę" : diffMins < 5 ? "minuty" : "minut"
      }`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      if (remainingMins === 0) {
        return `za ${diffHours} ${
          diffHours === 1 ? "godzinę" : diffHours < 5 ? "godziny" : "godzin"
        }`;
      } else {
        return `za ${diffHours}h ${remainingMins}min`;
      }
    }
  };

  const groupShowsByDay = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const today = [];
    const tomorrow = [];
    const allShows = [];

    shows.forEach((show) => {
      const isEnabled = show.is_enabled !== false;
      if (!isEnabled) return;

      const showDays =
        show.days && show.days.length > 0 ? show.days : [0, 1, 2, 3, 4, 5, 6];
      const isToday = showDays.includes(currentDay);
      const isTomorrow = showDays.includes((currentDay + 1) % 7);

      if (isToday) {
        today.push(show);
      }
      if (isTomorrow) {
        tomorrow.push(show);
      }
      if (isToday || isTomorrow) {
        allShows.push(show);
      }
    });

    today.sort((a, b) => {
      const [aH, aM] = (a.start_time || "00:00").split(":").map(Number);
      const [bH, bM] = (b.start_time || "00:00").split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

    tomorrow.sort((a, b) => {
      const [aH, aM] = (a.start_time || "00:00").split(":").map(Number);
      const [bH, bM] = (b.start_time || "00:00").split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

    return { today, tomorrow, allShows };
  };

  const getCurrentShow = () => {
    if (shows.length === 0) return "Auto DJ";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    for (const show of shows) {
      if (!show.is_enabled) continue;

      const showDays =
        show.days && show.days.length > 0 ? show.days : [0, 1, 2, 3, 4, 5, 6];
      if (!showDays.includes(currentDay)) continue;

      const [startH, startM] = (show.start_time || "00:00")
        .split(":")
        .map(Number);
      const [endH, endM] = (show.end_time || "23:59").split(":").map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime < endTime) {
          return (show.name || "Auto DJ").replace(/^A\d+\.\s*/, "");
        }
      } else {
        if (currentTime >= startTime || currentTime < endTime) {
          return (show.name || "Auto DJ").replace(/^A\d+\.\s*/, "");
        }
      }
    }
    return "Auto DJ";
  };

  return (
    <Card className="space-y-2 relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <h3 className="font-header text-sm text-primary uppercase tracking-wider">
            AUDYCJE
          </h3>
        </div>
        <Link
          to="/schedule"
          className="font-mono text-[10px] text-primary hover:text-primary-alt"
        >
          ZOBACZ WSZYSTKIE →
        </Link>
      </div>

      <div className="space-y-2">
        <div className="p-2 bg-primary/20 border border-primary rounded-sm">
          <div className="font-mono text-[10px] text-text-secondary mb-0.5">
            TERAZ
          </div>
          <div className="font-header text-xs text-primary">
            {getCurrentShow().replace(/^A\d+\.\s*/, "")}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Card
                key={idx}
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                padding="p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1.5">
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.1,
                      }}
                      className="h-2.5 bg-white/20 rounded w-3/4"
                    />
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.15,
                      }}
                      className="h-2 bg-white/10 rounded w-1/2"
                    />
                  </div>
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-2 bg-white/10 rounded w-16"
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="font-mono text-[10px] text-text-secondary">
            BRAK AUDYCJI
          </div>
        ) : (
          (() => {
            const { today, tomorrow, allShows } = groupShowsByDay();
            const now = new Date();
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

            const upcomingToday = today.filter((show) => {
              const [startH, startM] = (show.start_time || "00:00")
                .split(":")
                .map(Number);
              const startTime = startH * 60 + startM;
              return startTime > currentTimeMinutes;
            });

            let upcomingShows = [...upcomingToday, ...tomorrow].slice(0, 3);

            if (upcomingShows.length === 0) {
              if (tomorrow.length > 0) {
                upcomingShows = [tomorrow[0]];
              } else if (today.length > 0) {
                upcomingShows = [today[0]];
              } else if (allShows.length > 0) {
                upcomingShows = [allShows[0]];
              }
            }

            return (
              <div className="space-y-3">
                {upcomingShows.length > 0 && (
                  <div>
                    <div className="space-y-1.5">
                      {upcomingShows.map((show, idx) => {
                        const isToday = idx < upcomingToday.length;
                        return (
                          <Card
                            key={show.id}
                            as={motion.div}
                padding="p-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-header text-[10px] text-text-primary mb-0.5 truncate">
                                  {(show.name || "Auto DJ").replace(
                                    /^A\d+\.\s*/,
                                    ""
                                  )}
                                </div>
                                <div className="font-mono text-[9px] text-text-secondary">
                                  {formatTime(show.start_time)} -{" "}
                                  {formatTime(show.end_time)}
                                </div>
                              </div>
                              <div className="font-mono text-[9px] text-primary whitespace-nowrap">
                                {getFriendlyTime(
                                  show.start_time,
                                  show.days,
                                  !isToday
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {upcomingShows.length === 0 && (
                  <div className="font-mono text-[10px] text-text-secondary">
                    BRAK NADCHODZĄCYCH AUDYCJI
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </Card>
  );
}
