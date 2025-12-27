import { TrendingUp } from "lucide-react";
import ChartsArchive from "../components/ChartsArchive";

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <TrendingUp className="text-primary shrink-0" size={56} />
          <div>
            <h1 className="font-header text-4xl text-primary uppercase tracking-wider mb-0.5">
              LISTA PRZEBOJÓW
            </h1>
            <p className="font-mono text-sm text-text-secondary">
              Najpopularniejsze utwory według głosów społeczności
            </p>
          </div>
        </div>
      </div>
      <ChartsArchive />
    </div>
  );
}
