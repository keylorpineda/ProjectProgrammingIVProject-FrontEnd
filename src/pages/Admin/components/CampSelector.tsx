import type { ChangeEvent } from "react"
import { useCamp } from "../context/CampContext"
import "./CampSelector.css"

export default function CampSelector() {
  const { activeCampId, setActiveCampId, camps, isLoading } = useCamp()
  const hasCamps = camps.length > 0

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setActiveCampId(event.target.value)
  }

  return (
    <select
      className="camp-selector"
      value={activeCampId}
      onChange={handleChange}
      disabled={isLoading || !hasCamps}
    >
      {isLoading ? <option>Cargando campamentos...</option> : null}
      {!isLoading && !hasCamps ? <option>Sin campamentos</option> : null}
      {camps.map((camp) => (
        <option key={camp.id} value={camp.id}>
          {camp.name}
        </option>
      ))}
    </select>
  )
}
