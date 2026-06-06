import * as L from "leaflet"
import { useEffect } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "../styles/map-widgets.css"

const MAP_CENTER: [number, number] = [9.934739, -84.087502]

interface MapCoordPickerProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

const pinIcon = L.divIcon({
  className: "",
  html: "<div style=\"width:14px;height:14px;background:#c27c2f;border:2px solid #000;border-radius:50%;box-shadow:0 0 10px rgba(194,124,47,0.9),0 0 4px rgba(0,0,0,0.6);margin-left:-7px;margin-top:-7px\"></div>",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})

const ClickHandler = ({ onChange }: { onChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const MapResizer = () => {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap()
  useEffect(() => {
    map.panTo([lat, lng])
  }, [lat, lng, map])
  return null
}

export function MapCoordPicker({ lat, lng, onChange }: MapCoordPickerProps) {
  const hasCoords = lat != null && lng != null
  const center: [number, number] = hasCoords ? [lat, lng] : MAP_CENTER

  return (
    <div className="map-widget-frame">
      <MapContainer
        center={center}
        zoom={12}
        className="coord-picker-map"
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <ClickHandler onChange={onChange} />
        <MapResizer />
        {hasCoords ? (
          <>
            <Marker position={[lat, lng]} icon={pinIcon} />
            <Recenter lat={lat} lng={lng} />
          </>
        ) : null}
      </MapContainer>
      <div className="coord-picker-readout">
        {hasCoords ? (
          <span className="coord-set">
            ◉ {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        ) : (
          <span className="coord-hint">CLICK EN EL MAPA PARA SELECCIONAR COORDENADAS</span>
        )}
      </div>
    </div>
  )
}
