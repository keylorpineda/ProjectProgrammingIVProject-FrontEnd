import { motion } from "framer-motion"
import "./StampButton.css"

interface StampButtonProps {
  label: string
  type: "accept" | "reject"
  onClick: () => void
  disabled?: boolean
}

export default function StampButton({ label, type, onClick, disabled }: StampButtonProps) {
  const handleClick = () => {
    onClick()
  }

  return (
    <motion.button
      className={`stamp-button ${type}`}
      onClick={handleClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      whileHover={!disabled ? { scale: 1.05, rotate: 0 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {label}
    </motion.button>
  )
}
