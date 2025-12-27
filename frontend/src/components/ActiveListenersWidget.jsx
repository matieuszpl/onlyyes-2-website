import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import api from "../api";

export default function ActiveListenersWidget({ compact = false }) {
  const [listeners, setListeners] = useState([]);

  useEffect(() => {
    const loadListeners = async () => {
      try {
        const res = await api.get("/radio/active-listeners");
        const allListeners = res.data.listeners || [];
        const playingListeners = allListeners.filter(
          (l) => l.is_playing === true
        );
        setListeners(playingListeners);
      } catch (error) {
        console.error("Load listeners error:", error);
      }
    };

    loadListeners();
    const interval = setInterval(loadListeners, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/radio/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "active_listeners" && data.data) {
          const allListeners = data.data.listeners || [];
          const playingListeners = allListeners.filter(
            (l) => l.is_playing === true
          );
          setListeners(playingListeners);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  if (listeners.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {listeners.slice(0, 4).map((listener, idx) => (
            <div
              key={listener.id}
              className="relative group"
              title={listener.username}
              style={{ marginLeft: idx > 0 ? "-4px" : "0" }}
            >
              {listener.avatar_url ? (
                <img
                  src={listener.avatar_url}
                  alt={listener.username}
                  className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/60 rounded-full object-cover bg-white/5"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/60 rounded-full bg-white/5 flex items-center justify-center">
                  <Users
                    size={12}
                    className="sm:w-4 sm:h-4 text-text-secondary"
                  />
                </div>
              )}
              {listener.is_guest && (
                <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full ring-2 ring-black/50" />
              )}
            </div>
          ))}
          {listeners.length > 4 && (
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/60 rounded-full bg-white/10 flex items-center justify-center -ml-1"
              title={`+${listeners.length - 4} więcej`}
            >
              <span className="font-mono text-[9px] sm:text-[10px] text-text-primary font-bold">
                +{listeners.length - 4}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card padding="p-2 sm:p-3" className="relative">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
        <Users size={12} className="sm:w-4 sm:h-4 text-primary" />
        <h3 className="font-header text-[10px] sm:text-xs text-primary uppercase tracking-wider">
          SŁUCHAJĄ
        </h3>
        <span className="font-mono text-[9px] sm:text-[10px] text-text-secondary">
          ({listeners.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {listeners.map((listener) => (
          <div
            key={listener.id}
            className="relative group"
            title={listener.username}
          >
            {listener.avatar_url ? (
              <img
                src={listener.avatar_url}
                alt={listener.username}
                className="w-8 h-8 sm:w-10 sm:h-10 border border-primary/50 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 border border-primary/50 rounded-full bg-white/5 flex items-center justify-center">
                <Users
                  size={12}
                  className="sm:w-4 sm:h-4 text-text-secondary"
                />
              </div>
            )}
            {listener.is_guest && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full ring-2 ring-black/50" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
