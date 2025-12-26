import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import api from "../../api";
import { Star } from "lucide-react";
import { getIconComponent } from "../../utils/badgeIcons";

export default function ProfileBadges() {
  const { user } = useUser();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = async () => {
    try {
      const res = await api.get("/users/me/badges");
      setBadges(res.data);
    } catch (error) {
      console.error("Load badges error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeature = async (badgeId) => {
    try {
      const currentFeatured = badges.find((b) => b.is_featured);
      const newFeaturedId = currentFeatured?.id === badgeId ? null : badgeId;
      await api.put("/users/me/badges/feature", { badge_id: newFeaturedId });
      await loadBadges();
    } catch (error) {
      console.error("Feature badge error:", error);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <h4 className="font-header text-sm text-primary uppercase tracking-wider mb-4">
          OSIĄGNIĘCIA
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 p-4 text-center"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.1,
                }}
                className="h-12 w-12 bg-white/20 rounded-full mx-auto mb-2"
              />
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.15,
                }}
                className="h-3 bg-white/10 rounded w-16 mx-auto"
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <h4 className="font-header text-sm text-primary uppercase tracking-wider">
        ODZNAKI
      </h4>
      {badges.length === 0 ? (
        <p className="font-mono text-sm text-text-secondary">BRAK OSIĄGNIĘĆ</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative bg-white/5 border p-4 text-center rounded-sm cursor-pointer transition-all hover:border-primary/50 ${
                badge.is_featured
                  ? "border-primary border-2"
                  : "border-white/10"
              }`}
              onClick={() => handleFeature(badge.id)}
            >
              {badge.is_featured && (
                <div className="absolute top-1 right-1">
                  <Star size={16} className="text-primary fill-primary" />
                </div>
              )}
              <div
                className="mb-2 flex items-center justify-center"
                style={{ color: badge.color || "#ffffff" }}
              >
                {(() => {
                  const IconComponent = getIconComponent(badge.icon);
                  return <IconComponent size={32} />;
                })()}
              </div>
              <div className="font-mono text-xs text-text-primary font-bold mb-1">
                {badge.name}
              </div>
              {badge.description && (
                <div className="font-mono text-[10px] text-text-secondary line-clamp-2">
                  {badge.description}
                </div>
              )}
              {badge.awarded_at && (
                <div className="font-mono text-[9px] text-text-secondary mt-2">
                  {new Date(badge.awarded_at).toLocaleDateString("pl-PL")}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      {badges.length > 0 && (
        <p className="font-mono text-[10px] text-text-secondary">
          Kliknij osiągnięcie, aby wyróżnić
        </p>
      )}
    </div>
  );
}
