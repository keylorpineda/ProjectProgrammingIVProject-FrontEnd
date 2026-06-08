import { describe, expect, it } from "vitest"

describe("Vitest harness smoke test", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2)
  })

  it("has jest-dom matchers", () => {
    const div = document.createElement("div")
    div.textContent = "hi"
    expect(div).toHaveTextContent("hi")
  })
})
