import WorstChartsArchive from "../components/WorstChartsArchive";
import PageHeader from "../components/layout/PageHeader";

export default function WorstChartsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="LISTA GNIOTÓW"
        subtitle="Najgorsze utwory według głosów społeczności"
      />
      <WorstChartsArchive />
    </div>
  );
}

