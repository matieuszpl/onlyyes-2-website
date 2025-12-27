import ChartsArchive from "../components/ChartsArchive";
import SectionHeader from "../components/SectionHeader";

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader useRouteData size="large" />
      <ChartsArchive />
    </div>
  );
}
