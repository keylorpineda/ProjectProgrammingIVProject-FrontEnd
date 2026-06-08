import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Package, X, Zap } from "lucide-react"

import { useAlertsStore, type TransferAlertItem } from "@/store/useAlertsStore"

interface AlertsBannerProps {
  campId: string | number
}

export default function AlertsBanner({ campId }: AlertsBannerProps) {
  const campIdStr = String(campId)
  const inventoryAlerts = useAlertsStore((s) => s.inventoryAlerts[campIdStr] ?? [])
  const transferAlerts = useAlertsStore((s) =>
    s.transferAlerts.filter((a) => String(a.campId) === campIdStr),
  )
  const dismissTransfer = useAlertsStore((s) => s.dismissTransferAlert)

  if (inventoryAlerts.length === 0 && transferAlerts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {inventoryAlerts.slice(0, 3).map((alert) => (
          <motion.div
            key={`inv-${alert.resource_id}`}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            className="pointer-events-auto bg-[#0e0d0c] border-2 border-[#9c2720] p-3 font-mono shadow-[0_0_20px_rgba(156,39,32,0.3)]"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={12} className="text-[#9c2720] animate-pulse" />
              <span className="text-[#9c2720] text-[9px] font-bold uppercase tracking-widest">
                ALERTA CRÍTICA — RECURSOS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package size={10} className="text-[#c27c2f]" />
              <span className="text-[#e0d8cc] text-[10px] uppercase font-bold">
                {alert.resource_name}
              </span>
              <span className="text-[#9c2720] text-[10px] font-bold ml-auto">
                {alert.current_quantity} / {alert.minimum_stock_required}
              </span>
            </div>
          </motion.div>
        ))}

        {transferAlerts.slice(0, 2).map((alert: TransferAlertItem) => (
          <motion.div
            key={`tr-${alert.id}`}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            className="pointer-events-auto bg-[#0e0d0c] border-2 border-[#c27c2f] p-3 font-mono shadow-[0_0_20px_rgba(194,124,47,0.3)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-[#c27c2f]" />
                  <span className="text-[#c27c2f] text-[9px] font-bold uppercase tracking-widest">
                    SOLICITUD DE TRASLADO ENTRANTE
                  </span>
                </div>
                <p className="text-[#e0d8cc] text-[10px] uppercase">
                  Origen: <span className="font-bold">{alert.originCamp}</span>
                </p>
                <p className="text-[#ab9e8b] text-[9px] uppercase">Tipo: {alert.type}</p>
              </div>
              <button
                onClick={() => dismissTransfer(alert.id)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors mt-0.5"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
