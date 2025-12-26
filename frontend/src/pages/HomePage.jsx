import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import { motion } from "framer-motion";
import HeroPlayer from "../components/player/HeroPlayer";
import SongHistory from "../components/SongHistory";
import ScheduledShows from "../components/ScheduledShows";
import ActivityFeed from "../components/ActivityFeed";
import TimeDisplay from "../components/TimeDisplay";
import TextGlitch from "../components/TextGlitch";
import TopCharts from "../components/TopCharts";
import WorstChartsPreview from "../components/WorstChartsPreview";
import { Home } from "lucide-react";

export default function HomePage() {
  const { user } = useUser();
  const { nowPlaying } = useGlobalAudio();
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const handleTestAnimations = () => {
      setAnimKey((prev) => prev + 1);
    };
    window.addEventListener("testAnimations", handleTestAnimations);
    return () => {
      window.removeEventListener("testAnimations", handleTestAnimations);
    };
  }, []);

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Brand Header with Glitch */}
      <motion.div
        key={`header-${animKey}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center my-6 sm:my-8 md:my-12"
      >
        <div className="font-brand text-2xl sm:text-3xl md:text-4xl lg:text-6xl text-primary tracking-wider">
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
        <div className="flex items-center gap-2 mt-2 sm:mt-3 md:mt-4">
          <Home className="text-primary" size={16} />
          <h3 className="font-mono text-xs sm:text-sm text-text-secondary">
            RADIO INTERNETOWE
          </h3>
        </div>
      </motion.div>

      {/* Main Content - 2/3 + 1/3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left Column - Now Playing + Next Song (2/3) */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <motion.div
            key={`hero-${animKey}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HeroPlayer />
          </motion.div>
          {/* History and Charts side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <motion.div
              key={`history-${animKey}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SongHistory />
            </motion.div>
            <div className="space-y-4">
              <motion.div
                key={`top-charts-${animKey}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TopCharts limit={10} />
              </motion.div>
              <motion.div
                key={`worst-charts-${animKey}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <WorstChartsPreview limit={10} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Column - Time + Shows + Activity + Stats (1/3) */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <motion.div
            key={`time-${animKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TimeDisplay />
          </motion.div>
          <motion.div
            key={`shows-${animKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ScheduledShows />
          </motion.div>
          <motion.div
            key={`activity-${animKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ActivityFeed />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
