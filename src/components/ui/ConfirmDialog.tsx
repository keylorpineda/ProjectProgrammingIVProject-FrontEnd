import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Info, X } from "lucide-react"

import type { ReactNode } from "react"

export type ConfirmDialogType = "warning" | "danger" | "info"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: ReactNode
  type?: ConfirmDialogType
  confirmLabel?: string
  cancelLabel?: string
  hideCancel?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  type = "warning",
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  hideCancel = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const icons = {
    warning: <AlertTriangle className="w-8 h-8 text-[#df8120]" />,
    danger: <AlertTriangle className="w-8 h-8 text-[#9c2720]" />,
    info: <Info className="w-8 h-8 text-[#4c6351]" />,
  }

  const headerColors = {
    warning: "bg-[#df8120]/10 border-[#df8120]/30",
    danger: "bg-[#9c2720]/10 border-[#9c2720]/30",
    info: "bg-[#4c6351]/10 border-[#4c6351]/30",
  }

  const buttonClasses = {
    warning: "bg-[#c27c2f] hover:bg-[#b35a12] text-white",
    danger: "bg-[#9c2720] hover:bg-[#b92b23] text-white",
    info: "bg-[#4c6351] hover:bg-[#3d5041] text-white",
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#121110] border-2 border-[#1c1208] max-w-md w-full overflow-hidden relative"
            style={{
              boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(223, 129, 32, 0.05)",
            }}
          >
            {/* Esquinas tácticas */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/20"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/20"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/20"></div>

            <div className={`flex items-center gap-4 p-5 border-b ${headerColors[type]}`}>
              {icons[type]}
              <h3 className="flex-1 text-lg font-typewriter font-black text-white uppercase tracking-wider">
                {title}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm font-mono text-white/80 leading-relaxed">{message}</p>
            </div>

            <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              {!hideCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white/70 border border-white/20 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onConfirm}
                className={`px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg ${buttonClasses[type]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
