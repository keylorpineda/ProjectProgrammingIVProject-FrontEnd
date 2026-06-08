import "@testing-library/jest-dom"
import { createElement, type ReactNode } from "react"
import { vi } from "vitest"

// framer-motion: render children directly, skip all animation props
vi.mock("framer-motion", () => {
  const animProps = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "whileDrag",
    "whileFocus",
    "whileInView",
    "variants",
    "layout",
    "layoutId",
    "drag",
    "dragConstraints",
    "dragElastic",
    "dragMomentum",
    "onUpdate",
    "onAnimationStart",
    "onAnimationComplete",
    "custom",
    "viewport",
  ])
  // Cache so motion.div === motion.div (no remounts between renders)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache: Record<string, any> = {}
  const makeMotionComponent = (tag: string) => {
    if (cache[tag]) return cache[tag]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = ({ children, ...rest }: any) => {
      const safeProps = Object.fromEntries(Object.entries(rest).filter(([k]) => !animProps.has(k)))
      return createElement(tag, safeProps, children)
    }
    cache[tag] = Component
    return Component
  }
  const motion = new Proxy(
    {},
    {
      get: (_, tag) => {
        if (typeof tag !== "string") return undefined
        return makeMotionComponent(tag)
      },
    },
  )
  const makeMotionValue = <T>(initial: T) => {
    let current = initial
    return {
      get: () => current,
      set: (next: T) => {
        current = next
      },
      on: () => () => {},
      onChange: () => () => {},
      destroy: () => {},
    }
  }
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    LayoutGroup: ({ children }: { children: ReactNode }) => children,
    useMotionValue: makeMotionValue,
    useTransform: () => makeMotionValue(0),
    useScroll: () => ({
      scrollX: makeMotionValue(0),
      scrollY: makeMotionValue(0),
      scrollXProgress: makeMotionValue(0),
      scrollYProgress: makeMotionValue(0),
    }),
    useSpring: makeMotionValue,
    useAnimationControls: () => ({
      start: async () => undefined,
      stop: () => {},
      set: () => {},
      mount: () => () => {},
    }),
    useAnimation: () => ({
      start: async () => undefined,
      stop: () => {},
      set: () => {},
      mount: () => () => {},
    }),
    useInView: () => true,
    useReducedMotion: () => false,
    animate: () => ({ stop: () => {}, then: (fn: () => void) => fn() }),
    stagger: () => 0,
  }
})

// lucide-react: replace every icon component with a plain <span data-testid="icon-Name">
vi.mock("lucide-react", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>
  return Object.fromEntries(
    Object.entries(actual).map(([key, val]) => [
      key,
      typeof val === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ className }: any) => createElement("span", { "data-testid": `icon-${key}`, className })
        : val,
    ]),
  )
})

// window.matchMedia stub required by some components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// jsdom doesn't implement scrollTo
Object.defineProperty(window, "scrollTo", { writable: true, value: vi.fn() })

// IntersectionObserver / ResizeObserver stubs
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IntersectionObserver = MockIntersectionObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = MockResizeObserver

// URL.createObjectURL for file previews
if (typeof URL.createObjectURL === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(URL as any).createObjectURL = () => "blob:mock"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(URL as any).revokeObjectURL = () => {}
}

// leaflet + react-leaflet: tests don't render real maps
vi.mock("leaflet", () => ({
  default: {
    Icon: class {},
    divIcon: () => ({}),
    marker: () => ({ addTo: () => ({}) }),
    map: () => ({ setView: () => ({}), remove: () => {} }),
    tileLayer: () => ({ addTo: () => ({}) }),
    latLng: (lat: number, lng: number) => ({ lat, lng }),
  },
  Icon: class {},
  divIcon: () => ({}),
  latLng: (lat: number, lng: number) => ({ lat, lng }),
}))
vi.mock("react-leaflet", () => {
  const passthrough = (name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = ({ children }: any) =>
      createElement("div", { "data-testid": `leaflet-${name}` }, children)
    Component.displayName = `MockLeaflet${name}`
    return Component
  }
  return {
    MapContainer: passthrough("MapContainer"),
    TileLayer: passthrough("TileLayer"),
    Marker: passthrough("Marker"),
    Popup: passthrough("Popup"),
    Polyline: passthrough("Polyline"),
    Circle: passthrough("Circle"),
    Tooltip: passthrough("Tooltip"),
    useMap: () => ({ setView: () => {} }),
    useMapEvents: () => ({}),
  }
})
