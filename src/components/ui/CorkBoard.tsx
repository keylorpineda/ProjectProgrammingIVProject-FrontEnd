import React, { ReactNode } from "react"
import { motion, HTMLMotionProps } from "framer-motion"

import "@/pages/worker/WorkerViews.css"

interface CorkBoardProps extends HTMLMotionProps<"div"> {
  title: ReactNode
  rightElement?: ReactNode
  children: ReactNode
  animated?: boolean
}

export function CorkBoard({
  title,
  rightElement,
  children,
  animated = false,
  className = "",
  ...props
}: CorkBoardProps) {
  // If animated is true, use motion.div, else use a regular div.
  // We cast "div" to any to avoid complex TS union types with motion.
  const Component: any = animated ? motion.div : "div"

  return (
    <Component className={`wv-cork-board wv-cork-skin ${className}`} {...props}>
      <div className="wv-board-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="wv-board-dot wv-board-dot-green" />
          <h2 className="wv-board-title">{title}</h2>
        </div>
        {rightElement}
      </div>
      {children}
    </Component>
  )
}
