import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ExplorationZoneMap } from "../ExplorationZoneMap"

const invalidateSize = vi.fn()

vi.mock("leaflet", () => ({
  divIcon: vi.fn((options) => ({ options })),
}))

vi.mock("leaflet/dist/leaflet.css", () => ({}))
vi.mock("../../styles/map-widgets.css", () => ({}))

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, center }: { children: React.ReactNode; center: [number, number] }) => (
    <div data-center={center.join(",")} data-testid="map">
      {children}
    </div>
  ),
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile" data-url={url} />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-position={position.join(",")} data-testid="marker" />
  ),
  Circle: ({ center, radius }: { center: [number, number]; radius: number }) => (
    <div data-center={center.join(",")} data-radius={radius} data-testid="circle" />
  ),
  useMap: () => ({ invalidateSize }),
}))

describe("ExplorationZoneMap", () => {
  it("renders the destination label and map primitives", () => {
    render(
      <ExplorationZoneMap
        originCoords={[9.93, -84.08]}
        originName="Base Central"
        destinationLabel="Sector Oeste"
      />,
    )

    expect(screen.getByText(/Sector Oeste/)).toBeInTheDocument()
    expect(screen.getByTestId("map")).toHaveAttribute("data-center", "9.93,-84.08")
    expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "9.93,-84.08")
    expect(screen.getByTestId("circle")).toHaveAttribute("data-radius", "8000")
  })

  it("falls back to the origin name when destination label is empty", () => {
    render(
      <ExplorationZoneMap
        originCoords={[10, -85]}
        originName="Base con nombre largo para verificar corte"
        destinationLabel=""
      />,
    )

    expect(screen.getByText(/BASE: Base con nombre largo para ve/)).toBeInTheDocument()
  })
})
