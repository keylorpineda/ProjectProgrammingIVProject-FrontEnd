import "@testing-library/jest-dom"
import { createElement, type ReactNode } from "react"
import { vi } from "vitest"

// framer-motion: render children directly, skip all animation props
vi.mock("framer-motion", () => {
  const tags = [
    "div",
    "span",
    "p",
    "section",
    "article",
    "header",
    "footer",
    "ul",
    "li",
    "button",
    "a",
    "form",
    "input",
    "label",
    "h1",
    "h2",
    "h3",
  ]
  const animProps = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "variants",
    "layout",
    "layoutId",
  ])
  const motion = Object.fromEntries(
    tags.map((tag) => [
      tag,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ children, ...rest }: any) => {
        const safeProps = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !animProps.has(k)),
        )
        return createElement(tag, safeProps, children)
      },
    ]),
  )
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
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
