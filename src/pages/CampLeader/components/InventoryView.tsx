/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Boxes, Flame, Droplet, HeartPulse, Wrench, Sword, AlertTriangle } from "lucide-react"
import { useState } from "react"

import type { Inventory, ResourceCategory } from "../types"

interface InventoryViewProps {
  inventory: Inventory[]
}

export default function InventoryView({ inventory }: InventoryViewProps) {
  const [filterCategory, setFilterCategory] = useState<ResourceCategory | "ALL">("ALL")

  // Filter materials based on category selections
  const filteredInventory = inventory.filter((inv) => {
    return filterCategory === "ALL" || inv.resource.category === filterCategory
  })

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case "food":
        return <Flame className="w-5 h-5 text-amber-500" />
      case "water":
        return <Droplet className="w-5 h-5 text-blue-400" />
      case "medicine":
        return <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
      case "tools":
        return <Wrench className="w-5 h-5 text-zinc-400" />
      case "weapons":
        return <Sword className="w-5 h-5 text-[#9c2720]" />
      default:
        return <Boxes className="w-5 h-5 text-amber-500" />
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-[#c27c2f]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase">
            BODEGA CENTRAL DE SUMINISTROS
          </h2>
          <p className="font-mono text-xs text-[#fca311]/60 uppercase tracking-widest">
            AUDITORÍA HISTÓRICA DE RACIONES Y ELEMENTOS EN EL REFUGIO ALFA
          </p>
        </div>
        <div className="vintage-tape mt-2 md:mt-0">LOGÍSTICA CONFIDENCIAL</div>
      </div>

      {/* FILTER BUTTONS ROW — horizontally scrollable on mobile */}
      <div className="bg-black/40 p-3 border border-[#3b4d3e] rounded">
        <div
          className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-2 font-mono text-xs uppercase font-semibold tracking-wide rounded border cursor-pointer shrink-0 min-h-[44px] ${
              filterCategory === "ALL"
                ? "bg-[#c27c2f] text-black border-black"
                : "bg-[#111] border-[#3b4d3e]/60 text-zinc-400 hover:text-[#fca311]"
            }`}
          >
            Todo
          </button>

          {[
            { id: "food", label: "Comida", icon: Flame },
            { id: "water", label: "Agua", icon: Droplet },
            { id: "medicine", label: "Medicina", icon: HeartPulse },
            { id: "tools", label: "Herramientas", icon: Wrench },
            { id: "weapons", label: "Armamento", icon: Sword },
          ].map((cat) => {
            const IconComp = cat.icon
            const isActive = filterCategory === cat.id

            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id as ResourceCategory)}
                aria-pressed={isActive}
                className={`px-3 py-2 font-mono text-xs uppercase font-semibold tracking-wide rounded border flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
                  isActive
                    ? "bg-[#9a9080] text-black border-black"
                    : "bg-[#111] border-[#3b4d3e]/60 text-zinc-400 hover:text-[#fca311]"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* WAREHOUSE GRID ITEMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInventory.map((inv) => {
          const ratio = Math.min(
            100,
            (inv.current_quantity / (inv.minimum_stock_required || 1)) * 100,
          )

          return (
            <div
              key={inv.resource_id}
              className={`bg-[#9a9080] border border-black relative overflow-hidden text-black transition-transform hover:scale-[1.01] p-6 flex flex-col justify-between ${inv.alert_active ? "warning-card" : ""}`}
              style={{ transform: `rotate(${Math.sin(inv.resource_id) * 0.4}deg)` }}
            >
              {/* Alert top bar indicator */}
              {inv.alert_active && (
                <div className="absolute top-0 right-0 left-0 h-[3px] bg-[#9c2720]" />
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 border-2 border-black flex items-center justify-center bg-black/5 rounded shrink-0">
                    {getCategoryIcon(inv.resource.category)}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold tracking-widest text-zinc-600 block uppercase mb-1">
                      {inv.resource.category}
                    </span>
                    <h3 className="font-typewriter text-lg font-bold text-black uppercase tracking-tight">
                      {inv.resource.name}
                    </h3>
                  </div>
                </div>

                {inv.alert_active ? (
                  <div className="flex items-center gap-1 bg-red-950 text-red-100 text-[11px] font-bold font-mono px-2 py-1 rounded border border-red-700 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    BAJO MÍNIMO
                  </div>
                ) : (
                  <div className="bg-emerald-950/20 text-[#2c3d31] border border-[#2c3d31]/50 text-[11px] font-bold font-mono px-2 py-1 rounded">
                    STOCK OK
                  </div>
                )}
              </div>

              {/* Progress Quantity Bars */}
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-600 font-bold uppercase">Stock:</span>
                  <span className="font-typewriter text-2xl font-bold text-zinc-950">
                    {inv.current_quantity} <span className="text-sm">{inv.resource.unit}</span>
                  </span>
                </div>

                {/* Main Progress bar */}
                <div className="w-full h-4 bg-black/10 border border-black/25 rounded-sm overflow-hidden p-[2px]">
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ${
                      inv.alert_active ? "bg-[#9c2720]" : "bg-[#3b4d3e]"
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-zinc-600">
                  <span>
                    MÍN: {inv.minimum_stock_required} {inv.resource.unit}
                  </span>
                  <span className="font-bold text-sm">{Math.round(ratio)}% STOCK</span>
                </div>
              </div>

              {/* Category-specific descriptions */}
              <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-[10px] font-mono text-zinc-700">
                <span>REGISTRO LOGISTICO COSTA GRIS</span>
                <span>REG. LOG: #{200 + inv.resource_id}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
