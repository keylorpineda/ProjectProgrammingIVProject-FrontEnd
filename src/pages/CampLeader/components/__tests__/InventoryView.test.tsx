import { fireEvent } from "@testing-library/dom"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import InventoryView from "../InventoryView"

import type { Inventory } from "../../types"

const mockInventory = [
  {
    camp_id: 1,
    resource_id: 10,
    current_quantity: 120,
    minimum_stock_required: 100,
    alert_active: false,
    resource: {
      id: 10,
      name: "Agua limpia",
      unit: "L",
      category: "water",
    },
  },
  {
    camp_id: 1,
    resource_id: 20,
    current_quantity: 30,
    minimum_stock_required: 50,
    alert_active: true,
    resource: {
      id: 20,
      name: "Raciones de comida",
      unit: "Units",
      category: "food",
    },
  },
] as unknown as Inventory[]

describe("InventoryView Component", () => {
  it("renders all inventory items correctly with stock status", () => {
    render(<InventoryView inventory={mockInventory} />)

    expect(screen.getByText("BODEGA CENTRAL DE SUMINISTROS")).toBeInTheDocument()
    expect(screen.getByText("Agua limpia")).toBeInTheDocument()
    expect(screen.getByText("Raciones de comida")).toBeInTheDocument()

    // Alert check
    expect(screen.getByText("BAJO MÍN.")).toBeInTheDocument()
    expect(screen.getByText("STOCK OK")).toBeInTheDocument()
  })

  it("filters inventory items by category button click", () => {
    render(<InventoryView inventory={mockInventory} />)

    // Click on AGUA category filter button
    const waterBtn = screen.getByRole("button", { name: /agua/i })
    fireEvent.click(waterBtn)

    // Only "Agua limpia" should be shown
    expect(screen.getByText("Agua limpia")).toBeInTheDocument()
    expect(screen.queryByText("Raciones de comida")).not.toBeInTheDocument()

    // Click TODO (ALL) to reset
    const allBtn = screen.getByRole("button", { name: /TODO/i })
    fireEvent.click(allBtn)

    expect(screen.getByText("Agua limpia")).toBeInTheDocument()
    expect(screen.getByText("Raciones de comida")).toBeInTheDocument()
  })

  it("handles edge cases for fallback emoji and zero minimum stock", () => {
    const edgeCaseInventory = [
      {
        camp_id: 1,
        resource_id: 30,
        current_quantity: 10,
        minimum_stock_required: 0,
        alert_active: false,
        resource: {
          id: 30,
          name: "Item Extra",
          unit: "Units",
          category: "unknown-category",
        },
      },
    ] as unknown as Inventory[]

    render(<InventoryView inventory={edgeCaseInventory} />)

    // Falls back to "📦"
    expect(screen.getByText("📦")).toBeInTheDocument()
    expect(screen.getByText("Item Extra")).toBeInTheDocument()
  })
})
