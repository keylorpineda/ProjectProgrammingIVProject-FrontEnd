import { useState } from "react"

import { useCamp } from "../context/CampContext"

import type { ChangeEvent } from "react"
import "./CampSelector.css"

import CampScene3DWrapper from "@/features/camp-3d/components/CampScene3DWrapper"
import { use3DStore } from "@/store/use3DStore"

export default function CampSelector() {
  const { activeCampId, switchActiveCamp, camps, isLoading } = useCamp()
  const [isSwitching, setIsSwitching] = useState(false)

  const is3DActive = use3DStore((s) => s.is3DActive)
  const activeCamp3DId = use3DStore((s) => s.activeCamp3DId)
  const setIs3DActive = use3DStore((s) => s.setIs3DActive)
  const setActiveCamp = use3DStore((s) => s.setActiveCamp)

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value
    if (!nextId || nextId === activeCampId) return
    setIsSwitching(true)
    try {
      await switchActiveCamp(nextId)
    } catch {
      // intentional
    } finally {
      setIsSwitching(false)
    }
  }

  // MVP: acceso directo a la vista 3D sin transición desde el mapa.
  const open3D = () => {
    if (!activeCampId) return
    setActiveCamp(activeCampId)
    setIs3DActive(true)
  }

  return (
    <div className="camp-selector-wrapper">
      <span className="camp-selector-label">UBICACIÓN:</span>
      <select
        className="camp-selector"
        value={activeCampId}
        onChange={handleChange}
        disabled={isLoading || isSwitching}
      >
        {isLoading ? <option>CARGANDO...</option> : null}
        {isSwitching ? <option>CAMBIANDO...</option> : null}
        {!isLoading && camps.length === 0 ? <option>SIN CAMPAMENTOS</option> : null}
        {camps.map((camp) => (
          <option key={camp.id} value={camp.id}>
            {camp.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="camp-selector-3d"
        onClick={open3D}
        disabled={isLoading || isSwitching || !activeCampId}
      >
        Vista 3D
      </button>

      {is3DActive && activeCamp3DId ? (
        <CampScene3DWrapper campId={activeCamp3DId} onClose={() => setIs3DActive(false)} />
      ) : null}
    </div>
  )
}
