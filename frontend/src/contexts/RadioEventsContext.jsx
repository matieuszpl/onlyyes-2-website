import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api";

const RadioEventsContext = createContext();

export const useRadioEvents = () => {
  const context = useContext(RadioEventsContext);
  if (!context) {
    throw new Error("useRadioEvents must be used within RadioEventsProvider");
  }
  return context;
};

export const RadioEventsProvider = ({ children }) => {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [recentSongs, setRecentSongs] = useState([]);
  const [nextSong, setNextSong] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [listenerId, setListenerId] = useState(null);

  const handleEvent = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "now_playing" && data.data) {
        const streamUrl = data.data.streamUrl
          ? data.data.streamUrl.startsWith("http") &&
            !data.data.streamUrl.includes("/api/radio/stream")
            ? "/api/radio/stream"
            : data.data.streamUrl
          : "/api/radio/stream";
        setNowPlaying({
          ...data.data,
          streamUrl,
        });
      } else if (data.type === "recent_songs" && data.data) {
        setRecentSongs(data.data.songs || []);
      } else if (data.type === "next_song" && data.data) {
        setNextSong(data.data);
      } else if (data.type === "connected") {
        setIsConnected(true);
        if (data.listener_id) {
          setListenerId(data.listener_id);
        }
      }
    } catch (error) {
      console.error("Error parsing SSE event:", error);
    }
  }, []);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    const connect = () => {
      eventSource = new EventSource("/api/radio/events");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = handleEvent;

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [handleEvent]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [nowRes, historyRes, nextRes] = await Promise.all([
          api.get("/radio/now-playing"),
          api.get("/radio/recent-songs?limit=10"),
          api.get("/radio/next-song"),
        ]);

        const streamUrl = nowRes.data.streamUrl
          ? nowRes.data.streamUrl.startsWith("http") &&
            !nowRes.data.streamUrl.includes("/api/radio/stream")
            ? "/api/radio/stream"
            : nowRes.data.streamUrl
          : "/api/radio/stream";

        setNowPlaying({ ...nowRes.data, streamUrl });
        setRecentSongs(historyRes.data || []);
        setNextSong(nextRes.data || null);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitial();
  }, []);

  return (
    <RadioEventsContext.Provider
      value={{
        nowPlaying,
        recentSongs,
        nextSong,
        isConnected,
        listenerId,
      }}
    >
      {children}
    </RadioEventsContext.Provider>
  );
};

