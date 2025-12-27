import { useUser } from "../contexts/UserContext";
import SongRequestForm from "../components/SongRequestForm";
import BulkUploadForm from "../components/BulkUploadForm";
import SuggestionsHistory from "../components/SuggestionsHistory";
import SectionHeader from "../components/SectionHeader";

export default function RequestsPage() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <SectionHeader description="Proponuj utwory do radia" useRouteData size="large" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SongRequestForm />
          <BulkUploadForm />
        </div>
        
        <div className="lg:col-span-1">
          <SuggestionsHistory />
        </div>
      </div>
    </div>
  );
}
