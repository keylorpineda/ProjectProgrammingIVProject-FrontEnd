// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react"
import { motion } from "framer-motion"
import type { Inventory, ResourceCategory } from "../types"
import { Boxes, Flame, Droplet, HeartPulse, Wrench, Sword, AlertTriangle, Grid } from "lucide-react"

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
    <div className="p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-[#c27c2f]/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
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

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-wrap gap-2 bg-black/40 p-4 border border-[#3b4d3e] rounded">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-3 py-1.5 font-mono text-[10px] uppercase font-bold tracking-wider rounded border cursor-pointer ${
            filterCategory === "ALL"
              ? "bg-[#c27c2f] text-black border-black font-semibold"
              : "bg-[#111] border-[#3b4d3e]/60 text-zinc-400 hover:text-[#fca311]"
          }`}
        >
          VER TODO EL STOCK
        </button>

        {[
          { id: "food", label: "Raciones Comida", icon: Flame },
          { id: "water", label: "Agua Filtrada", icon: Droplet },
          { id: "medicine", label: "Medicos e Inmunes", icon: HeartPulse },
          { id: "tools", label: "Repuestos Chatarra", icon: Wrench },
          { id: "weapons", label: "Municion Balistica", icon: Sword },
        ].map((cat) => {
          const IconComp = cat.icon
          const isActive = filterCategory === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as ResourceCategory)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase font-bold tracking-wider rounded border flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-[#9a9080] text-black border-black font-semibold"
                  : "bg-[#111] border-[#3b4d3e]/60 text-zinc-400 hover:text-[#fca311]"
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* WAREHOUSE GRID ITEMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredInventory.map((inv) => {
          const ratio = Math.min(
            100,
            (inv.current_quantity / (inv.minimum_stock_required || 1)) * 100,
          )

          return (
            <div
              key={inv.resource_id}
              className={`bg-[#9a9080] border border-black relative overflow-hidden text-black transition-transform hover:scale-[1.01] p-5 relative overflow-hidden flex flex-col justify-between ${inv.alert_active ? "warning-card border-l-[12px]" : ""}`}
              style={{ transform: `rotate(${Math.sin(inv.resource_id) * 0.4}deg)` }}
            >
              {/* Alert Active Pulsing design bar on background of cards */}
              {inv.alert_active && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-red-600 animate-pulse" />
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-black/5 rounded">
                    {getCategoryIcon(inv.resource.category)}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-600 block uppercase">
                      CATEGORÍA: {inv.resource.category}
                    </span>
                    <h3 className="font-typewriter text-sm font-bold text-black uppercase tracking-tight">
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
              <div className="space-y-2 font-mono">
                <div className="flex justify-between items-end text-xs">
                  <span className="text-zinc-600">STOCK ALMACENADO:</span>
                  <span className="font-typewriter text-md font-bold text-zinc-950">
                    {inv.current_quantity} {inv.resource.unit}
                  </span>
                </div>

                {/* Main Progress bar */}
                <div className="w-full h-3 bg-black/10 border border-black/25 rounded-sm overflow-hidden p-[2px]">
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
                  <span className="font-bold">{Math.round(ratio)}% STOCK</span>
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
