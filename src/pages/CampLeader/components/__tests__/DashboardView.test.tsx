import { fireEvent } from "@testing-library/dom"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import DashboardView from "../DashboardView"

import type {
  Exploration,
  Transfer,
  Inventory,
  CampBalance,
  InventoryMovement,
  CampStatistics,
} from "../../types"

const mockExplorations: Exploration[] = [
  {
    id: 1,
    camp_id: 1,
    name: "Busqueda zona A",
    destination_description: "Norte [10.0, -84.0]",
    departure_date: "2026-06-08T10:00:00Z",
    estimated_days: 3,
    grace_days: 1,
    real_return_date: null,
    status: "in_progress",
    notes: "",
    user_create_id: "5",
    created_at: "",
    updated_at: "",
    explorationPersons: [{ person: { first_name: "Joel" } }],
    explorationResources: [],
  } as unknown as Exploration,
]

const mockTransfers: Transfer[] = [
  {
    id: 100,
    origin_camp_id: 2,
    destination_camp_id: 1,
    resource_id: 10,
    quantity: 50,
    status: "pending",
    requested_by_user_id: 1,
    notes: "",
    resource: { id: 10, name: "Agua", unit: "L", category: "water" },
    origin_camp: { id: 2, name: "Beta" },
    destination_camp: { id: 1, name: "Alpha" },
  },
]

const mockInventory: Inventory[] = [
  {
    camp_id: 1,
    resource_id: 10,
    current_quantity: 120,
    minimum_stock_required: 100,
    alert_active: false,
    resource: {
      id: 10,
      name: "Agua",
      unit: "L",
      category: "water",
    },
  },
]

const mockBalances: CampBalance[] = [
  {
    resource_id: 10,
    resource_name: "Agua",
    production: 15,
    consumption: 10,
    net: 5,
  },
]

const mockMovements: InventoryMovement[] = [
  {
    id: 201,
    camp_id: 1,
    resource_id: 10,
    quantity: 50,
    type: "input_manual",
    notes: "Restock",
    created_at: "2026-06-08T10:30:00Z",
  },
]

const mockStats: CampStatistics = {
  total_persons: 10,
  active_workers: 8,
  injured_or_sick: 0,
  exploring: 2,
  deceased: 0,
  occupancy_rate: 20,
  explorations_completed: 5,
  survival_score: 450, // VETERANO rank
}

describe("DashboardView Component", () => {
  it("renders metrics, balance bars, explorations, and movements correctly", () => {
    const onNavigate = vi.fn()
    render(
      <DashboardView
        explorations={mockExplorations}
        transfers={mockTransfers}
        inventory={mockInventory}
        balances={mockBalances}
        movements={mockMovements}
        statistics={mockStats}
        onNavigate={onNavigate}
      />,
    )

    // Metric Cards checks
    expect(screen.getByText("EQUIPOS EN CAMPO")).toBeInTheDocument()
    expect(screen.getByText("CONVOYES PENDIENTES")).toBeInTheDocument()

    // Title / Time checks
    expect(screen.getByText("TABLERO DE MANDO - RESUMEN OPERATIVO")).toBeInTheDocument()

    // Expeditions checks
    expect(screen.getByText("Busqueda zona A")).toBeInTheDocument()
    expect(screen.getByText("DESTINO: Norte")).toBeInTheDocument()
    expect(screen.getByText(/Joel/i)).toBeInTheDocument()

    // Balances checks
    expect(screen.getAllByText(/agua/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/agua net:/i)).toBeInTheDocument()
    expect(screen.getAllByText("+5").length).toBeGreaterThan(0)

    // Movements checks
    expect(screen.getByText("#L-201")).toBeInTheDocument()
    expect(screen.getByText("Restock")).toBeInTheDocument()

    // Navigate triggers
    fireEvent.click(screen.getByText("EQUIPOS EN CAMPO"))
    expect(onNavigate).toHaveBeenCalledWith("explorations")
  })

  it("handles empty lists gracefully", () => {
    render(
      <DashboardView
        explorations={[]}
        transfers={[]}
        inventory={[]}
        balances={[]}
        movements={[]}
        statistics={mockStats}
        onNavigate={() => {}}
      />,
    )

    expect(screen.getByText("NINGÚN EQUIPO EN OPERACIÓN EXTERIOR")).toBeInTheDocument()
    expect(screen.getByText("SIN DATOS DE BALANCE")).toBeInTheDocument()
    expect(screen.getByText("SIN MOVIMIENTOS REGISTRADOS")).toBeInTheDocument()
  })

  it("handles other metric card navigations", () => {
    const onNavigate = vi.fn()
    render(
      <DashboardView
        explorations={[]}
        transfers={mockTransfers}
        inventory={mockInventory}
        balances={[]}
        movements={[]}
        statistics={mockStats}
        onNavigate={onNavigate}
      />,
    )

    fireEvent.click(screen.getByText("CONVOYES PENDIENTES"))
    expect(onNavigate).toHaveBeenCalledWith("transfers")

    fireEvent.click(screen.getByText("ALERTAS DE BODEGA"))
    expect(onNavigate).toHaveBeenCalledWith("inventory")

    fireEvent.click(screen.getByText(/PUNTUACIÓN:/i))
    expect(onNavigate).toHaveBeenCalledWith("profile")
  })

  it("renders critical stocks alert active properly", () => {
    const criticalInventory: Inventory[] = [
      {
        camp_id: 1,
        resource_id: 10,
        current_quantity: 5,
        minimum_stock_required: 100,
        alert_active: true,
        resource: {
          id: 10,
          name: "Agua",
          unit: "L",
          category: "water",
        },
      },
    ]

    render(
      <DashboardView
        explorations={[]}
        transfers={[]}
        inventory={criticalInventory}
        balances={[]}
        movements={[]}
        statistics={mockStats}
        onNavigate={() => {}}
      />,
    )

    expect(screen.getByText("RECURSOS BAJO MÍNIMO")).toBeInTheDocument()
  })

  it("renders movement with negative quantity without plus prefix", () => {
    const negativeMovement: InventoryMovement[] = [
      {
        id: 202,
        camp_id: 1,
        resource_id: 10,
        quantity: -15,
        type: "consumption",
        notes: "Used supplies",
        created_at: "2026-06-08T11:00:00Z",
      },
    ]
    render(
      <DashboardView
        explorations={[]}
        transfers={[]}
        inventory={mockInventory}
        balances={[]}
        movements={negativeMovement}
        statistics={mockStats}
        onNavigate={() => {}}
      />,
    )
    expect(screen.getAllByText("-15").length).toBeGreaterThan(0)
    expect(screen.queryByText("+-15")).not.toBeInTheDocument()
  })

  it("renders RECURSO fallback name when resource_id not in inventory map", () => {
    const unknownResourceMovement: InventoryMovement[] = [
      {
        id: 203,
        camp_id: 1,
        resource_id: 999,
        quantity: 10,
        type: "input_manual",
        notes: "Unknown item",
        created_at: "2026-06-08T12:00:00Z",
      },
    ]
    render(
      <DashboardView
        explorations={[]}
        transfers={[]}
        inventory={[]}
        balances={[]}
        movements={unknownResourceMovement}
        statistics={mockStats}
        onNavigate={() => {}}
      />,
    )
    expect(screen.getByText("RECURSO #999")).toBeInTheDocument()
  })

  it("renders negative balance net without plus prefix", () => {
    const negativeBalance: CampBalance[] = [
      {
        resource_id: 10,
        resource_name: "Agua",
        production: 5,
        consumption: 20,
        net: -15,
      },
    ]
    render(
      <DashboardView
        explorations={[]}
        transfers={[]}
        inventory={mockInventory}
        balances={negativeBalance}
        movements={[]}
        statistics={mockStats}
        onNavigate={() => {}}
      />,
    )
    expect(screen.getAllByText("-15").length).toBeGreaterThan(0)
    expect(screen.queryByText("+-15")).not.toBeInTheDocument()
  })

  it("renders critical food stock alert", () => {
    const foodCritical: Inventory[] = [
      {
        camp_id: 1,
        resource_id: 2,
        current_quantity: 3,
        minimum_stock_required: 50,
        alert_active: true,
        resource: { id: 2, name: "Comida", unit: "Raciones", category: "food" },
      },
    ]
    render(
      <DashboardView
        explorations={[]}
        transfers={[]}
        inventory={foodCritical}
        balances={[]}
        movements={[]}
        statistics={mockStats}
        onNavigate={() => {}}
      />,
    )
    expect(screen.getByText("RECURSOS BAJO MÍNIMO")).toBeInTheDocument()
  })

  it("renders correct ranks based on survival score", () => {
    const checkRank = (score: number, expectedLabel: string) => {
      const stats = { ...mockStats, survival_score: score }
      render(
        <DashboardView
          explorations={[]}
          transfers={[]}
          inventory={[]}
          balances={[]}
          movements={[]}
          statistics={stats}
          onNavigate={() => {}}
        />,
      )
      expect(screen.getByText(new RegExp(expectedLabel, "i"))).toBeInTheDocument()
      // Clean up DOM between checks
      render(<div></div>)
    }

    checkRank(900, "LEYENDA")
    checkRank(700, "COMANDANTE")
    checkRank(350, "VETERANO")
    checkRank(150, "EXPLORADOR")
    checkRank(50, "RECLUTA")
  })
})
