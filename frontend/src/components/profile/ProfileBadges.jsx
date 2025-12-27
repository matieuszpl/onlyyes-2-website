import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import api from "../../api";
import { getIconComponent } from "../../utils/badgeIcons";
import Card from "../Card";

export default function ProfileBadges() {
  const { user, refreshUser } = useUser();
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
      await refreshUser();
    } catch (error) {
      console.error("Feature badge error:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              as={motion.div}
              className="text-center"
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
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      {badges.length > 0 && (
        <p className="font-mono text-[10px] text-text-secondary">
          Wybierz osiągnięcie które chcesz wyróżnić w swoim profilu oraz
          zastosować jego styl
        </p>
      )}
      {badges.length === 0 ? (
        <p className="font-mono text-sm text-text-secondary">BRAK OSIĄGNIĘĆ</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge, idx) => {
            const badgeColor = badge.color || "var(--primary)";
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative border p-4 text-left rounded-sm cursor-pointer transition-all overflow-hidden"
                style={{
                  borderColor: `${badgeColor}60`,
                  borderWidth: badge.is_featured ? "2px" : "1px",
                  background: `linear-gradient(135deg, ${badgeColor}25 0%, ${badgeColor}10 50%, transparent 100%)`,
                }}
                onClick={() => handleFeature(badge.id)}
              >
                {badge.is_featured && (
                  <div
                    className="absolute top-2 right-2 px-2 py-1 rounded border font-mono text-xs font-bold uppercase"
                    style={{
                      color: badgeColor,
                      backgroundColor: `${badgeColor}20`,
                      borderColor: `${badgeColor}60`,
                    }}
                  >
                    WYBRANE
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded border shrink-0"
                    style={{
                      backgroundColor: `${badgeColor}25`,
                      borderColor: `${badgeColor}50`,
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(badge.icon);
                      return (
                        <IconComponent
                          size={24}
                          style={{
                            color: badgeColor,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono text-sm font-bold truncate mb-0.5"
                      style={{
                        color: badgeColor,
                      }}
                    >
                      {badge.name}
                    </div>
                    {badge.description && (
                      <div className="font-mono text-[9px] text-text-secondary line-clamp-1">
                        {badge.description}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
