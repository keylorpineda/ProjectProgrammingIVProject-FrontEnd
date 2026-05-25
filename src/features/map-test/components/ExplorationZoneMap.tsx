import { useEffect } from "react"
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "../styles/map-widgets.css"

interface ExplorationZoneMapProps {
  originCoords: [number, number]
  originName: string
  destinationLabel: string
}

const baseIcon = L.divIcon({
  className: "",
  html: "<div style=\"background:#161513;border:2px solid #c27c2f;padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:8px;white-space:nowrap;font-weight:bold;color:#c27c2f;letter-spacing:1px;transform:translateY(-14px) translateX(-50%)\">⊕ BASE</div>",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})

const MapResizer = () => {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export function ExplorationZoneMap({
  originCoords,
  originName,
  destinationLabel,
}: ExplorationZoneMapProps) {
  const label = destinationLabel
    ? destinationLabel.slice(0, 50)
    : `BASE: ${originName.slice(0, 30)}`

  return (
    <div className="zone-map-container">
      <div className="zone-map-header">◈ ZONA DE OPERACIONES — {label}</div>
      <MapContainer
        center={originCoords}
        zoom={10}
        className="zone-map"
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        attributionControl={false}
        doubleClickZoom={false}
        keyboard={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <MapResizer />
        <Marker position={originCoords} icon={baseIcon} />
        <Circle
          center={originCoords}
          radius={8000}
          pathOptions={{
            color: "#c27c2f",
            fillColor: "#c27c2f",
            fillOpacity: 0.06,
            weight: 1,
            dashArray: "6 4",
          }}
        />
      </MapContainer>
    </div>
  )
}
