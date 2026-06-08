import { motion } from "framer-motion"
import { ArrowRight, User } from "lucide-react"

import type {
  CampBalance,
  CampStatistics,
  Exploration,
  Inventory,
  InventoryMovement,
  Transfer,
} from "../types"

interface DashboardViewProps {
  explorations: Exploration[]
  transfers: Transfer[]
  inventory: Inventory[]
  balances: CampBalance[]
  movements: InventoryMovement[]
  statistics: CampStatistics
  onNavigate: (tab: string) => void
}

function getRankInfo(score: number) {
  if (score >= 900)
    return {
      label: "LEYENDA DEL PÁRAMO",
      color: "#fca311",
      nextThreshold: null,
      prevThreshold: 900,
    }
  if (score >= 600)
    return { label: "COMANDANTE", color: "#c27c2f", nextThreshold: 900, prevThreshold: 600 }
  if (score >= 300)
    return { label: "VETERANO", color: "#ab9e8b", nextThreshold: 600, prevThreshold: 300 }
  if (score >= 100)
    return { label: "EXPLORADOR", color: "#3b7a5a", nextThreshold: 300, prevThreshold: 100 }
  return { label: "RECLUTA", color: "#71717a", nextThreshold: 100, prevThreshold: 0 }
}

function cleanDesc(desc: string): string {
  return desc.replace(/\s*\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/, "").trim()
}

export default function DashboardView({
  explorations,
  transfers,
  inventory,
  balances,
  movements,
  statistics,
  onNavigate,
}: DashboardViewProps) {
  const activeExplorations = explorations.filter((e) => e.status === "in_progress")
  const pendingTransfers = transfers.filter((t) => t.status === "pending")

  const criticalStocks = inventory.filter(
    (i) => i.alert_active && (i.resource.category === "food" || i.resource.category === "water"),
  )

  const resourceNameMap = new Map(inventory.map((inv) => [inv.resource_id, inv.resource.name]))

  const rank = getRankInfo(statistics.survival_score)
  const rankProgress =
    rank.nextThreshold !== null
      ? Math.min(
          100,
          ((statistics.survival_score - rank.prevThreshold) /
            (rank.nextThreshold - rank.prevThreshold)) *
            100,
        )
      : 100

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, type: "spring" as const, stiffness: 100 },
    },
  }

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 140 } },
  }

  return (
    <motion.div
      className="p-5 lg:p-6 flex flex-col gap-5"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ENCABEZADO */}
      <div className="border-b-4 border-[#c27c2f] pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold tracking-wider text-[#fca311] uppercase">
            Tablero de Mando
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-widest mt-1">
            Resumen operativo del campamento
          </p>
        </div>
        <div className="vintage-tape shrink-0 text-sm px-4 py-2">CONTROL ACTIVO</div>
      </div>

      {/* CUATRO MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Exploraciones */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("explorations")}
          className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-5 flex flex-col gap-3 cursor-pointer group hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] transition-all"
          style={{ borderLeft: "6px solid #c27c2f" }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider">
              EQUIPOS EN CAMPO
            </span>
            <span className="text-xl select-none">🧭</span>
          </div>
          <div>
            <span className="font-typewriter text-5xl font-black text-black block">
              {activeExplorations.length}
            </span>
            <span className="font-mono text-xs text-black/60 uppercase">
              EQUIPOS EN ZONA MUERTA
            </span>
          </div>
          <div className="border-t-2 border-black/15 pt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-black/60 uppercase">VER EXPEDICIONES</span>
            <ArrowRight className="w-4 h-4 text-black/50 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Card 2: Traslados */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("transfers")}
          className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-5 flex flex-col gap-3 cursor-pointer group hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] transition-all"
          style={{ borderLeft: "6px solid #4c6351" }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider">
              CONVOYES PENDIENTES
            </span>
            <span className="text-xl select-none">🚛</span>
          </div>
          <div>
            <span className="font-typewriter text-5xl font-black text-black block">
              {pendingTransfers.length}
            </span>
            <span className="font-mono text-xs text-black/60 uppercase">TRASLADOS EN ESPERA</span>
          </div>
          <div className="border-t-2 border-black/15 pt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-black/60 uppercase">REVISAR COLA</span>
            <ArrowRight className="w-4 h-4 text-black/50 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Card 3: Alertas de bodega */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("inventory")}
          className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-5 flex flex-col gap-3 cursor-pointer group hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] transition-all"
          style={{ borderLeft: `6px solid ${criticalStocks.length > 0 ? "#9c2720" : "#4c6351"}` }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider">
              ALERTAS DE BODEGA
            </span>
            <span className="text-xl select-none">{criticalStocks.length > 0 ? "⚠️" : "✅"}</span>
          </div>
          <div>
            {criticalStocks.length > 0 ? (
              <>
                <span className="font-typewriter text-5xl font-black text-[#9c2720] block">
                  {criticalStocks.length}
                </span>
                <span className="font-mono text-xs text-[#9c2720] uppercase font-bold">
                  RECURSOS BAJO MÍNIMO
                </span>
              </>
            ) : (
              <>
                <span className="font-typewriter text-2xl font-black text-[#4c6351] block uppercase">
                  SEGURO
                </span>
                <span className="font-mono text-xs text-black/60 uppercase">RACIONES ESTABLES</span>
              </>
            )}
          </div>
          <div className="border-t-2 border-black/15 pt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-black/60 uppercase">VER INVENTARIO</span>
            <ArrowRight className="w-4 h-4 text-black/50 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Card 4: Puntuación */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("profile")}
          className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-5 flex flex-col gap-3 cursor-pointer group hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] transition-all"
          style={{ borderLeft: `6px solid ${rank.color}` }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider">
              PUNTUACIÓN
            </span>
            <span className="text-xl select-none">🏆</span>
          </div>
          <div>
            <span
              className="font-typewriter text-5xl font-black block"
              style={{ color: rank.color }}
            >
              {statistics.survival_score}
            </span>
            <span className="font-mono text-xs uppercase font-bold" style={{ color: rank.color }}>
              {rank.label}
            </span>
          </div>
          <div className="w-full h-2 bg-black/15 border border-black/20 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${rankProgress}%`, backgroundColor: rank.color }}
            />
          </div>
          <div className="border-t-2 border-black/15 pt-2 flex items-center justify-between">
            <span className="font-mono text-xs text-black/60 uppercase">
              {statistics.explorations_completed} EXPEDICIONES
            </span>
            <ArrowRight className="w-4 h-4 text-black/50 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </div>

      {/* COLUMNAS: EXCURSIONISTAS ACTIVOS + BALANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel izquierdo: excursionistas en zona */}
        <motion.div
          variants={itemVariants}
          className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-6 lg:col-span-8"
          style={{ borderLeft: "6px solid #c27c2f" }}
        >
          <div className="flex items-center gap-3 border-b-2 border-black/15 pb-4 mb-4">
            <span className="text-xl select-none">🧭</span>
            <h3 className="font-typewriter text-lg font-bold tracking-wider text-black uppercase">
              Excursionistas en Zona Muerta
            </h3>
          </div>

          {activeExplorations.length === 0 ? (
            <div className="border-2 border-dashed border-black/20 text-center py-10">
              <p className="font-mono text-xs text-black/40 uppercase font-bold">
                NINGÚN EQUIPO EN OPERACIÓN EXTERIOR
              </p>
              <button
                type="button"
                className="font-mono text-xs text-[#c27c2f] mt-2 cursor-pointer hover:underline bg-transparent border-none p-0 inline-block"
                onClick={() => onNavigate("explorations")}
              >
                ORGANIZAR NUEVA BÚSQUEDA &gt;&gt;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeExplorations.map((exp) => {
                const crewNames = exp.explorationPersons.map((p) => p.person.first_name).join(", ")
                return (
                  <div
                    key={exp.id}
                    className="bg-black/5 border border-black/15 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                    style={{ borderLeft: "4px solid #c27c2f" }}
                  >
                    <div className="pl-1">
                      <span className="font-mono text-xs text-[#c27c2f] font-bold tracking-widest block">
                        MISIÓN #{exp.id} &bull; {exp.departure_date.split("T")[0]}
                      </span>
                      <h4 className="font-typewriter text-sm text-black font-bold uppercase mt-0.5">
                        {exp.name}
                      </h4>
                      <p className="font-mono text-xs text-black/60 mt-1 uppercase">
                        DESTINO: {cleanDesc(exp.destination_description)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <User className="w-3.5 h-3.5 text-black/40 shrink-0" />
                        <span className="font-mono text-xs text-black/60">
                          CONTINGENTE: <span className="font-bold text-black">{crewNames}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:text-right shrink-0">
                      <span className="font-typewriter text-sm font-bold text-[#c27c2f] block">
                        {exp.estimated_days}D (+{exp.grace_days}G)
                      </span>
                      <span className="font-mono text-[10px] text-black/50 uppercase block mt-1">
                        RETORNO ESTIMADO
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Panel derecho: balance diario */}
        <motion.div
          variants={itemVariants}
          className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-6 lg:col-span-4"
          style={{ borderLeft: "6px solid #4c6351" }}
        >
          <div className="flex items-center gap-3 border-b-2 border-black/15 pb-4 mb-4">
            <span className="text-xl select-none">⚖️</span>
            <h3 className="font-typewriter text-lg font-bold tracking-wider text-black uppercase">
              Balance Diario
            </h3>
          </div>

          <p className="font-mono text-xs text-black/40 uppercase font-bold mb-3">
            CONSUMO VS PRODUCCIÓN
          </p>

          {balances.length === 0 ? (
            <p className="font-mono text-xs text-black/40 text-center py-6 uppercase font-bold">
              SIN DATOS DE BALANCE
            </p>
          ) : (
            <div className="space-y-4">
              {balances.map((bal) => {
                const isPositive = bal.net >= 0
                return (
                  <div key={bal.resource_id} className="bg-black/5 border border-black/15 p-3">
                    <div className="flex justify-between items-center font-mono text-sm">
                      <span className="text-black font-bold uppercase">{bal.resource_name}</span>
                      <span
                        className={`font-bold ${isPositive ? "text-[#4c6351]" : "text-[#9c2720]"}`}
                      >
                        {isPositive ? `+${bal.net}` : bal.net} / DÍA
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/10 border border-black/15 mt-2 overflow-hidden flex">
                      <div
                        className="bg-[#9c2720] h-full"
                        style={{
                          width: `${Math.min(100, (bal.consumption / (bal.production + bal.consumption || 1)) * 100)}%`,
                        }}
                      />
                      <div
                        className="bg-[#4c6351] h-full"
                        style={{
                          width: `${Math.min(100, (bal.production / (bal.production + bal.consumption || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-mono text-black/50 mt-1">
                      <span>CONSUMO: -{bal.consumption}</span>
                      <span>PROD: +{bal.production}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* HISTORIAL DE MOVIMIENTOS */}
      <motion.div
        variants={itemVariants}
        className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] p-6"
        style={{ borderLeft: "6px solid #5a5040" }}
      >
        <div className="flex items-center gap-3 border-b-2 border-black/15 pb-4 mb-4">
          <span className="text-xl select-none">📋</span>
          <h3 className="font-typewriter text-lg font-bold tracking-wider text-black uppercase">
            Historial de Logs de Reserva
          </h3>
        </div>

        {movements.length === 0 ? (
          <p className="font-mono text-xs text-black/40 text-center py-6 uppercase font-bold">
            SIN MOVIMIENTOS REGISTRADOS
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black/15">
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">FECHA</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">LOG ID</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">RECURSO</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">CANTIDAD</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">TIPO</th>
                  <th className="pb-2 text-black/50 uppercase font-bold">NOTAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {movements.slice(0, 5).map((mov) => {
                  const isAddition = mov.quantity > 0
                  const resourceName =
                    resourceNameMap.get(mov.resource_id) ?? `RECURSO #${mov.resource_id}`
                  return (
                    <tr key={mov.id} className="text-black/70 hover:bg-black/5">
                      <td className="py-2.5 pr-4 text-black/50">
                        {mov.created_at.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-2.5 pr-4 font-bold text-[#c27c2f]">#L-{mov.id}</td>
                      <td className="py-2.5 pr-4 font-bold uppercase text-black">{resourceName}</td>
                      <td
                        className={`py-2.5 pr-4 font-bold ${isAddition ? "text-[#4c6351]" : "text-[#9c2720]"}`}
                      >
                        {isAddition ? `+${mov.quantity}` : `${mov.quantity}`}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`px-2 py-0.5 border border-black/20 uppercase font-bold ${
                            isAddition
                              ? "bg-[#4c6351]/10 text-[#4c6351]"
                              : "bg-[#9c2720]/10 text-[#9c2720]"
                          }`}
                        >
                          {mov.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 text-black/50">{mov.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
