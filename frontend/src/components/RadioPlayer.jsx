import { useState, useEffect, useRef } from "react";
import VoteButtons from "./VoteButtons";
import api from "../api";

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState({
    title: "Mock Song Title",
    artist: "Mock Artist",
    thumbnail: null,
    songId: "mock-song-id",
    streamUrl: null,
  });
  const audioRef = useRef(null);

  useEffect(() => {
    const loadNowPlaying = async () => {
      try {
        const res = await api.get("/radio/now-playing");
        // Użyj proxy endpoint zamiast bezpośredniego URL (rozwiązuje CORS)
        const streamUrl = res.data.streamUrl
          ? res.data.streamUrl.startsWith("http") &&
            !res.data.streamUrl.includes("/api/radio/stream")
            ? "/api/radio/stream"
            : res.data.streamUrl
          : "/api/radio/stream";

        setNowPlaying({
          title: res.data.title,
          artist: res.data.artist,
          thumbnail: res.data.thumbnail,
          songId: res.data.songId,
          streamUrl: streamUrl,
        });
      } catch (error) {
        console.error("Load now playing error:", error);
      }
    };

    loadNowPlaying();
    const interval = setInterval(loadNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const togglePlay = () => {
    if (!nowPlaying.streamUrl) {
      alert("Stream URL nie jest dostępny");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-base font-bold text-white mb-4">ONLY YES Radio</h2>

      <div className="flex items-center gap-4 mb-4">
        {nowPlaying.thumbnail && (
          <img
            src={nowPlaying.thumbnail}
            alt={nowPlaying.title}
            className="w-20 h-20 rounded"
          />
        )}
        <div className="flex-1">
          <div className="text-white font-semibold">{nowPlaying.title}</div>
          <div className="text-gray-400">{nowPlaying.artist}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
        >
          {isPlaying ? "⏸ Stop" : "▶ Play"}
        </button>
        <div className="text-sm text-gray-400">
          {isPlaying ? "Streaming..." : "Stopped"}
        </div>
      </div>

      <VoteButtons songId={nowPlaying.songId} />

      <audio
        ref={audioRef}
        src={nowPlaying.streamUrl || undefined}
        preload="none"
        crossOrigin="anonymous"
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio error:", e);
          console.error("Stream URL:", nowPlaying.streamUrl);
          setIsPlaying(false);
        }}
        onLoadStart={() => {
          console.log("Audio loading started, URL:", nowPlaying.streamUrl);
        }}
        onCanPlay={() => {
          console.log("Audio can play");
        }}
      />

      {nowPlaying.streamUrl && (
        <div className="mt-4 text-xs text-gray-500">
          Stream URL: {nowPlaying.streamUrl}
        </div>
      )}
    </div>
  );
}
