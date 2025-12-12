import { useUser } from "../contexts/UserContext";
import SongRequestForm from "../components/SongRequestForm";
import PageHeader from "../components/layout/PageHeader";

export default function RequestsPage() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Proponuj utwory do radia" />
      <SongRequestForm />
    </div>
  );
}
