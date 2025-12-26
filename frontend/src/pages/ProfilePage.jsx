import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import PageHeader from "../components/layout/PageHeader";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileOverview from "../components/profile/ProfileOverview";
import XpHistory from "../components/profile/XpHistory";
import ActivityHistory from "../components/profile/ActivityHistory";

export default function ProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-4">
          <p className="font-mono text-sm text-text-secondary">
            ZALOGUJ SIĘ, ABY ZOBACZYĆ PROFIL
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Twoja aktywność i statystyki" />
      <ProfileHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "overview" && <ProfileOverview />}
      {activeTab === "xp-history" && <XpHistory />}
      {activeTab === "activity" && <ActivityHistory />}
    </div>
  );
}

