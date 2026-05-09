import type { ChangeEvent } from "react"
import { useCamp } from "../context/CampContext"
import "./CampSelector.css"

export default function CampSelector() {
  const { activeCampId, setActiveCampId, camps, isLoading } = useCamp()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setActiveCampId(event.target.value)
  }

  return (
    <div className="camp-selector-wrapper">
      <span className="camp-selector-label">UBICACIÓN:</span>
      <select
        className="camp-selector"
        value={activeCampId}
        onChange={handleChange}
        disabled={isLoading}
      >
        {isLoading ? <option>CARGANDO...</option> : null}
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
