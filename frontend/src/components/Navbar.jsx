import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { LogOut, LogIn } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

export default function Navbar() {
  const { user, loading, login, logout } = useUser();

  return (
    <Card as="nav" className="border-b border-white/5 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="font-brand text-base text-primary tracking-wider">ONLY YES</h1>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                  className="w-8 h-8 bg-white/10 rounded border border-primary"
                />
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.1,
                  }}
                  className="h-4 bg-white/20 rounded w-20"
                />
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 border border-primary"
                    />
                  )}
                  <span className="font-mono text-sm text-text-primary">{user.username}</span>
                </div>
                <Button
                  onClick={logout}
                  variant="default"
                  size="sm"
                  className="bg-primary/20 hover:bg-primary text-black flex items-center gap-2"
                >
                  <LogOut size={14} />
                  WYLOGUJ
                </Button>
              </div>
            ) : (
              <Button
                onClick={login}
                variant="primary"
                size="sm"
                className="bg-primary text-black flex items-center gap-2"
              >
                <LogIn size={14} />
                ZALOGUJ
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
