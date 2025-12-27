export default function CardHeader({
  icon: Icon,
  title,
  description,
  actions,
  iconGradient,
  iconColor,
  className = "",
}) {
  const defaultGradient = "linear-gradient(135deg, rgba(0, 243, 255, 0.60) 0%, rgba(0, 243, 255, 0.35) 50%, transparent 100%)";
  const defaultColor = "rgba(0, 243, 255, 1)";
  const gradient = iconGradient || defaultGradient;
  const color = iconColor || defaultColor;
  
  return (
    <div className={`flex items-stretch justify-between ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div 
            className="flex items-center justify-center shrink-0 self-stretch relative"
            style={{
              background: gradient,
              border: `1px solid ${color.replace('1)', '0.6)')}`,
              aspectRatio: "1 / 1",
              height: "100%",
            }}
          >
            <div 
              className="absolute flex items-center justify-center"
              style={{
                inset: description ? "8px" : "6px",
              }}
            >
              <Icon 
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  color: color,
                }}
              />
            </div>
          </div>
        )}
        <div className="flex flex-col justify-center">
          <h3 className="font-header text-lg text-primary uppercase tracking-wider border-b border-primary/30 pb-0.5 whitespace-nowrap">
            {title}
          </h3>
          {description && (
            <div className="font-mono text-[10px] text-text-secondary mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-1 items-center">{actions}</div>}
    </div>
  );
}

