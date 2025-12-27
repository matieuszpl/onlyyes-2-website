import { useState } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Calendar,
  Sparkles,
  Bug,
  Palette,
  Wrench,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import TextGlitch from "../components/TextGlitch";
import Card from "../components/Card";

const categoryIcons = {
  "Nowe funkcjonalności": Sparkles,
  "Poprawki błędów": Bug,
  "UI/UX": Palette,
  Infrastruktura: Wrench,
};

const categoryColors = {
  "Nowe funkcjonalności": "text-cyan-400",
  "Poprawki błędów": "text-red-400",
  "UI/UX": "text-blue-400",
  Infrastruktura: "text-purple-400",
};

const changelogData = [
  {
    date: "2025-12-27",
    entries: {
      "UI/UX": [
        "Ulepszono wygląd profilu użytkownika i komponentów profilu",
        "Ulepszono wygląd strony odznak",
        "Ulepszono wygląd rankingu użytkowników",
        "Ulepszono wygląd feedu aktywności",
        "Ulepszono wygląd sidebaru i tooltipu użytkownika",
        "Ulepszono wygląd strony harmonogramu",
        "Ulepszono wyświetlanie historii XP i aktywności",
      ],
      "Poprawki błędów": [
        "Naprawiono formatowanie czasu w harmonogramie audycji",
      ],
    },
  },
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

function IssueReportWidget() {
  const { user } = useUser();
  const [issueType, setIssueType] = useState("FEATURE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Tytuł jest wymagany");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post("/issues", {
        issue_type: issueType,
        title: title.trim(),
        description: description.trim() || "",
      });
      setSuccess(true);
      setTitle("");
      setDescription("");
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const message =
        err.response?.data?.detail || "Błąd podczas zgłaszania";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={18} className="text-accent-cyan" />
        <h3 className="font-header text-sm text-accent-cyan uppercase tracking-wider">
          ZGŁOŚ POMYSŁ LUB PROBLEM
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIssueType("FEATURE")}
            className={`flex-1 px-3 py-2 font-mono text-xs font-bold border transition-all ${
              issueType === "FEATURE"
                ? "text-accent-cyan border-accent-cyan bg-[rgba(0,243,255,0.2)]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-accent-cyan"
            }`}
            style={
              issueType === "FEATURE"
                ? {
                    borderColor: "rgba(0, 243, 255, 0.5)",
                  }
                : {}
            }
          >
            <Lightbulb size={14} className="inline mr-2" />
            POMYSŁ
          </button>
          <button
            type="button"
            onClick={() => setIssueType("BUG")}
            className={`flex-1 px-3 py-2 font-mono text-xs font-bold border transition-all ${
              issueType === "BUG"
                ? "text-accent-magenta border-accent-magenta bg-[rgba(255,0,255,0.2)]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-accent-magenta"
            }`}
            style={
              issueType === "BUG"
                ? {
                    borderColor: "rgba(255, 0, 255, 0.5)",
                  }
                : {}
            }
          >
            <Bug size={14} className="inline mr-2" />
            PROBLEM
          </button>
        </div>

        <div>
          <label className="block font-mono text-xs text-white/50 mb-1">
            Tytuł <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Krótki opis pomysłu lub problemu..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className={`w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none ${
              issueType === "FEATURE" ? "focus:border-accent-cyan" : "focus:border-accent-magenta"
            }`}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-white/50 mb-1">
            Opis <span className="text-white/30">(opcjonalny)</span>
          </label>
          <textarea
            placeholder="Szczegółowy opis (opcjonalny)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={2000}
            className={`w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none resize-none ${
              issueType === "FEATURE" ? "focus:border-accent-cyan" : "focus:border-accent-magenta"
            }`}
            disabled={submitting}
          />
        </div>

        {error && (
          <div className="text-red-400 font-mono text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {success && (
          <div className={`font-mono text-xs ${issueType === "FEATURE" ? "text-accent-cyan" : "text-accent-magenta"}`}>
            ✓ Zgłoszenie wysłane!
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className={`flex-1 px-4 py-2 font-mono text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all border shadow-lg ${
              issueType === "FEATURE"
                ? "border-accent-cyan text-accent-cyan bg-[rgba(0,243,255,0.2)]"
                : "border-accent-magenta text-accent-magenta bg-[rgba(255,0,255,0.2)]"
            }`}
            style={
              issueType === "FEATURE"
                ? {
                    boxShadow: "0 10px 15px -3px rgba(0, 243, 255, 0.2), 0 4px 6px -2px rgba(0, 243, 255, 0.2)",
                  }
                : {
                    boxShadow: "0 10px 15px -3px rgba(255, 0, 255, 0.2), 0 4px 6px -2px rgba(255, 0, 255, 0.2)",
                  }
            }
            onMouseEnter={(e) => {
              if (issueType === "FEATURE") {
                e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 243, 255, 0.4), 0 4px 6px -2px rgba(0, 243, 255, 0.4)";
              } else {
                e.target.style.boxShadow = "0 10px 15px -3px rgba(255, 0, 255, 0.4), 0 4px 6px -2px rgba(255, 0, 255, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (issueType === "FEATURE") {
                e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 243, 255, 0.2), 0 4px 6px -2px rgba(0, 243, 255, 0.2)";
              } else {
                e.target.style.boxShadow = "0 10px 15px -3px rgba(255, 0, 255, 0.2), 0 4px 6px -2px rgba(255, 0, 255, 0.2)";
              }
            }}
          >
            {submitting ? "WYSYŁANIE..." : "WYŚLIJ"}
          </button>
        </div>

        {!user && (
          <div className="text-white/40 font-mono text-[10px]">
            Uwaga: Jako gość możesz zgłaszać maksymalnie 1 zgłoszenie na godzinę
          </div>
        )}
      </form>
    </Card>
  );
}

export default function ChangelogPage() {
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

      <div className="flex items-center gap-3 mb-8">
        <GitBranch className="text-primary" size={32} />
        <div>
          <h1 className="font-header text-4xl text-primary uppercase tracking-wider mb-2">
            CHANGELOG
          </h1>
          <p className="font-mono text-sm text-text-secondary">
            Historia aktualizacji projektu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <IssueReportWidget />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {changelogData.map((day, dayIdx) => {
            const categories = Object.keys(day.entries).filter(
              (cat) => day.entries[cat].length > 0
            );
            const totalEntries = Object.values(day.entries).reduce(
              (sum, arr) => sum + arr.length,
              0
            );

            return (
              <Card
                key={day.date}
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: dayIdx * 0.1 }}
                padding="p-6"
              >
                <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                  <Calendar size={20} className="text-cyan-400" />
                  <div>
                    <div className="font-bold text-white text-lg">
                      {formatDate(day.date)}
                    </div>
                    <div className="text-xs text-white/50">
                      {totalEntries} aktualizacji
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {categories.map((category, catIdx) => {
                    const Icon = categoryIcons[category];
                    const entries = day.entries[category];

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon size={16} className={categoryColors[category] || "text-cyan-400"} />}
                          <h3 className={`font-bold text-sm ${categoryColors[category] || "text-cyan-400"}`}>
                            {category}
                          </h3>
                        </div>
                        <div className="space-y-1 pl-6">
                          {entries.map((entry, entryIdx) => (
                            <Card
                              key={entryIdx}
                              padding="p-2"
                              className="text-sm text-white/80"
                            >
                              • {entry}
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
