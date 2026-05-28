import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  variant?: "default" | "small" | "large";
  showText?: boolean;
  className?: string;
}

export function PremiumBadge({
  variant = "default",
  showText = true,
  className,
}: PremiumBadgeProps) {
  const sizeClasses = {
    small: "px-1.5 py-0.5 text-[10px]",
    default: "px-2 py-1 text-xs",
    large: "px-3 py-1.5 text-sm",
  };

  const iconSizes = {
    small: "w-3 h-3",
    default: "w-3.5 h-3.5",
    large: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        "bg-gradient-to-r from-amber-500 to-yellow-400",
        "text-black",
        sizeClasses[variant],
        className
      )}
    >
      {/* Crown Icon */}
      <svg
        className={iconSizes[variant]}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
        <path d="M19 19H5v2h14v-2z" />
      </svg>
      {showText && <span>Premium</span>}
    </span>
  );
}

interface PremiumBadgeWithCheckProps {
  className?: string;
}

export function PremiumBadgeWithCheck({ className }: PremiumBadgeWithCheckProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        "bg-gradient-to-r from-purple-600 to-pink-600",
        "text-white",
        className
      )}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>Premium</span>
    </span>
  );
}

interface PremiumDotProps {
  className?: string;
}

export function PremiumDot({ className }: PremiumDotProps) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        "bg-gradient-to-r from-amber-400 to-yellow-400",
        "animate-pulse",
        className
      )}
    />
  );
}
