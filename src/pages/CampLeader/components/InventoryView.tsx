import { AlertTriangle } from "lucide-react"
import { useState } from "react"

import type { Inventory, ResourceCategory } from "../types"

interface InventoryViewProps {
  inventory: Inventory[]
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🌽",
  water: "💧",
  medicine: "💊",
  tools: "🔧",
  weapons: "⚔️",
  fuel: "⛽",
}

const CATEGORY_FILTERS = [
  { id: "food" as ResourceCategory, label: "COMIDA", icon: "🌽" },
  { id: "water" as ResourceCategory, label: "AGUA", icon: "💧" },
  { id: "medicine" as ResourceCategory, label: "MEDICINA", icon: "💊" },
  { id: "tools" as ResourceCategory, label: "HERRAMIENTAS", icon: "🔧" },
  { id: "weapons" as ResourceCategory, label: "ARMAMENTO", icon: "⚔️" },
]

export default function InventoryView({ inventory }: InventoryViewProps) {
  const [filterCategory, setFilterCategory] = useState<ResourceCategory | "ALL">("ALL")

  // Filter materials based on category selections
  const filteredInventory = inventory.filter((inv) => {
    return filterCategory === "ALL" || inv.resource.category === filterCategory
  })

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#c27c2f] pb-6">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider">
            BODEGA CENTRAL DE SUMINISTROS
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
            INVENTARIO · REFUGIO ALFA
          </p>
        </div>
        <div className="vintage-tape shrink-0 text-sm px-4 py-2">LOGÍSTICA</div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-4 py-2.5 font-mono text-xs uppercase font-bold tracking-wider border-2 cursor-pointer transition-all flex items-center gap-2 ${
            filterCategory === "ALL"
              ? "bg-[#c27c2f] text-white border-[#c27c2f] shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
              : "bg-transparent border-[#9a8a74]/60 text-[#c8bfae] hover:border-[#c27c2f] hover:text-[#fca311]"
          }`}
        >
          TODO
        </button>

        {CATEGORY_FILTERS.map((cat) => {
          const isActive = filterCategory === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              aria-pressed={isActive}
              className={`px-4 py-2.5 font-mono text-xs uppercase font-bold tracking-wider border-2 flex items-center gap-2 cursor-pointer transition-all ${
                isActive
                  ? "bg-[#c27c2f] text-white border-[#c27c2f] shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                  : "bg-transparent border-[#9a8a74]/60 text-[#c8bfae] hover:border-[#c27c2f] hover:text-[#fca311]"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* INVENTARIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInventory.map((inv) => {
          const ratio = Math.min(
            100,
            (inv.current_quantity / (inv.minimum_stock_required || 1)) * 100,
          )

          return (
            <div
              key={inv.resource_id}
              className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] flex flex-col gap-5 p-6"
              style={{ borderLeft: `6px solid ${inv.alert_active ? "#9c2720" : "#4c6351"}` }}
            >
              {/* CABECERA */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-black flex items-center justify-center bg-black/10 shrink-0 text-2xl">
                    {CATEGORY_EMOJI[inv.resource.category] ?? "📦"}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-black/50 block uppercase tracking-wider">
                      {inv.resource.category}
                    </span>
                    <h3 className="font-typewriter text-lg font-bold text-black uppercase leading-tight">
                      {inv.resource.name}
                    </h3>
                  </div>
                </div>

                {inv.alert_active ? (
                  <div className="flex items-center gap-1.5 text-white text-xs font-bold font-mono border-2 border-black bg-[#9c2720] px-2.5 py-1.5 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    BAJO MÍN.
                  </div>
                ) : (
                  <div className="text-white border-2 border-black bg-[#4c6351] text-xs font-bold font-mono px-2.5 py-1.5 shrink-0">
                    STOCK OK
                  </div>
                )}
              </div>

              {/* CANTIDAD Y BARRA */}
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-black/60 uppercase">Stock actual:</span>
                  <span className="font-typewriter text-3xl font-bold text-black">
                    {inv.current_quantity}{" "}
                    <span className="text-sm text-black/50">{inv.resource.unit}</span>
                  </span>
                </div>

                <div className="w-full h-3 bg-black/15 border border-black/20 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${ratio}%`,
                      backgroundColor: inv.alert_active ? "#9c2720" : "#4c6351",
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-black/60">
                  <span>
                    MÍN: {inv.minimum_stock_required} {inv.resource.unit}
                  </span>
                  <span className="font-bold text-black">{Math.round(ratio)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
