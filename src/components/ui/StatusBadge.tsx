type ResourceStatus = "sufficient" | "low" | "insufficient" | "critical" | "none"

interface StatusBadgeProps {
  status: ResourceStatus
  className?: string
}

const labels: Record<ResourceStatus, string> = {
  sufficient: "Suficiente",
  low: "Bajo",
  insufficient: "Insuficiente",
  critical: "Crítico",
  none: "Sin Stock",
}

const colors: Record<ResourceStatus, string> = {
  sufficient: "text-[#4c6351] border-[#4c6351]/40",
  low: "text-[#c27c2f] border-[#c27c2f]/40",
  insufficient: "text-[#9c2720] border-[#9c2720]/40",
  critical: "text-red-700 border-red-700/40",
  none: "text-white/20 border-white/10",
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 border font-mono text-[10px] font-semibold uppercase tracking-wide ${colors[status]} ${className}`}
    >
      {labels[status]}
    </span>
  )
}
