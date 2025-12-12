import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRadioEvents } from "./RadioEventsContext";

const GlobalAudioContext = createContext();

export const useGlobalAudio = () => {
  const context = useContext(GlobalAudioContext);
  if (!context) {
    throw new Error("useGlobalAudio must be used within GlobalAudioProvider");
  }
  return context;
};

export const GlobalAudioProvider = ({ children }) => {
  const { nowPlaying: radioNowPlaying } = useRadioEvents();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("radio_volume");
    return saved ? parseFloat(saved) : 0.7;
  });
  const [nowPlaying, setNowPlaying] = useState({
    title: "Unknown",
    artist: "Unknown",
    thumbnail: null,
    songId: "",
    streamUrl: null,
  });
  const [shouldGlitch, setShouldGlitch] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    localStorage.setItem("radio_volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && nowPlaying.streamUrl) {
      audio.play().catch((error) => {
        console.error("Play error:", error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, nowPlaying.streamUrl]);

  useEffect(() => {
    if (radioNowPlaying) {
      setNowPlaying((prev) => {
        if (
          prev.songId === radioNowPlaying.songId &&
          prev.title === radioNowPlaying.title &&
          prev.artist === radioNowPlaying.artist
        ) {
          return prev;
        }
        setShouldGlitch(true);
        setTimeout(() => setShouldGlitch(false), 400);
        return radioNowPlaying;
      });
    }
  }, [radioNowPlaying]);

  useEffect(() => {
    if (nowPlaying.title && nowPlaying.artist) {
      const title = `${nowPlaying.title} - ${nowPlaying.artist} | ONLY YES`;
      document.title = title;

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: nowPlaying.title,
          artist: nowPlaying.artist,
          album: "ONLY YES",
          artwork: nowPlaying.thumbnail
            ? [
                {
                  src: nowPlaying.thumbnail,
                  sizes: "512x512",
                  type: "image/png",
                },
              ]
            : [],
        });
      }
    } else {
      document.title = "ONLY YES";
    }
  }, [nowPlaying.title, nowPlaying.artist, nowPlaying.thumbnail]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        if (nowPlaying.streamUrl) {
          setIsPlaying(true);
        }
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        setIsPlaying(false);
      });

      return () => {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      };
    }
  }, [nowPlaying.streamUrl]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!nowPlaying.streamUrl) {
      alert("Stream URL nie jest dostępny");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const setVolumeValue = (newVolume) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
  };

  const triggerGlitch = () => {
    setShouldGlitch(true);
    setTimeout(() => setShouldGlitch(false), 400);
  };

  return (
    <GlobalAudioContext.Provider
      value={{
        isPlaying,
        togglePlay,
        volume,
        setVolume: setVolumeValue,
        nowPlaying,
        shouldGlitch,
        triggerGlitch,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        src={nowPlaying.streamUrl || undefined}
        preload="none"
        crossOrigin="anonymous"
        style={{ display: "none" }}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio error:", e);
          setIsPlaying(false);
        }}
      />
    </GlobalAudioContext.Provider>
  );
};
