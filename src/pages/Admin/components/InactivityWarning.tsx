import { useSession } from "../context/SessionContext"
import "./InactivityWarning.css"

export default function InactivityWarning() {
  const { isWarning, secondsUntilLogout } = useSession()

  if (!isWarning) return null

  return (
    <div className="inactivity-warning-overlay">
      <div className="inactivity-warning-box">
        <h2>SIGNAL LOSS IMMINENT</h2>
        <p>TERMINAL DISCONNECT IN</p>
        <div className="countdown">{secondsUntilLogout}s</div>
        <p>MOVE CRSR TO ABORT</p>
      </div>
    </div>
  )
}
