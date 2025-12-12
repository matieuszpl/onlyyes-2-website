import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export default function StatsCard({ icon: Icon, label, value, accent = "primary" }) {
  const accentClass = accent === "magenta" 
    ? "text-accent-magenta" 
    : accent === "cyan" 
    ? "text-accent-cyan" 
    : "text-primary";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="glass-panel p-3 interactive-card"
    >

      <div className="flex items-center gap-2">
        {Icon && (
          <div className={accentClass}>
            <Icon size={18} />
          </div>
        )}
        <div className="flex-1">
          <div className="font-mono text-[10px] text-text-secondary mb-0.5">{label}</div>
          <div className={cn("font-header text-base font-bold", accentClass)}>
            {value}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

