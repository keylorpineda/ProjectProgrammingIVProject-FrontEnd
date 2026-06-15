import { Box } from "lucide-react"

import { use3DStore } from "@/store/use3DStore"
import { useAuthStore } from "@/store/useAuthStore"

import "./Open3DButton.css"

interface Open3DButtonProps {
  /** Texto del botón (por defecto "Ver Campamento"). */
  label?: string
  /** Clase extra para ajustar el botón al header de cada rol. */
  className?: string
}

/**
 * Botón reutilizable que abre la vista 3D del campamento del usuario actual.
 * Lee `camp_id` del store de auth y enciende `use3DStore`; el Camp3DOverlay
 * montado en cada layout reproduce la escena con su animación de entrada. Se usa
 * en los headers de worker/camp_leader/travel_manager/resource_manager (el
 * Admin ya lo tiene en CampSelector).
 */
export default function Open3DButton({ label = "Ver Campamento", className }: Open3DButtonProps) {
  const campId = useAuthStore((s) => s.user?.camp_id)
  const setActiveCamp = use3DStore((s) => s.setActiveCamp)
  const setIs3DActive = use3DStore((s) => s.setIs3DActive)

  const open3D = () => {
    if (!campId) return
    setActiveCamp(campId)
    setIs3DActive(true)
  }

  return (
    <button
      type="button"
      onClick={open3D}
      disabled={!campId}
      className={`open3d-btn${className ? ` ${className}` : ""}`}
      title="Ver el campamento en 3D"
    >
      <Box className="open3d-btn-icon" />
      <span>{label}</span>
    </button>
  )
}
