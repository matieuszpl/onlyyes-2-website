import { createContext, useContext, useState, useEffect } from "react";
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
        setUser(res.data);
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
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

  return (
    <UserContext.Provider
      value={{ user, loading, login, logout, checkUser, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
