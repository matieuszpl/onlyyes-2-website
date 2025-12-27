import { useUser } from "../contexts/UserContext";
import { Award, History, Activity } from "lucide-react";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileSettings from "../components/profile/ProfileSettings";
import ProfileOverview from "../components/profile/ProfileOverview";
import XpHistory from "../components/profile/XpHistory";
import ActivityHistory from "../components/profile/ActivityHistory";
import Card from "../components/Card";
import "../styles/profileDesigns.css";

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="font-mono text-sm text-text-secondary">
            ZALOGUJ SIĘ, ABY ZOBACZYĆ PROFIL
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-profile-design="1">
      <ProfileHeader />

      <div className="space-y-8">
        <ProfileSettings />

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Award size={20} className="text-primary" />
            <h2 className="font-header text-lg text-primary uppercase tracking-wider">
              OSIĄGNIĘCIA
            </h2>
          </div>
          <ProfileOverview />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <History size={20} className="text-primary" />
              <h2 className="font-header text-lg text-primary uppercase tracking-wider">
                HISTORIA XP
              </h2>
            </div>
            <XpHistory />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Activity size={20} className="text-primary" />
              <h2 className="font-header text-lg text-primary uppercase tracking-wider">
                HISTORIA AKTYWNOŚCI
              </h2>
            </div>
            <ActivityHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

