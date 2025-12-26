import { useState, useEffect, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import { useToast } from "./ToastContainer";
import api from "../api";

export default function VoteButtons({ songId, size = "normal" }) {
  const { user, refreshUser } = useUser();
  const { nowPlaying } = useGlobalAudio();
  const { showToast } = useToast();
  const [vote, setVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const prevNowPlayingSongIdRef = useRef(nowPlaying.songId);
  const hasVotedBeforeRef = useRef(false);

  const isCurrentSong = nowPlaying.songId === songId;
  const hasVoted = vote !== null && isCurrentSong;

  useEffect(() => {
    if (!user || !songId) return;

    const fetchVote = async () => {
      try {
        const res = await api.get(`/votes/${songId}`);
        setVote(res.data.vote_type);
      } catch (error) {
        console.error("Fetch vote error:", error);
      }
    };

    fetchVote();
  }, [user, songId]);

  useEffect(() => {
    const prevSongId = prevNowPlayingSongIdRef.current;
    if (prevSongId && prevSongId === songId && nowPlaying.songId !== songId) {
      setVote(null);
      hasVotedBeforeRef.current = false;
    }
    prevNowPlayingSongIdRef.current = nowPlaying.songId;
  }, [nowPlaying.songId, songId]);

  if (!user) {
    return (
      <div className="font-mono text-xs text-text-secondary">
        ZALOGUJ SIĘ, ABY GŁOSOWAĆ
      </div>
    );
  }

  const handleVote = async (voteType) => {
    if (loading || hasVoted) return;

    setLoading(true);
    const wasNewVote = !hasVotedBeforeRef.current;
    try {
      await api.post("/votes", { song_id: songId, vote_type: voteType });
      setVote(voteType);
      hasVotedBeforeRef.current = true;

      if (wasNewVote) {
        setTimeout(() => {
          refreshUser();
        }, 500);
      }

      if (voteType === "LIKE") {
        showToast("LUBISZ TĄ PIOSENKĘ", "success", 4000);
      } else {
        showToast("NIE LUBISZ TEGO UTWORU", "error", 4000);
      }
    } catch (error) {
      console.error("Vote error:", error);
      showToast("BŁĄD PODCZAS GŁOSOWANIA", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetVote = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await api.delete(`/votes/${songId}`);
      setVote(null);
      showToast("GŁOS ZRESETOWANY", "info");
    } catch (error) {
      console.error("Reset vote error:", error);
      showToast("BŁĄD PODCZAS RESETOWANIA", "error");
    } finally {
      setLoading(false);
    }
  };

  const isLarge = size === "large";
  const buttonClasses = isLarge
    ? "btn-cut px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-mono text-xs sm:text-sm md:text-base font-bold transition-all"
    : "btn-cut px-2 sm:px-3 py-1 sm:py-1.5 font-mono text-[9px] sm:text-[10px] font-bold transition-all";
  const containerClasses = isLarge
    ? "flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0"
    : "flex flex-col gap-1 sm:gap-1.5 shrink-0";

  if (hasVoted && vote === "LIKE") {
    return (
      <div className={isLarge ? "flex gap-3" : "flex flex-col gap-2"}>
        <button
          onClick={handleResetVote}
          disabled={loading}
          className={`${buttonClasses} bg-green-500 text-white hover:bg-green-600`}
        >
          ✓ LUBISZ TĄ PIOSENKĘ
        </button>
      </div>
    );
  }

  if (hasVoted && vote === "DISLIKE") {
    return (
      <div className={isLarge ? "flex gap-3" : "flex flex-col gap-2"}>
        <button
          onClick={handleResetVote}
          disabled={loading}
          className={`${buttonClasses} bg-red-500 text-white hover:bg-red-600`}
        >
          ✗ NIE LUBISZ TEGO UTWORU
        </button>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <button
        onClick={() => handleVote("LIKE")}
        disabled={loading}
        className={`${buttonClasses} vote-btn bg-white/10 text-text-secondary border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:bg-green-500 hover:text-white hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all`}
      >
        ↑ LUBIĘ
      </button>
      <button
        onClick={() => handleVote("DISLIKE")}
        disabled={loading}
        className={`${buttonClasses} vote-btn bg-white/10 text-text-secondary border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.4)] hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all`}
      >
        ↓ NIE LUBIĘ
      </button>
    </div>
  );
}
