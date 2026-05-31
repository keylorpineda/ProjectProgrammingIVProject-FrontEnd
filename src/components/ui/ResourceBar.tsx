import { motion } from "framer-motion"

type ResourceStatus = "sufficient" | "low" | "insufficient" | "critical" | "none"

interface ResourceBarProps {
  quantity: number
  threshold: number
  status: ResourceStatus
  /** Show the animated fill on mount */
  animate?: boolean
  className?: string
}

const fillColor: Record<ResourceStatus, string> = {
  sufficient: "bg-[#4c6351]",
  low: "bg-[#c27c2f]",
  insufficient: "bg-[#9c2720]",
  critical: "bg-red-800",
  none: "bg-white/10",
}

export function ResourceBar({
  quantity,
  threshold,
  status,
  animate = true,
  className = "",
}: ResourceBarProps) {
  const pct = Math.min((quantity / Math.max(threshold, 1)) * 100, 100)

  return (
    <div
      role="meter"
      aria-valuenow={quantity}
      aria-valuemin={0}
      aria-valuemax={threshold}
      aria-label={`Stock: ${quantity} de ${threshold}`}
      className={`w-full h-2 bg-black/20 rounded-full overflow-hidden ${className}`}
    >
      {animate ? (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${fillColor[status]} opacity-90`}
        />
      ) : (
        <div className={`h-full ${fillColor[status]} opacity-90`} style={{ width: `${pct}%` }} />
      )}
    </div>
  )
}
