import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { Music, Clock, Trophy, Star, Award } from "lucide-react";
import api from "../api";
import UserTooltip from "../components/UserTooltip";
import TextGlitch from "../components/TextGlitch";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";

function XPProgressBar({ progress, nextRankXp }) {
  if (!nextRankXp) {
    return (
      <div className="w-full bg-white/10 rounded-full h-2">
        <div className="bg-cyan-400 h-2 rounded-full" style={{ width: "100%" }} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div
        className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadLeaderboard();
  }, [user, navigate]);

  const loadLeaderboard = async () => {
    try {
      const res = await api.get("/leaderboard?limit=100");
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Load leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const ranks = [
    { name: "Szumofon", min_xp: 0 },
    { name: "Koneser Bitów", min_xp: 500 },
    { name: "DJ Winamp", min_xp: 1500 },
    { name: "Kierownik Imprezy", min_xp: 5000 },
    { name: "Dyrektor Programowy", min_xp: 10000 },
    { name: "Mistrz Anteny", min_xp: 25000 },
    { name: "Szef Programu", min_xp: 50000 },
    { name: "Dyrektor Generalny", min_xp: 100000 },
    { name: "Właściciel Fali", min_xp: 250000 },
    { name: "Legenda Radia", min_xp: 500000 },
  ];

  const getRankProgress = (rank, userXp) => {
    if (!userXp) return 0;
    
    // Jeśli użytkownik już osiągnął tę rangę
    if (userXp >= rank.min_xp) {
      return 100;
    }

    // Znajdź poprzednią rangę
    const currentRankIndex = ranks.findIndex(r => r.min_xp === rank.min_xp);
    if (currentRankIndex <= 0) {
      // To pierwsza ranga, pokaż postęp od 0
      const neededXp = rank.min_xp;
      return neededXp > 0 ? Math.min(100, (userXp / neededXp) * 100) : 0;
    }

    const previousRank = ranks[currentRankIndex - 1];
    
    // Oblicz postęp od poprzedniej rangi do obecnej
    // Jeśli użytkownik nie osiągnął jeszcze poprzedniej rangi, pokaż postęp od 0 do tej rangi
    if (userXp < previousRank.min_xp) {
      const neededXp = rank.min_xp;
      return neededXp > 0 ? Math.min(100, (userXp / neededXp) * 100) : 0;
    }
    
    // Użytkownik osiągnął poprzednią rangę, oblicz postęp od poprzedniej do obecnej
    const startXp = previousRank.min_xp;
    const currentXp = userXp - startXp;
    const neededXp = rank.min_xp - startXp;

    if (neededXp <= 0) return 0;
    
    return Math.min(100, Math.max(0, (currentXp / neededXp) * 100));
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
        <Card padding="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <Card
                key={idx}
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-8 w-12 bg-white/20 rounded"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                    className="h-12 w-12 bg-white/10 rounded-full"
                  />
                  <div className="flex-1 space-y-2">
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.1,
                      }}
                      className="h-4 bg-white/20 rounded w-32"
                    />
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.15,
                      }}
                      className="h-2 bg-white/10 rounded w-24"
                    />
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.2,
                      }}
                      className="h-2 bg-white/10 rounded-full w-full"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const renderRankCard = () => {
    const userXp = user?.xp || 0;
    
    return (
      <div className="space-y-3">
        {ranks.map((rank) => {
          const progress = getRankProgress(rank, userXp);
          return (
            <div key={rank.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white font-bold">{rank.name}</div>
                <div className="text-[10px] text-white/40">
                  {rank.min_xp === 0
                    ? "Start"
                    : `${rank.min_xp.toLocaleString()} XP`}
                </div>
              </div>
              <div className="w-full h-1 bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-cyan-400"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSplitScreen = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card padding="p-6">
          <div className="text-xs text-white/40 mb-4 uppercase">Jak zdobywać XP?</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Music size={16} className="text-cyan-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-white/50">Głosowanie</div>
                <div className="text-sm font-bold text-cyan-400">+10 XP</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-cyan-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-white/50">Czas słuchania</div>
                <div className="text-sm font-bold text-cyan-400">+1 XP/min</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award size={16} className="text-cyan-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-white/50">Osiągnięcia</div>
                <div className="text-sm font-bold text-cyan-400">Różne nagrody</div>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="p-6">
          <div className="text-xs text-white/40 mb-4 uppercase">Rangi</div>
          {renderRankCard()}
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-3">
        {leaderboard.map((entry, idx) => {
          const isCurrentUser = user && entry.id === user.id;
          const isTopOne = entry.rank === 1;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              className={`p-4 border transition-all ${
                isTopOne
                  ? "bg-gradient-to-r from-cyan-400/20 to-cyan-400/10 border-cyan-400"
                  : isCurrentUser
                  ? "bg-cyan-400/10 border-cyan-400/50"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-xl font-bold font-mono w-10 text-center ${
                  isTopOne ? "text-cyan-400" : "text-white"
                }`}>
                  {isTopOne ? <Trophy size={20} className="text-cyan-400" /> : `#${entry.rank}`}
                </div>
                {entry.avatar_url && (
                  <img
                    src={entry.avatar_url}
                    alt={entry.username}
                    className={`rounded-full ${
                      isTopOne ? "w-14 h-14 border-2 border-cyan-400" : "w-12 h-12"
                    }`}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserTooltip userId={entry.id} username={entry.username}>
                      <span className={`font-bold ${isTopOne ? "text-cyan-400 text-lg" : "text-white"}`}>
                        {entry.username}
                      </span>
                    </UserTooltip>
                    {isTopOne && <Star size={14} className="text-cyan-400 fill-cyan-400" />}
                    {isCurrentUser && !isTopOne && (
                      <span className="text-xs px-2 py-0.5 bg-cyan-400 text-black rounded">TY</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 mb-2">{entry.rank_name}</div>
                  <XPProgressBar progress={entry.progress} nextRankXp={entry.next_rank_xp} />
                  <div className="text-xs text-white/40 mt-1 flex justify-between">
                    <span>{entry.xp} XP</span>
                    {entry.next_rank && (
                      <span>{entry.next_rank_xp - entry.xp} XP do {entry.next_rank}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={Trophy}
        title="RANKING"
        description="Top użytkownicy według zdobytego XP"
        useRouteData
        size="large"
      />

      {renderSplitScreen()}
    </div>
  );
}
