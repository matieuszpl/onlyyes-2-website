import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevRankRef = useRef(null);
  const prevBadgesRef = useRef([]);
  const onBadgeAwardedRef = useRef(null);
  const onRankUpRef = useRef(null);

  const checkUser = async () => {
    try {
      const res = await api.get("/users/me");
      if (res.data.is_logged_in) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await api.get("/users/me");
      if (res.data.is_logged_in) {
        const newUser = res.data;

        if (
          prevRankRef.current &&
          newUser.rank &&
          prevRankRef.current.name !== newUser.rank.name
        ) {
          if (onRankUpRef.current) {
            onRankUpRef.current(newUser.rank.name);
          }
        }
        prevRankRef.current = newUser.rank;

        if (newUser.is_logged_in) {
          try {
            const badgesRes = await api.get("/users/me/badges");
            const newBadges = badgesRes.data || [];
            const prevBadges = prevBadgesRef.current || [];

            if (prevBadges.length > 0) {
              const newBadgeIds = newBadges.map((b) => b.id);
              const prevBadgeIds = prevBadges.map((b) => b.id);
              const awardedBadges = newBadges.filter(
                (b) => !prevBadgeIds.includes(b.id)
              );

              if (awardedBadges.length > 0 && onBadgeAwardedRef.current) {
                awardedBadges.forEach((badge) => {
                  onBadgeAwardedRef.current(badge);
                });
              }
            }
            prevBadgesRef.current = newBadges;
          } catch (badgeError) {
            if (
              badgeError.response?.status === 401 ||
              badgeError.response?.status === 422
            ) {
              prevBadgesRef.current = [];
            } else {
              console.error("Error loading badges:", badgeError);
            }
          }
        } else {
          prevBadgesRef.current = [];
        }

        setUser(newUser);
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const setOnBadgeAwarded = (callback) => {
    onBadgeAwardedRef.current = callback;
  };

  const setOnRankUp = (callback) => {
    onRankUpRef.current = callback;
  };

  useEffect(() => {
    checkUser();
    const interval = setInterval(checkUser, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = async () => {
    try {
      await api.get("/auth/logout");
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (user && user.rank) {
      prevRankRef.current = user.rank;
    }
    if (user && user.is_logged_in) {
      api
        .get("/users/me/badges")
        .then((res) => {
          prevBadgesRef.current = res.data || [];
        })
        .catch((error) => {
          if (
            error.response?.status === 401 ||
            error.response?.status === 422
          ) {
            prevBadgesRef.current = [];
          } else if (
            error.response?.status !== 401 &&
            error.response?.status !== 422
          ) {
            console.error("Error loading badges:", error);
          }
        });
    } else {
      prevBadgesRef.current = [];
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkUser,
        refreshUser,
        setOnBadgeAwarded,
        setOnRankUp,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
