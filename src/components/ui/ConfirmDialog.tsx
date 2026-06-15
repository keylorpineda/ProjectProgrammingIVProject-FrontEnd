import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Loader2, CheckCircle2, ShieldAlert } from "lucide-react"

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
  isLoading?: boolean
  loadingLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const CONFIG = {
  warning: {
    icon: <AlertTriangle className="w-10 h-10 text-[#df8120]" />,
    headerBg: "bg-[#df8120]/12 border-[#df8120]/40",
    accent: "#df8120",
    scanline: "rgba(223,129,32,0.08)",
    confirmBtn:
      "bg-[#c27c2f] hover:bg-[#b35a12] text-white shadow-[0_0_12px_rgba(194,124,47,0.35)] hover:shadow-[0_0_20px_rgba(194,124,47,0.5)]",
    corner: "border-[#df8120]/50",
  },
  danger: {
    icon: <ShieldAlert className="w-10 h-10 text-[#c0392b]" />,
    headerBg: "bg-[#9c2720]/12 border-[#9c2720]/40",
    accent: "#c0392b",
    scanline: "rgba(156,39,32,0.08)",
    confirmBtn:
      "bg-[#9c2720] hover:bg-[#b92b23] text-white shadow-[0_0_12px_rgba(156,39,32,0.35)] hover:shadow-[0_0_20px_rgba(156,39,32,0.5)]",
    corner: "border-[#9c2720]/50",
  },
  info: {
    icon: <CheckCircle2 className="w-10 h-10 text-[#4c8c6b]" />,
    headerBg: "bg-[#4c6351]/12 border-[#4c6351]/40",
    accent: "#4c8c6b",
    scanline: "rgba(76,99,81,0.08)",
    confirmBtn:
      "bg-[#4c6351] hover:bg-[#3d5041] text-white shadow-[0_0_12px_rgba(76,99,81,0.35)] hover:shadow-[0_0_20px_rgba(76,99,81,0.5)]",
    corner: "border-[#4c6351]/50",
  },
} as const

export function ConfirmDialog({
  isOpen,
  title,
  message,
  type = "warning",
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  hideCancel = false,
  isLoading = false,
  loadingLabel = "Procesando...",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cfg = CONFIG[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative w-full max-w-xl overflow-hidden"
            style={{
              background: "#0d0c0b",
              border: `2px solid ${cfg.accent}44`,
              boxShadow: `0 0 60px rgba(0,0,0,0.9), 0 0 30px ${cfg.accent}22, inset 0 0 30px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${cfg.scanline} 2px, ${cfg.scanline} 4px)`,
              }}
            />

            {/* Tactical corners */}
            {(
              [
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "bottom-0 right-0 border-b-2 border-r-2",
              ] as const
            ).map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5 ${cfg.corner} z-20`} />
            ))}

            {/* Header */}
            <div
              className={`relative z-10 flex items-center gap-5 px-8 py-6 border-b-2 ${cfg.headerBg}`}
            >
              <div className="shrink-0 p-2 rounded-sm" style={{ background: `${cfg.accent}18` }}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[10px] font-mono font-black tracking-[0.3em] mb-1 uppercase"
                  style={{ color: `${cfg.accent}99` }}
                >
                  {"// SISTEMA TÁCTICO"}
                </div>
                <h3 className="text-xl font-typewriter font-black text-white uppercase tracking-wider leading-tight">
                  {title}
                </h3>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="shrink-0 p-2 text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-sm"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="relative z-10 px-8 py-7">
              {/* Accent line */}
              <div className="w-8 h-0.5 mb-5 rounded-full" style={{ background: cfg.accent }} />
              <div className="text-base font-mono text-white/85 leading-relaxed">{message}</div>
            </div>

            {/* Loading state bar */}
            {isLoading && (
              <div className="relative z-10 px-8 pb-2">
                <div className="h-px bg-white/10 w-full overflow-hidden rounded-full">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: cfg.accent }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="relative z-10 px-8 py-5 border-t border-white/8 bg-black/30 flex items-center justify-end gap-4">
              {!hideCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-white/60 border border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex items-center gap-3 px-8 py-3 font-mono text-sm font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed ${cfg.confirmBtn}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingLabel}</span>
                  </>
                ) : (
                  <span>{confirmLabel}</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
