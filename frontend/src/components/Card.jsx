import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export default function Card({
  children,
  className,
  padding = "p-4",
  onClick,
  as: Component,
  ...props
}) {
  const baseClasses = "bg-white/5 border border-white/10";
  
  // Clean className to remove rounded, hover, transition
  const cleanedClassName = className
    ? className
        .split(" ")
        .filter(
          (cls) =>
            !cls.startsWith("rounded") &&
            !cls.startsWith("hover:") &&
            !cls.startsWith("transition")
        )
        .join(" ")
    : "";
  
  const classes = cn(baseClasses, padding, cleanedClassName);

  if (onClick) {
    return (
      <motion.div
        className={classes}
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  if (Component === motion.div || Component?.displayName === "motion.div") {
    return (
      <motion.div className={classes} {...props}>
        {children}
      </motion.div>
    );
  }

  const FinalComponent = Component || "div";
  return (
    <FinalComponent className={classes} {...props}>
      {children}
    </FinalComponent>
  );
}

