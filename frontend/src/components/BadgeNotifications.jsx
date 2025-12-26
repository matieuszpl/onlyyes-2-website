import { useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useToast } from "./ToastContainer";

export default function BadgeNotifications() {
  const { setOnBadgeAwarded, setOnRankUp } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    setOnBadgeAwarded((badge) => {
      showToast(
        `🏆 NOWE OSIĄGNIĘCIE: ${badge.name}\nMożesz je wyróżnić w profilu!`,
        "success",
        5000
      );
    });

    setOnRankUp((rankName) => {
      showToast(
        `⭐ AWANS NA RANGĘ: ${rankName}`,
        "success",
        5000
      );
    });
  }, [setOnBadgeAwarded, setOnRankUp, showToast]);

  return null;
}

