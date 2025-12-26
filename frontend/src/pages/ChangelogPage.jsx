import { motion } from "framer-motion";
import {
  GitBranch,
  Calendar,
  Sparkles,
  Bug,
  Palette,
  Wrench,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const categoryIcons = {
  "Nowe funkcjonalności": Sparkles,
  "Poprawki błędów": Bug,
  "UI/UX": Palette,
  Infrastruktura: Wrench,
};

const categoryColors = {
  "Nowe funkcjonalności": "text-accent",
  "Poprawki błędów": "text-red-400",
  "UI/UX": "text-blue-400",
  Infrastruktura: "text-purple-400",
};

const changelogData = [
  {
    date: "2025-12-26",
    entries: {
      "Nowe funkcjonalności": [
        "Dodano system śledzenia XP i ranking użytkowników",
        "Dodano funkcję aktywnych słuchaczy",
        "Dodano komponent feed aktywności",
        "Dodano system odznak i osiągnięć",
        "Dodano powiadomienia o odznakach i awansach rang",
      ],
      "UI/UX": [
        "Ulepszono statystyki użytkowników",
        "Ulepszono komponenty frontendu",
        "Ulepszono tooltip użytkownika",
        "Ulepszono sidebar i nawigację",
        "Ulepszono profil użytkownika",
      ],
      "Poprawki błędów": [
        "Rozszerzono funkcjonalność radia i obsługę połączeń",
      ],
      Infrastruktura: ["Zaktualizowano domenę strony"],
    },
  },
  {
    date: "2025-12-12",
    entries: {
      Infrastruktura: [
        "Dodano początkową strukturę projektu z backendem i frontendem",
      ],
    },
  },
];

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CHANGELOG"
        icon={GitBranch}
        subtitle="Historia aktualizacji projektu"
      />

      <div className="glass-panel p-6 space-y-6">
        {changelogData.map((day, dayIdx) => {
          const categories = Object.keys(day.entries).filter(
            (cat) => day.entries[cat].length > 0
          );
          const totalEntries = Object.values(day.entries).reduce(
            (sum, arr) => sum + arr.length,
            0
          );

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.1 }}
              className="border-b border-border/50 last:border-b-0 pb-6 last:pb-0"
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={20} className="text-primary" />
                <div>
                  <div className="font-header text-lg text-primary uppercase tracking-wider">
                    {formatDate(day.date)}
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
                    {totalEntries} aktualizacji
                  </div>
                </div>
              </div>

              <div className="space-y-4 pl-8">
                {categories.map((category, catIdx) => {
                  const Icon = categoryIcons[category];
                  const entries = day.entries[category];

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIdx * 0.1 + catIdx * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {Icon && (
                          <Icon
                            size={16}
                            className={
                              categoryColors[category] || "text-primary"
                            }
                          />
                        )}
                        <h3
                          className={`font-header text-sm uppercase tracking-wider ${
                            categoryColors[category] || "text-primary"
                          }`}
                        >
                          {category}
                        </h3>
                      </div>
                      <div className="space-y-2 pl-6">
                        {entries.map((entry, entryIdx) => (
                          <motion.div
                            key={entryIdx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay:
                                dayIdx * 0.1 + catIdx * 0.05 + entryIdx * 0.02,
                            }}
                            className="p-3 bg-white/5 border border-white/10 rounded-sm hover:border-primary/30 transition-all"
                          >
                            <div className="font-mono text-sm text-text-primary">
                              • {entry}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
