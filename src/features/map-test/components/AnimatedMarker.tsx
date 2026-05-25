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

const DANGER_COLORS: Record<string, string> = {
  low: "#4c6351",
  moderate: "#e8c44a",
  high: "#c27c2f",
  critical: "#9c2720",
}

const DANGER_GLOW: Record<string, string> = {
  low: "rgba(76,99,81,0.5)",
  moderate: "rgba(232,196,74,0.6)",
  high: "rgba(194,124,47,0.7)",
  critical: "rgba(156,39,32,0.8)",
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
        iconSize: [84, 108],
        iconAnchor: [42, 54],
      }),
    [iconElement],
  )

  const dangerColor = DANGER_COLORS[camp.dangerLevel] ?? "#4c6351"
  const dangerGlow = DANGER_GLOW[camp.dangerLevel] ?? "rgba(76,99,81,0.5)"
  const isCritical = camp.dangerLevel === "critical"

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
              POBLACIÓN: <span className="font-bold text-[var(--ink)]">{camp.population}</span>
            </p>
            <p className="text-[10px] text-[var(--ink-soft)] mt-1">
              PELIGRO:{" "}
              <span className="font-bold" style={{ color: dangerColor }}>
                {camp.dangerLevel.toUpperCase()}
              </span>
            </p>
            {camp.hasAlert ? (
              <p className="text-[10px] text-[var(--accent-critical)] font-bold mt-2 animate-pulse uppercase">
                ⚠ {camp.alertType ?? "ALERTA"}
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
          <div
            className="tactical-photo w-16 h-20"
            style={{
              transform: `rotate(${camp.rotation || 0}deg)`,
              boxShadow: `2px 3px 6px rgba(0,0,0,0.4), 0 0 0 2px ${dangerColor}, 0 0 10px ${dangerGlow}`,
            }}
          >
            <div className="tape-strip tape-top" />

            <div className="danger-corner-flag" style={{ borderRightColor: dangerColor }} />

            <div className="w-full h-[63%] bg-zinc-800 overflow-hidden relative">
              <img src={camp.thumbnailUrl} alt={camp.name} className="w-full h-full" />

              {camp.hasAlert ? (
                <div
                  className={`photo-alert-circle flex items-center justify-center ${isCritical ? "animate-pulse" : ""}`}
                >
                  <span className="text-[var(--accent-critical)] font-bold text-lg rotate-12 select-none opacity-80">
                    ✕
                  </span>
                </div>
              ) : null}

              <div className="pop-badge">{camp.population}</div>
            </div>

            <div className="resource-bar-row">
              {camp.resources.slice(0, 4).map((r) => (
                <div key={r.type} className="res-bar-track" title={`${r.type}: ${r.amount}%`}>
                  <div
                    className="res-bar-fill"
                    style={{
                      height: `${r.amount}%`,
                      background: r.amount < 30 ? "#9c2720" : r.amount < 60 ? "#c27c2f" : "#4c6351",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="handwritten-label">{camp.name}</div>
          </div>
        </motion.div>,
        iconElement,
      )}
    </>
  )
}
