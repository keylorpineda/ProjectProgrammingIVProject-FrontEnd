import * as L from "leaflet"
import { useEffect } from "react"
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "../styles/map-widgets.css"

interface TransferRouteMapProps {
  fromCoords: [number, number]
  toCoords: [number, number]
  fromName: string
  toName: string
}

const makeNodeIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};border:1px solid #000;padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:8px;white-space:nowrap;font-weight:bold;color:#e0d8cc;letter-spacing:1px;transform:translateY(-14px) translateX(-50%)">${label}</div>`,
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

export function TransferRouteMap({
  fromCoords,
  toCoords,
  fromName,
  toName,
}: TransferRouteMapProps) {
  const samePoint = fromCoords[0] === toCoords[0] && fromCoords[1] === toCoords[1]
  const pad = samePoint ? 0.05 : 0.25
  const bounds = L.latLngBounds([fromCoords, toCoords]).pad(pad)

  return (
    <div className="route-map-container">
      <div className="route-map-header">◈ RUTA DE TRASLADO</div>
      <MapContainer
        bounds={bounds}
        className="route-map"
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        attributionControl={false}
        doubleClickZoom={false}
        keyboard={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <MapResizer />
        <Polyline
          positions={[fromCoords, toCoords]}
          pathOptions={{ color: "#c27c2f", weight: 2, dashArray: "10, 8", opacity: 0.9 }}
          className="widget-marching-ants"
        />
        <Marker position={fromCoords} icon={makeNodeIcon(fromName.slice(0, 16), "#161513")} />
        <Marker position={toCoords} icon={makeNodeIcon(toName.slice(0, 16), "#8f581e")} />
      </MapContainer>
    </div>
  )
}
