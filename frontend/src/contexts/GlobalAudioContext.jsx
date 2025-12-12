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
