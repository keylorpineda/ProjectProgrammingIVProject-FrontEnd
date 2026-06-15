import { useState } from "react"

import { useCamp } from "../context/CampContext"

import type { ChangeEvent } from "react"
import "./CampSelector.css"

export default function CampSelector() {
  const { activeCampId, switchActiveCamp, camps, isLoading } = useCamp()
  const [isSwitching, setIsSwitching] = useState(false)

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

  // El campamento 3D es el fondo permanente del panel admin: siempre está
  // visible, así que ya no hay botón "Ver Campamento" (sería redundante).
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
    </div>
  )
}
