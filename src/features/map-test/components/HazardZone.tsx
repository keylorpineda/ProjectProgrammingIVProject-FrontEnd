import { Flame, Package, ShieldAlert } from "lucide-react"
import { Circle, Popup, Tooltip } from "react-leaflet"

interface HazardZoneProps {
  coords: [number, number]
  radius: number
  dangerLevel: "low" | "moderate" | "high" | "critical"
  name?: string
}

export const HazardZone = ({ coords, radius, dangerLevel, name }: HazardZoneProps) => {
  const getColor = () => {
    switch (dangerLevel) {
      case "critical":
        return "#991b1b"
      case "high":
        return "#ea580c"
      case "moderate":
        return "#ca8a04"
      case "low":
        return "#166534"
      default:
        return "#6b7280"
    }
  }

  const getResourceCosts = () => {
    switch (dangerLevel) {
      case "critical":
        return { ammo: "ALTO", fuel: "MEDIO", risk: "EXTREMO" }
      case "high":
        return { ammo: "MEDIO", fuel: "ALTO", risk: "ALTO" }
      case "moderate":
        return { ammo: "BAJO", fuel: "MEDIO", risk: "MODERADO" }
      case "low":
        return { ammo: "MINIMO", fuel: "MINIMO", risk: "SEGURO" }
      default:
        return { ammo: "N/A", fuel: "N/A", risk: "DESCONOCIDO" }
    }
  }

  const color = getColor()
  const costs = getResourceCosts()

  return (
    <Circle
      center={coords}
      radius={radius}
      pathOptions={{
        fillColor: color,
        fillOpacity: 0.35,
        color,
        weight: 1.5,
        dashArray: "3, 6",
        lineCap: "round",
      }}
      className="hazard-zone-animation cursor-pointer"
    >
      {name ? (
        <Tooltip
          sticky
          direction="top"
          className="paper-panel !bg-[var(--ink)] !text-[var(--bg-paper)] !border-[var(--ink-soft)] !font-mono !text-[9px] !uppercase"
        >
          {name}
        </Tooltip>
      ) : null}

      <Popup className="paper-panel border-2 border-[var(--ink)] shadow-xl overflow-hidden p-0 min-w-[200px]">
        <div className="bg-[var(--ink)] p-3 border-b border-[var(--ink-soft)]">
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={14} className="text-[var(--accent-critical)]" /> REPORTE DE
            INTELIGENCIA
          </h4>
        </div>

        <div className="p-4 font-mono space-y-3">
          <div className="border-b border-[var(--ink-soft)] pb-2">
            <p className="text-[9px] text-[var(--ink-soft)] uppercase font-bold">Localizacion:</p>
            <p className="text-[11px] text-[var(--ink)] font-black uppercase">{name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[8px] text-[var(--ink-soft)] uppercase font-bold mb-1">Riesgo:</p>
              <span
                className={`text-[10px] font-black px-2 py-0.5 border border-[var(--ink)] rotate-[-2deg] block text-center uppercase ${
                  dangerLevel === "critical"
                    ? "bg-red-600 text-white"
                    : dangerLevel === "high"
                      ? "bg-orange-500 text-white"
                      : dangerLevel === "moderate"
                        ? "bg-yellow-500 text-black"
                        : "bg-green-600 text-white"
                }`}
              >
                {costs.risk}
              </span>
            </div>

            <div>
              <p className="text-[8px] text-[var(--ink-soft)] uppercase font-bold mb-1">
                Costo Tact.:
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] text-[var(--ink)]">
                  <Package size={10} /> <span>{costs.ammo}</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-[var(--ink)]">
                  <Flame size={10} /> <span>{costs.fuel}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--ink-soft)]">
            <p className="text-[9px] text-[var(--ink)] italic leading-tight">
              * SE RECOMIENDA ESCOLTA ARMADA PARA CUALQUIER INCURSION EN ESTE SECTOR.
            </p>
          </div>
        </div>
      </Popup>
    </Circle>
  )
}
