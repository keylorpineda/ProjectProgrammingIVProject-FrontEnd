import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

import Camp3DEntryTransition from "./Camp3DEntryTransition"
import CampScene3DWrapper from "./CampScene3DWrapper"

import { use3DStore } from "@/store/use3DStore"

/**
 * Punto de montaje ÚNICO de la vista 3D (Paso 08). Vive en el layout de cada
 * rol para que tanto el botón "Ver Campamento" del header como el mapa táctico
 * y el arranque al iniciar sesión disparen la misma escena sin montarla dos
 * veces. Hace crossfade de 600ms al entrar y salir; al encenderse, cubre la
 * escena con una animación de entrada cinematográfica (Camp3DEntryTransition)
 * mientras Three.js carga por debajo.
 */
export default function Camp3DOverlay() {
  const is3DActive = use3DStore((s) => s.is3DActive)
  const activeCamp3DId = use3DStore((s) => s.activeCamp3DId)
  const setIs3DActive = use3DStore((s) => s.setIs3DActive)

  // Anima la entrada solo en el flanco de subida (apagado → encendido).
  const [showIntro, setShowIntro] = useState(false)
  const wasActive = useRef(false)

  useEffect(() => {
    if (is3DActive && !wasActive.current) setShowIntro(true)
    if (!is3DActive) setShowIntro(false)
    wasActive.current = is3DActive
  }, [is3DActive])

  const handleIntroComplete = useCallback(() => setShowIntro(false), [])

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

          <AnimatePresence>
            {showIntro ? (
              <Camp3DEntryTransition key="camp3d-intro" onComplete={handleIntroComplete} />
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
