import WorstChartsArchive from "../components/WorstChartsArchive";
import SectionHeader from "../components/SectionHeader";

export default function WorstChartsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="LISTA GNIOTÓW"
        description="Najgorsze utwory według głosów społeczności"
        useRouteData
        size="large"
      />
      <WorstChartsArchive />
    </div>
  );
}

