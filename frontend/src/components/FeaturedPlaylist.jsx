import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Music2, Play } from "lucide-react";
import api from "../api";

const colors = ["border-accent-cyan", "border-primary", "border-accent-magenta"];

export default function FeaturedPlaylist() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const res = await api.get("/playlists");
        const playlistsData = res.data.slice(0, 3).map((playlist, idx) => ({
          id: playlist.id,
          name: playlist.name,
          count: playlist.num_songs || 0,
          color: colors[idx % colors.length],
        }));
        setPlaylists(playlistsData);
      } catch (error) {
        console.error("Load playlists error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  return (
    <div className="glass-panel p-4 space-y-2 relative">

      <h3 className="font-header text-sm text-primary uppercase tracking-wider">
        PLAYLISTY
      </h3>

      {loading ? (
        <div className="font-mono text-xs text-text-secondary">ŁADOWANIE...</div>
      ) : playlists.length === 0 ? (
        <div className="font-mono text-xs text-text-secondary">BRAK PLAYLIST</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {playlists.map((playlist, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, y: -4 }}
            className={`p-4 bg-white/5 border-2 ${playlist.color} cursor-pointer interactive-card`}
          >
            <Music2 size={24} className="mb-2 text-primary" />
            <div className="font-header text-sm text-text-primary mb-1">
              {playlist.name}
            </div>
            <div className="font-mono text-xs text-text-secondary">
              {playlist.count} utworów
            </div>
          </motion.div>
        ))}
        </div>
      )}
    </div>
  );
}

