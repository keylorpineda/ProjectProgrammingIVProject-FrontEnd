import { useMemo } from "react"
import { Marker, Popup } from "react-leaflet"
import { createPortal } from "react-dom"
import L from "leaflet"
import { motion } from "framer-motion"
import type { Camp } from "../types/camp"

interface AnimatedMarkerProps {
  camp: Camp
  onClick: (camp: Camp) => void
}

export const AnimatedMarker = ({ camp, onClick }: AnimatedMarkerProps) => {
  const iconElement = useMemo(() => {
    const element = document.createElement("div")
    element.className = "custom-marker-container"
    return element
  }, [])

  const customIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: iconElement,
        iconSize: [80, 100],
        iconAnchor: [40, 50],
      }),
    [iconElement],
  )

  return (
    <>
      <Marker
        position={camp.coords}
        icon={customIcon}
        eventHandlers={{
          click: () => onClick(camp),
        }}
      >
        <Popup className="paper-panel !p-0 overflow-hidden">
          <div className="p-4 font-mono">
            <h3 className="font-bold text-[var(--ink)] text-xs uppercase border-b border-[var(--ink-soft)] mb-2 tracking-widest">
              {camp.name}
            </h3>
            <p className="text-[10px] text-[var(--ink-soft)]">
              POBLACION ESTIMADA: <span className="font-bold text-[var(--ink)]">{camp.population}</span>
            </p>
            {camp.hasAlert ? (
              <p className="text-[10px] text-[var(--accent-critical)] font-bold mt-2 animate-pulse uppercase">
                ADVERTENCIA: {camp.alertType ?? "ALERTA"}
              </p>
            ) : null}
          </div>
        </Popup>
      </Marker>

      {createPortal(
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          <div className="tactical-photo w-16 h-20" style={{ transform: `rotate(${camp.rotation || 0}deg)` }}>
            <div className="tape-strip tape-top" />
            <div className="tape-strip tape-bottom" />

            <div className="w-full h-[75%] bg-zinc-800 overflow-hidden relative">
              <img src={camp.thumbnailUrl} alt={camp.name} className="w-full h-full" />

              {camp.hasAlert ? (
                <div className="photo-alert-circle animate-pulse flex items-center justify-center">
                  <span className="text-[var(--accent-critical)] font-bold text-lg rotate-12 select-none opacity-80">
                    X
                  </span>
                </div>
              ) : null}
            </div>

            <div className="handwritten-label">{camp.name}</div>
          </div>
        </motion.div>,
        iconElement,
      )}
    </>
  )
}
