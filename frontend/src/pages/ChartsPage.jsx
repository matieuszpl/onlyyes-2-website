import ChartsArchive from "../components/ChartsArchive";
import PageHeader from "../components/layout/PageHeader";

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <PageHeader subtitle="Najpopularniejsze utwory według głosów społeczności" />
      <ChartsArchive />
    </div>
  );
}
