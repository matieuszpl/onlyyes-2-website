import { useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import DockedPlayer from "../player/DockedPlayer";

export default function LayoutManager({ children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isKiosk = searchParams.get("mode") === "kiosk";
  const isHome = location.pathname === "/";

  if (isKiosk) {
    return <div className="h-screen overflow-hidden">{children}</div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:ml-56 pb-32 md:pb-24 w-full max-w-full overflow-x-hidden">
        <AnimatePresence key={location.pathname}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-full px-2 sm:px-3 md:px-6 lg:px-8 py-3 sm:py-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        {!isHome && (
          <AnimatePresence>
            <DockedPlayer key="docked-player" />
          </AnimatePresence>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
