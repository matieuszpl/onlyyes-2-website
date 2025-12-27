import { useState, useEffect, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import { useToast } from "./ToastContainer";
import Button from "./Button";
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
  const containerClasses = isLarge
    ? "flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0"
    : "flex flex-col sm:flex-row gap-1 sm:gap-1.5 shrink-0";
  const buttonSize = isLarge ? "lg" : "sm";

  if (hasVoted && vote === "LIKE") {
    return (
      <div className={isLarge ? "flex gap-3" : "flex flex-col gap-2"}>
        <Button
          onClick={handleResetVote}
          disabled={loading}
          variant="green"
          size={buttonSize}
          className="bg-green-500 text-white hover:bg-green-600 hover:text-white"
        >
          ✓ LUBISZ TĄ PIOSENKĘ
        </Button>
      </div>
    );
  }

  if (hasVoted && vote === "DISLIKE") {
    return (
      <div className={isLarge ? "flex gap-3" : "flex flex-col gap-2"}>
        <Button
          onClick={handleResetVote}
          disabled={loading}
          variant="red"
          size={buttonSize}
          className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
        >
          ✗ NIE LUBISZ TEGO UTWORU
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Button
        onClick={() => handleVote("LIKE")}
        disabled={loading}
        variant="green"
        size={buttonSize}
      >
        ↑ LUBIĘ
      </Button>
      <Button
        onClick={() => handleVote("DISLIKE")}
        disabled={loading}
        variant="red"
        size={buttonSize}
      >
        ↓ NIE LUBIĘ
      </Button>
    </div>
  );
}
