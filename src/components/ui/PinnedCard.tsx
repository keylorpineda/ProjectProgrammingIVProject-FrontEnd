import { ReactNode } from "react"
import { motion, HTMLMotionProps } from "framer-motion"

import "@/pages/worker/WorkerViews.css"

export type PinColor = "amber" | "green" | "red" | "gold" | "none" | string

interface PinnedCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  title?: ReactNode
  value?: ReactNode
  label?: ReactNode
  pinColor?: PinColor
  rotate?: number
  animated?: boolean
  children?: ReactNode
}

export function PinnedCard({
  title,
  value,
  label,
  pinColor = "amber",
  rotate = 0,
  animated = false,
  children,
  className = "",
  style,
  whileHover,
  ...props
}: PinnedCardProps) {
  const Component: any = animated ? motion.div : "div"
  
  // Resolve pin class (allows passing "red", "wv-pin-red", etc.)
  const resolvedPinClass = pinColor.startsWith("wv-pin-") ? pinColor : `wv-pin-${pinColor}`

  return (
    <Component
      className={`wv-pinned ${props.onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      whileHover={animated ? (whileHover !== undefined ? whileHover : { scale: 1.06, rotate: 0 }) : undefined}
      {...props}
    >
      {pinColor !== "none" && <div className={`wv-pin ${resolvedPinClass}`} />}
      {title && <h3 className="wv-card-title">{title}</h3>}
      {value !== undefined && <div className="wv-big-number">{value}</div>}
      {label !== undefined && <div className="wv-small-label">{label}</div>}
      {children}
    </Component>
  )
}
