import { AnimatePresence, motion } from "framer-motion"
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"

import { use3DStore } from "@/store/use3DStore"

// Lazy-load the heavy 3D chunk (three.js ~600 KB) only when the user opens the
// 3D view for the first time. CampScene3DWrapper owns its own loading skeleton so
// the Suspense fallback is just null — the wrapper already shows "BOOT..." while
// Three.js initialises, and the entry transition covers the transition.
const CampScene3DWrapper = lazy(() => import("./CampScene3DWrapper"))
const Camp3DEntryTransition = lazy(() => import("./Camp3DEntryTransition"))

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
  const transferCinematic = use3DStore((s) => s.transferCinematic)

  // Anima la entrada solo en el flanco de subida (apagado → encendido). Si la
  // apertura es una cinemática de traslado, se omite la intro verde para que el
  // plano del camión sea la presentación.
  const [showIntro, setShowIntro] = useState(false)
  const wasActive = useRef(false)
  const lastCineNonce = useRef(transferCinematic)

  useEffect(() => {
    if (is3DActive && !wasActive.current) {
      const isCinematicOpen = transferCinematic > lastCineNonce.current
      setShowIntro(!isCinematicOpen)
    }
    if (!is3DActive) setShowIntro(false)
    lastCineNonce.current = transferCinematic
    wasActive.current = is3DActive
  }, [is3DActive, transferCinematic])

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
          <Suspense fallback={null}>
            <CampScene3DWrapper campId={activeCamp3DId} onClose={() => setIs3DActive(false)} />

            <AnimatePresence>
              {showIntro ? (
                <Camp3DEntryTransition key="camp3d-intro" onComplete={handleIntroComplete} />
              ) : null}
            </AnimatePresence>
          </Suspense>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
