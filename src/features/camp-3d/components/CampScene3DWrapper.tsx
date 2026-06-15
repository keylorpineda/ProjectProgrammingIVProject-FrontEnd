import { Component, useEffect, useState } from "react"

import CampScene3D from "./CampScene3D"

import type { CampScene3DProps } from "../types/scene.types"
import type { ErrorInfo, ReactNode } from "react"

import "./CampScene3DWrapper.css"

interface ErrorBoundaryProps {
  onClose: () => void
  children: ReactNode
}
interface ErrorBoundaryState {
  error: Error | null
}

/** Aísla fallos de WebGL/Three.js para que no tumben toda la app. */
class SceneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[CampScene3D] error al renderizar la escena:", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="camp3d-error">
          <div className="camp3d-error-title">⚠ Fallo en la vista 3D</div>
          <div className="camp3d-error-detail">{this.state.error.message}</div>
          <button type="button" className="camp3d-error-btn" onClick={this.props.onClose}>
            ◄ Ir al Panel
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/** Pantalla de carga inmersiva mostrada mientras Three.js inicializa la escena. */
function LoadingSkeleton() {
  const [statusIdx, setStatusIdx] = useState(0)
  const statuses = [
    "Inicializando motor 3D...",
    "Cargando geometría del campamento...",
    "Compilando shaders...",
    "Posicionando estructuras...",
    "Calibrando cámara orbital...",
    "Cargando datos del campamento...",
    "Enlazando sensores de zona...",
    "Sistema listo...",
  ]

  useEffect(() => {
    const intervals = [600, 900, 700, 1100, 800, 950, 750, 0]
    let i = 0
    const tick = () => {
      i = (i + 1) % statuses.length
      setStatusIdx(i)
      if (intervals[i] > 0) setTimeout(tick, intervals[i])
    }
    const t = setTimeout(tick, 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="camp3d-loading">
      <div className="camp3d-loading-content">
        {/* Emblema / ícono */}
        <div className="camp3d-loading-emblem" aria-hidden="true">
          ⬡
        </div>

        <div className="camp3d-loading-divider" />

        {/* Título */}
        <div className="camp3d-loading-title">
          <div className="camp3d-loading-kicker">{"// Sistema de campamento"}</div>
          <div className="camp3d-loading-main">Cargando Vista 3D</div>
        </div>

        {/* Mensaje de estado animado */}
        <div className="camp3d-loading-status" aria-live="polite">
          {statuses[statusIdx]}
        </div>

        {/* Barra de progreso */}
        <div className="camp3d-loading-bar-wrap">
          <div className="camp3d-loading-bar-label">
            <span>Inicializando</span>
            <span>...</span>
          </div>
          <div className="camp3d-loading-bar">
            <div className="camp3d-loading-fill" />
          </div>
        </div>

        {/* Puntos pulsantes */}
        <div className="camp3d-loading-dots" aria-hidden="true">
          <div className="camp3d-loading-dot" />
          <div className="camp3d-loading-dot" />
          <div className="camp3d-loading-dot" />
        </div>
      </div>

      <div className="camp3d-loading-footnote">DOOMSDAY SYSTEM · MÓDULO DE VISUALIZACIÓN 3D</div>
    </div>
  )
}

/**
 * Envoltorio de la escena 3D: overlay a pantalla completa con skeleton de carga
 * durante la inicialización de Three.js y un error boundary que captura fallos
 * de WebGL. La escena se mantiene montada bajo el skeleton para que su `onReady`
 * pueda apagarlo.
 */
export default function CampScene3DWrapper({
  campId,
  onClose,
  embedded,
  onBuildingSelect,
}: CampScene3DProps) {
  const [loading, setLoading] = useState(true)

  return (
    <div className="camp3d-overlay">
      {/* El skeleton vive DENTRO del boundary: si la escena falla, el fallback
          de error reemplaza a ambos y el mensaje nunca queda tapado. */}
      <SceneErrorBoundary onClose={onClose}>
        <CampScene3D
          campId={campId}
          onClose={onClose}
          embedded={embedded}
          onBuildingSelect={onBuildingSelect}
          onReady={() => setLoading(false)}
        />
        {loading ? <LoadingSkeleton /> : null}
      </SceneErrorBoundary>
    </div>
  )
}
