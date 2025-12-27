import { useUser } from "../../contexts/UserContext";
import { motion } from "framer-motion";
import ProfileBadges from "./ProfileBadges";
import Card from "../Card";

export default function ProfileOverview() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ProfileBadges />
    </div>
  );
}
