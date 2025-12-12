import { useUser } from "../contexts/UserContext";
import { LogOut, LogIn } from "lucide-react";

export default function Navbar() {
  const { user, loading, login, logout } = useUser();

  return (
    <nav className="glass-panel border-b border-white/5 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="font-brand text-base text-primary tracking-wider">ONLY YES</h1>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="font-mono text-xs text-text-secondary">ŁADOWANIE...</div>
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
                <button
                  onClick={logout}
                  className="btn-cut bg-primary/20 hover:bg-primary text-black px-4 py-2 font-mono text-xs font-bold flex items-center gap-2"
                >
                  <LogOut size={14} />
                  WYLOGUJ
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn-cut bg-primary text-black px-4 py-2 font-mono text-xs font-bold flex items-center gap-2"
              >
                <LogIn size={14} />
                ZALOGUJ
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
