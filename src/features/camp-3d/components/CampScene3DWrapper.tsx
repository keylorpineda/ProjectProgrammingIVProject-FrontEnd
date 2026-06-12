import { Component, useState } from "react"

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
            ◄ Volver al Mapa
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/** Skeleton de arranque mostrado mientras Three.js inicializa la escena. */
function LoadingSkeleton() {
  return (
    <div className="camp3d-loading">
      <div className="camp3d-loading-text">BOOT...</div>
      <div className="camp3d-loading-bar">
        <div className="camp3d-loading-fill" />
      </div>
    </div>
  )
}

/**
 * Envoltorio de la escena 3D: overlay a pantalla completa con skeleton de carga
 * durante la inicialización de Three.js y un error boundary que captura fallos
 * de WebGL. La escena se mantiene montada bajo el skeleton para que su `onReady`
 * pueda apagarlo.
 */
export default function CampScene3DWrapper({ campId, onClose }: CampScene3DProps) {
  const [loading, setLoading] = useState(true)

  return (
    <div className="camp3d-overlay">
      <SceneErrorBoundary onClose={onClose}>
        <CampScene3D campId={campId} onClose={onClose} onReady={() => setLoading(false)} />
      </SceneErrorBoundary>
      {loading ? <LoadingSkeleton /> : null}
    </div>
  )
}
