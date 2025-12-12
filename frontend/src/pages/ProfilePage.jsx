import UserProfile from "../components/UserProfile";
import PageHeader from "../components/layout/PageHeader";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader subtitle="Twoja aktywność i statystyki" />
      <UserProfile />
    </div>
  );
}

