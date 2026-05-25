import { Radar } from "lucide-react"
import { motion } from "framer-motion"
import { CampProvider, useCamps } from "../context/CampContext"
import { MapDashboard } from "./MapDashboard"

const TacticalMapStateGate = () => {
  const { error, loading, reload } = useCamps()

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-deep)] scanlines">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1, 0.95] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          className="flex flex-col items-center"
        >
          <Radar className="text-[var(--primary-color)] mb-4" size={48} />
          <p className="text-[var(--primary-color)] font-typewriter tracking-widest uppercase text-xs">
            CALIBRANDO FRECUENCIAS...
          </p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-deep)] px-6">
        <div className="paper-panel p-8 max-w-xl text-center space-y-4">
          <h2 className="text-xl font-typewriter font-bold uppercase text-[var(--ink)]">
            FALLO DE ENLACE
          </h2>
          <p className="font-mono text-sm text-[var(--ink-soft)] uppercase">{error}</p>
          <button
            onClick={() => {
              void reload()
            }}
            className="px-4 py-2 bg-[var(--ink)] text-[var(--bg-paper)] font-mono text-xs uppercase tracking-widest"
          >
            REINTENTAR SINCRONIZACION
          </button>
        </div>
      </div>
    )
  }

  return <MapDashboard />
}

export default function MapDashboardWrapper() {
  return (
    <CampProvider>
      <TacticalMapStateGate />
    </CampProvider>
  )
}
