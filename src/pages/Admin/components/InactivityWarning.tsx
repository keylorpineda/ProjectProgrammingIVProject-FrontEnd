import { useSession } from "../context/SessionContext"
import "./InactivityWarning.css"

export default function InactivityWarning() {
  const { isWarning, secondsUntilLogout } = useSession()

  if (!isWarning) return null

  return (
    <div className="inactivity-warning-overlay">
      <div className="inactivity-warning-box">
        <h2>PÉRDIDA DE SEÑAL INMINENTE</h2>
        <p>DESCONEXIÓN DEL TERMINAL EN</p>
        <div className="countdown">{secondsUntilLogout}s</div>
        <p>MUEVA EL CURSOR PARA ABORTAR</p>
      </div>
    </div>
  )
}
