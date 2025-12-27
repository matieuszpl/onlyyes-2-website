import { useState } from "react";
import { cn } from "../utils/cn";

const COLOR_VARIANTS = {
  cyan: {
    border: "border-accent-cyan",
    text: "text-accent-cyan",
    bg: "bg-[rgba(0,243,255,0.2)]",
    hoverBg: "hover:bg-[rgba(0,243,255,0.4)]",
    hoverText: "hover:text-accent-cyan",
    shadow: "0 10px 15px -3px rgba(0, 243, 255, 0.2), 0 4px 6px -2px rgba(0, 243, 255, 0.2)",
    shadowHover: "0 10px 15px -3px rgba(0, 243, 255, 0.4), 0 4px 6px -2px rgba(0, 243, 255, 0.4)",
    borderColor: "rgba(0, 243, 255, 0.5)",
    hoverBorderColor: "rgba(0, 243, 255, 0.8)",
  },
  magenta: {
    border: "border-accent-magenta",
    text: "text-accent-magenta",
    bg: "bg-[rgba(255,0,255,0.2)]",
    hoverBg: "hover:bg-[rgba(255,0,255,0.4)]",
    hoverText: "hover:text-accent-magenta",
    shadow: "0 10px 15px -3px rgba(255, 0, 255, 0.2), 0 4px 6px -2px rgba(255, 0, 255, 0.2)",
    shadowHover: "0 10px 15px -3px rgba(255, 0, 255, 0.4), 0 4px 6px -2px rgba(255, 0, 255, 0.4)",
    borderColor: "rgba(255, 0, 255, 0.5)",
    hoverBorderColor: "rgba(255, 0, 255, 0.8)",
  },
  green: {
    border: "border-green-500",
    text: "text-green-500",
    bg: "bg-[rgba(34,197,94,0.2)]",
    hoverBg: "hover:bg-[rgba(34,197,94,0.4)]",
    hoverText: "hover:text-green-500",
    shadow: "0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -2px rgba(34, 197, 94, 0.2)",
    shadowHover: "0 10px 15px -3px rgba(34, 197, 94, 0.4), 0 4px 6px -2px rgba(34, 197, 94, 0.4)",
    borderColor: "rgba(34, 197, 94, 0.5)",
    hoverBorderColor: "rgba(34, 197, 94, 0.8)",
  },
  red: {
    border: "border-red-500",
    text: "text-red-500",
    bg: "bg-[rgba(239,68,68,0.2)]",
    hoverBg: "hover:bg-[rgba(239,68,68,0.4)]",
    hoverText: "hover:text-red-500",
    shadow: "0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.2)",
    shadowHover: "0 10px 15px -3px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(239, 68, 68, 0.4)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    hoverBorderColor: "rgba(239, 68, 68, 0.8)",
  },
  primary: {
    border: "border-primary",
    text: "text-primary",
    bg: "bg-[rgba(var(--primary-rgb),0.2)]",
    hoverBg: "hover:bg-primary",
    hoverText: "hover:text-black",
    shadow: "0 10px 15px -3px rgba(var(--primary-rgb), 0.2), 0 4px 6px -2px rgba(var(--primary-rgb), 0.2)",
    shadowHover: "0 10px 15px -3px rgba(var(--primary-rgb), 0.4), 0 4px 6px -2px rgba(var(--primary-rgb), 0.4)",
    borderColor: "rgba(var(--primary-rgb), 0.5)",
    hoverBorderColor: "rgba(var(--primary-rgb), 0.8)",
  },
  default: {
    border: "border-white/10",
    text: "text-text-secondary",
    bg: "bg-white/5",
    hoverBg: "hover:bg-white/10",
    hoverText: "hover:text-text-primary",
    shadow: "0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.1)",
    shadowHover: "0 10px 15px -3px rgba(255, 255, 255, 0.2), 0 4px 6px -2px rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    hoverBorderColor: "rgba(255, 255, 255, 0.4)",
  },
};

const SIZE_VARIANTS = {
  sm: "px-3 py-1.5 text-[10px]",
  md: "px-4 py-2 text-xs",
  lg: "px-6 py-3 text-sm",
  xl: "px-8 py-4 text-base",
};

export default function Button({
  children,
  variant = "cyan",
  size = "md",
  disabled = false,
  className = "",
  onClick,
  type = "button",
  fullWidth = false,
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);
  const colorVariant = COLOR_VARIANTS[variant] || COLOR_VARIANTS.cyan;
  const sizeClasses = SIZE_VARIANTS[size] || SIZE_VARIANTS.md;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-variant={variant}
      className={cn(
        "btn-cut button-component font-mono font-bold transition-all border shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
        colorVariant.border,
        colorVariant.text,
        colorVariant.bg,
        colorVariant.hoverBg,
        colorVariant.hoverText,
        sizeClasses,
        fullWidth && "w-full",
        className
      )}
      style={{
        borderColor: isHovered && !disabled ? colorVariant.hoverBorderColor : colorVariant.borderColor,
        boxShadow: isHovered && !disabled ? colorVariant.shadowHover : colorVariant.shadow,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

