import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRadioEvents } from "../contexts/RadioEventsContext";
import { WifiOff, Radio } from "lucide-react";

export default function ConnectionNotification() {
  const { isConnected } = useRadioEvents();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const timeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (!isOnline) {
      timeoutRef.current = setTimeout(() => {
        setHasError(true);
        setErrorMessage("Brak połączenia z internetem");
      }, 1000);
      return;
    }

    if (!isConnected) {
      timeoutRef.current = setTimeout(() => {
        setHasError(true);
        setErrorMessage("Problem z połączeniem ze stacją radiową");
      }, 2000);
      return;
    }

    if (isOnline && isConnected) {
      hideTimeoutRef.current = setTimeout(() => {
        setHasError(false);
        setErrorMessage("");
      }, 500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isOnline, isConnected]);

  return (
    <AnimatePresence>
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="border border-red-500/50 px-4 py-3 rounded-sm shadow-lg flex items-center gap-3 min-w-[280px]">
            {!isOnline ? (
              <WifiOff size={18} className="text-red-400 shrink-0" />
            ) : (
              <Radio size={18} className="text-red-400 shrink-0" />
            )}
            <span className="font-mono text-xs text-text-primary">
              {errorMessage}
            </span>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
