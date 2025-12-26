import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, TrendingUp, Award, Star } from "lucide-react";
import api from "../api";
import { getIconComponent } from "../utils/badgeIcons";

export default function UserTooltip({
  userId,
  username,
  children,
  delay = 500,
}) {
  const [show, setShow] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    };

    const handleScroll = () => {
      if (show) {
        updatePosition();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [show]);

  const handleMouseEnter = () => {
    if (!userId) return;
    updatePosition();
    timeoutRef.current = setTimeout(() => {
      setShow(true);
      updatePosition();
      if (!userData && !loading) {
        loadUserData();
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShow(false);
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}/stats`);
      setUserData(res.data);
    } catch (error) {
      console.error("Load user data error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <>{children}</>;
  }

  const xpProgress = userData?.rank?.next_rank_xp
    ? ((userData.xp - (userData.rank.current_rank_xp || 0)) /
        (userData.rank.next_rank_xp - (userData.rank.current_rank_xp || 0))) *
      100
    : 0;

  const tooltipContent = show ? (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed z-9999 pointer-events-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translate(-50%, -100%)",
            marginBottom: "12px",
            minWidth: "280px",
            maxWidth: "320px",
          }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="glass-panel border border-primary/30 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded w-full animate-pulse" />
              </div>
            ) : userData ? (
              <div className="relative">
                {/* Header with avatar and gradient */}
                <div
                  className="relative p-4 pb-6"
                  style={{
                    background: userData.featured_badge?.color
                      ? `linear-gradient(135deg, ${userData.featured_badge.color}15 0%, transparent 100%)`
                      : "linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, transparent 100%)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {userData.avatar_url ? (
                        <img
                          src={userData.avatar_url}
                          alt={userData.username}
                          className="w-16 h-16 border-2 rounded-full object-cover shadow-lg"
                          style={{
                            borderColor:
                              userData.featured_badge?.color ||
                              "var(--primary)",
                          }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 border-2 rounded-full bg-white/5 flex items-center justify-center shadow-lg"
                          style={{
                            borderColor:
                              userData.featured_badge?.color ||
                              "var(--primary)",
                          }}
                        >
                          <UserPlus size={24} className="text-text-secondary" />
                        </div>
                      )}
                      {/* Featured badge indicator */}
                      {userData.featured_badge && (
                        <div
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg"
                          style={{
                            backgroundColor:
                              userData.featured_badge.color || "var(--primary)",
                          }}
                        >
                          {(() => {
                            const IconComponent = getIconComponent(
                              userData.featured_badge.icon
                            );
                            return (
                              <IconComponent
                                size={12}
                                className="text-black"
                                strokeWidth={2.5}
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="font-header text-base text-primary font-bold truncate mb-1">
                        {userData.username}
                      </div>
                      {userData.rank && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-mono text-xs text-primary bg-primary/20 px-2 py-0.5 rounded border border-primary/30">
                            {userData.rank.name}
                          </div>
                        </div>
                      )}
                      {userData.featured_badge && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="p-1 rounded border"
                            style={{
                              backgroundColor: `${userData.featured_badge.color}20`,
                              borderColor: `${userData.featured_badge.color}50`,
                            }}
                          >
                            {(() => {
                              const IconComponent = getIconComponent(
                                userData.featured_badge.icon
                              );
                              return (
                                <IconComponent
                                  size={12}
                                  style={{
                                    color:
                                      userData.featured_badge.color ||
                                      "#ffffff",
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <span className="font-mono text-[10px] text-text-secondary truncate">
                            {userData.featured_badge.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* XP Progress */}
                {userData.rank && (
                  <div className="px-4 pb-3 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-accent-cyan" />
                        <span className="font-mono text-xs text-accent-cyan font-bold">
                          {userData.xp} XP
                        </span>
                      </div>
                      {userData.rank.next_rank && (
                        <span className="font-mono text-[9px] text-text-secondary">
                          {userData.rank.next_rank_xp - userData.xp} do{" "}
                          {userData.rank.next_rank}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(to right, var(--primary), var(--accent-cyan))",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-white/5 rounded border border-white/10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award size={10} className="text-text-secondary" />
                        <div className="font-mono text-[9px] text-text-secondary uppercase">
                          REP
                        </div>
                      </div>
                      <div className="font-header text-lg text-primary font-bold">
                        {userData.reputation_score}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded border border-white/10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star size={10} className="text-text-secondary" />
                        <div className="font-mono text-[9px] text-text-secondary uppercase">
                          GŁOSY
                        </div>
                      </div>
                      <div className="font-header text-lg text-primary font-bold">
                        {userData.votes_count}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded border border-white/10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp size={10} className="text-text-secondary" />
                        <div className="font-mono text-[9px] text-text-secondary uppercase">
                          PROP
                        </div>
                      </div>
                      <div className="font-header text-lg text-primary font-bold">
                        {userData.suggestions_count}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="font-mono text-xs text-text-secondary text-center">
                  Błąd ładowania
                </div>
              </div>
            )}
          </div>
          {/* Arrow pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div
              className="w-3 h-3 border-r border-b rotate-45"
              style={{
                backgroundColor: "var(--bg-panel)",
                borderColor: "rgba(0, 243, 255, 0.3)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {typeof document !== "undefined" &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}
