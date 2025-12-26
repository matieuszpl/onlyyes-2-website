import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import api from "../api";

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

  const tooltipContent = show ? (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translate(-50%, -100%)",
            marginBottom: "8px",
            minWidth: "200px",
          }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="glass-panel p-3 border border-primary/50 shadow-lg">
            {loading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
                </div>
                <div className="h-2 bg-white/10 rounded w-full animate-pulse" />
              </div>
            ) : userData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {userData.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt={userData.username}
                      className="w-8 h-8 border border-primary/50 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 border border-primary/50 rounded-full bg-white/5 flex items-center justify-center">
                      <UserPlus size={14} className="text-text-secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-primary font-bold truncate">
                      {userData.username}
                    </div>
                    {userData.is_admin && (
                      <div className="font-mono text-[9px] text-primary bg-primary/20 px-1.5 py-0.5 rounded inline-block">
                        ADMIN
                      </div>
                    )}
                  </div>
                </div>
                {userData.rank && (
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-text-secondary">
                      {userData.rank.name}
                    </div>
                    <div className="w-full bg-bg-secondary/20 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-1.5 rounded-full transition-all"
                        style={{ width: `${userData.rank.progress}%` }}
                      />
                    </div>
                    <div className="font-mono text-[9px] text-text-secondary">
                      {userData.xp} XP
                      {userData.rank.next_rank && (
                        <span className="ml-1">
                          • {userData.rank.next_rank_xp - userData.xp} do{" "}
                          {userData.rank.next_rank}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
                  <div className="text-center">
                    <div className="font-mono text-[10px] text-text-secondary">
                      REP
                    </div>
                    <div className="font-mono text-xs text-primary font-bold">
                      {userData.reputation_score}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-[10px] text-text-secondary">
                      GŁOSY
                    </div>
                    <div className="font-mono text-xs text-primary font-bold">
                      {userData.votes_count}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-[10px] text-text-secondary">
                      PROP
                    </div>
                    <div className="font-mono text-xs text-primary font-bold">
                      {userData.suggestions_count}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="font-mono text-[10px] text-text-secondary">
                Błąd ładowania
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-primary/50 border-r border-b border-primary/50 rotate-45" />
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
