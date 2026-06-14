import { motion } from "framer-motion"
import { useEffect, useState } from "react"

import "./Camp3DEntryTransition.css"

/** Líneas de "boot" que aparecen una a una durante la entrada. */
const BOOT_LINES = [
  "> ESTABLECIENDO ENLACE SATELITAL...",
  "> DESCIFRANDO COORDENADAS DEL SECTOR...",
  "> SINCRONIZANDO PERÍMETRO...",
  "> ACCESO CONCEDIDO",
]

interface Camp3DEntryTransitionProps {
  /** Nombre del campamento al que se entra (opcional, se muestra en grande). */
  campName?: string | null
  /** Se invoca cuando termina la animación de entrada. Debe ser estable. */
  onComplete: () => void
  /** Duración total en ms. */
  duration?: number
}

/**
 * Animación cinematográfica de entrada a la vista 3D del campamento. Cubre la
 * escena (que se monta por debajo y carga mientras tanto) con una secuencia de
 * terminal post-apocalíptica + barrido de radar y, al cabo de `duration`,
 * invoca `onComplete` para que el overlay la desmonte y revele el 3D.
 */
export default function Camp3DEntryTransition({
  campName,
  onComplete,
  duration = 2400,
}: Camp3DEntryTransitionProps) {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    // Las líneas se revelan repartidas a lo largo de la animación.
    const step = duration / (BOOT_LINES.length + 1)
    const lineTimers = BOOT_LINES.map((_, index) =>
      window.setTimeout(() => setVisibleLines(index + 1), step * (index + 1)),
    )
    const doneTimer = window.setTimeout(onComplete, duration)

    return () => {
      lineTimers.forEach((id) => window.clearTimeout(id))
      window.clearTimeout(doneTimer)
    }
  }, [duration, onComplete])

  return (
    <motion.div
      className="camp3d-entry"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="camp3d-entry-scanlines" />
      <div className="camp3d-entry-radar" />

      <div className="camp3d-entry-content">
        <div className="camp3d-entry-title">ENTRANDO AL CAMPAMENTO</div>
        {campName ? <div className="camp3d-entry-campname">{`// ${campName}`}</div> : null}

        <div className="camp3d-entry-console">
          {BOOT_LINES.slice(0, visibleLines).map((line) => (
            <div key={line} className="camp3d-entry-line">
              {line}
            </div>
          ))}
        </div>

        <div className="camp3d-entry-bar">
          <motion.div
            className="camp3d-entry-fill"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: duration / 1000, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}
