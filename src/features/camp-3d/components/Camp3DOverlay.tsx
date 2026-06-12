import { AnimatePresence, motion } from "framer-motion"

import CampScene3DWrapper from "./CampScene3DWrapper"

import { use3DStore } from "@/store/use3DStore"

/**
 * Punto de montaje ÚNICO de la vista 3D (Paso 08). Vive en el layout de Admin
 * para que tanto el botón "Vista 3D" del header como el mapa táctico disparen
 * la misma escena sin montarla dos veces. Hace crossfade de 600ms al entrar y
 * salir (la transición flyTo del mapa ocurre antes, en MapDashboard).
 */
export default function Camp3DOverlay() {
  const is3DActive = use3DStore((s) => s.is3DActive)
  const activeCamp3DId = use3DStore((s) => s.activeCamp3DId)
  const setIs3DActive = use3DStore((s) => s.setIs3DActive)

  return (
    <AnimatePresence>
      {is3DActive && activeCamp3DId ? (
        <motion.div
          key="camp3d-overlay"
          style={{ position: "fixed", inset: 0, zIndex: 5000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <CampScene3DWrapper campId={activeCamp3DId} onClose={() => setIs3DActive(false)} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
