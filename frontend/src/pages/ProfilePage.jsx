import { useUser } from "../contexts/UserContext";
import { Award, History, Activity } from "lucide-react";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileSettings from "../components/profile/ProfileSettings";
import ProfileOverview from "../components/profile/ProfileOverview";
import XpHistory from "../components/profile/XpHistory";
import ActivityHistory from "../components/profile/ActivityHistory";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
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
          <SectionHeader
            icon={Award}
            title="OSIĄGNIĘCIA"
            className="mb-4"
          />
          <ProfileOverview />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SectionHeader
              icon={History}
              title="HISTORIA XP"
              className="mb-4"
            />
            <XpHistory />
          </div>

          <div>
            <SectionHeader
              icon={Activity}
              title="HISTORIA AKTYWNOŚCI"
              className="mb-4"
            />
            <ActivityHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

