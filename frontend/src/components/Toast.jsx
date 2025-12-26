import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-primary",
    warning: "bg-yellow-500",
  }[type] || "bg-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`${bgColor} text-white px-4 py-2 rounded-sm font-mono text-xs font-bold shadow-lg`}
    >
      <div className="whitespace-pre-line">{message}</div>
    </motion.div>
  );
}

