import { motion } from "framer-motion"
import { Compass, AlertOctagon, Scale, History, User, ArrowRight, Trophy } from "lucide-react"

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
      label: "LEYENDA DEL PARAMO",
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
      transition: { staggerChildren: 0.08, type: "spring" as const, stiffness: 100 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 120 } },
  }

  return (
    <motion.div
      className="p-5 lg:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* TITULO */}
      <div className="border-b border-[#c27c2f]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase">
            Tablero de Mando
          </h2>
          <p className="font-mono text-xs text-[#fca311]/60 uppercase tracking-widest">
            Resumen operativo del campamento
          </p>
        </div>
        <div className="vintage-tape">CONTROL MILITAR ACTIVO</div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CARD 1: EXPLORACIONES EN CURSO */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("explorations")}
          className="bg-[#9a9080] border border-black p-6 relative overflow-hidden text-black transition-transform hover:scale-[1.01] flex flex-col justify-between group min-h-[190px] cursor-pointer"
          style={{ transform: "rotate(0.4deg)" }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs uppercase font-bold text-zinc-800 tracking-wider">
              [EQUIPOS EN ZONA MUERTA]
            </span>
            <span className="p-1 px-2 text-[11px] font-mono font-bold bg-amber-950/20 text-amber-900 border border-amber-900/40 rounded">
              ZONA NEGRA
            </span>
          </div>

          <div className="my-3">
            <span className="font-typewriter text-4xl font-bold block">
              {activeExplorations.length}
            </span>
            <span className="font-mono text-xs text-zinc-900 uppercase font-medium">
              EQUIPOS ACTIVOS RASTREANDO
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-800 border-t border-black/20 pt-2 flex items-center justify-between">
            <span>VER EXPEDICIONES EN ACTIVIDAD</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>

        {/* CARD 2: TRASLADOS PENDIENTES */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("transfers")}
          className="bg-amber-100/90 border border-black p-6 relative overflow-hidden text-black transition-transform hover:scale-[1.01] flex flex-col justify-between group min-h-[190px] cursor-pointer"
          style={{ transform: "rotate(0.5deg)" }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs uppercase font-bold text-zinc-800 tracking-wider">
              [CONVOYES SOLICITADOS]
            </span>
            <span className="p-1 px-2 text-[11px] font-mono font-bold bg-zinc-950 text-white rounded animate-pulse">
              PENDIENTES
            </span>
          </div>

          <div className="my-3">
            <span className="font-typewriter text-4xl font-bold block">
              {pendingTransfers.length}
            </span>
            <span className="font-mono text-xs text-zinc-900 uppercase font-medium">
              TRASLADOS INTER-BUNKER
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-800 border-t border-black/20 pt-2 flex items-center justify-between">
            <span>REVISAR SOLICITUDES EN COLA</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>

        {/* CARD 3: ALERTAS DE INVENTARIO */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("inventory")}
          className={`border border-black p-6 relative overflow-hidden text-black transition-transform hover:scale-[1.01] flex flex-col justify-between group min-h-[190px] cursor-pointer ${
            criticalStocks.length > 0
              ? "warning-card text-[#9c2720]"
              : "bg-emerald-200/95 text-[#2b4c33] border-emerald-900"
          }`}
          style={{ transform: "rotate(-0.5deg)" }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs uppercase font-bold tracking-wider opacity-85">
              [ALERTA DE SUMINISTROS]
            </span>
            <AlertOctagon
              className={`w-4 h-4 ${criticalStocks.length > 0 ? "animate-bounce" : ""}`}
            />
          </div>

          <div className="my-3">
            {criticalStocks.length > 0 ? (
              <>
                <span className="font-typewriter text-4xl font-bold block">
                  {criticalStocks.length}
                </span>
                <span className="font-mono text-[11px] uppercase font-bold block pt-1">
                  SUMINISTROS BAJO MINIMO
                </span>
              </>
            ) : (
              <>
                <span className="font-typewriter text-lg font-bold block leading-5 uppercase">
                  BODEGA SEGURA
                </span>
                <span className="font-mono text-xs uppercase block opacity-85">
                  RACIONES Y AGUA ESTABLES
                </span>
              </>
            )}
          </div>

          <div className="text-xs font-mono border-t border-black/20 pt-2 flex items-center justify-between">
            <span>VER KITS DE BODEGA</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>

        {/* CARD 4: RANGO Y PUNTUACIÓN */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate("profile")}
          className="bg-[#9a9080] border border-black p-6 relative overflow-hidden text-black transition-transform hover:scale-[1.01] flex flex-col justify-between group min-h-[190px] cursor-pointer"
          style={{ transform: "rotate(1deg)" }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs uppercase font-bold text-zinc-800 tracking-wider">
              [PUNTUACIÓN CAMPAMENTO]
            </span>
            <Trophy className="w-4 h-4 text-amber-800" />
          </div>

          <div className="my-2">
            <span
              className="font-typewriter text-4xl font-bold block"
              style={{ color: rank.color }}
            >
              {statistics.survival_score}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-700 block">
              PTS DE SUPERVIVENCIA
            </span>
            <div className="mt-2 w-full h-2 bg-black/20 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${rankProgress}%`, backgroundColor: rank.color }}
              />
            </div>
            <span
              className="font-typewriter text-xs font-bold uppercase block mt-1"
              style={{ color: rank.color }}
            >
              {rank.label}
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-800 border-t border-black/20 pt-2 flex items-center justify-between">
            <span>{statistics.explorations_completed} EXPEDICIONES EXITOSAS</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>
      </div>

      {/* COLUMNAS: EQUIPOS ACTIVOS & BALANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COL-LEFT: EQUIPOS EN ZONA MUERTA */}
        <div className="bg-black/30 border border-[#3b4d3e] rounded-lg p-6 backdrop-blur-sm shadow-md lg:col-span-8">
          <div className="flex items-center gap-3 border-b border-[#c27c2f]/20 pb-4 mb-5">
            <Compass className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="font-typewriter text-lg font-bold tracking-wider text-[#fca311] uppercase">
              SITUACION DE EXCURSIONISTAS EN ZONA MUERTA
            </h3>
          </div>

          {activeExplorations.length === 0 ? (
            <div className="border border-dashed border-zinc-800 text-center py-10 rounded">
              <span className="font-mono text-xs opacity-50 block uppercase text-[#ab9e8b]">
                [NINGUN EQUIPO DE COMBATE EN RAD-OUT EXTERIOR]
              </span>
              <button
                type="button"
                className="font-mono text-xs text-amber-500 mt-1 cursor-pointer hover:underline bg-transparent border-none p-0 inline-block"
                onClick={() => onNavigate("explorations")}
              >
                ORGANIZAR NUEVA BUSQUEDA DE RECURSOS &gt;&gt;
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeExplorations.map((exp) => {
                const crewNames = exp.explorationPersons.map((p) => p.person.first_name).join(", ")

                return (
                  <div
                    key={exp.id}
                    className="border border-[#3b4d3e]/45 bg-black/40 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
                    <div className="pl-3">
                      <span className="font-mono text-xs text-amber-500 font-bold tracking-widest block">
                        MISION ID: #{exp.id} &bull; {exp.departure_date.split("T")[0]}
                      </span>
                      <h4 className="font-typewriter text-sm text-white font-bold uppercase mt-0.5">
                        {exp.name}
                      </h4>
                      <p className="font-mono text-xs text-[#ab9e8b] mt-1">
                        DESTINO: <span className="text-white">{exp.destination_description}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-mono text-xs text-zinc-300">
                          CONTINGENTE: <span className="text-white font-bold">{crewNames}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      <span className="font-mono text-xs text-[#ab9e8b] block">
                        DIAS ESTIMADOS:
                      </span>
                      <span className="font-typewriter text-amber-500 font-bold block animate-pulse">
                        {exp.estimated_days} DIAS (+{exp.grace_days} G)
                      </span>
                      <div className="inline-flex items-center gap-1.5 bg-amber-900/40 text-amber-400 border border-amber-500/30 text-[9px] font-mono px-2 py-0.5 rounded mt-1.5">
                        <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping" />
                        EXCURSION EN CURSO
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* COL-RIGHT: BALANCE DIARIO */}
        <div className="bg-black/30 border border-[#3b4d3e] rounded-lg p-6 backdrop-blur-sm shadow-md lg:col-span-4">
          <div className="flex items-center gap-3 border-b border-[#c27c2f]/20 pb-3 mb-4">
            <Scale className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="font-typewriter text-lg font-bold tracking-wider text-[#fca311] uppercase">
              BALANCE DIARIO
            </h3>
          </div>

          <p className="font-mono text-[10px] text-[#ab9e8b]/70 uppercase leading-4 border-b border-zinc-900 pb-2 mb-3">
            CONSUMO PUBLICO VS PRODUCCION COSECHADA
          </p>

          {balances.length === 0 ? (
            <p className="font-mono text-xs text-zinc-600 text-center py-6 uppercase">
              SIN DATOS DE BALANCE
            </p>
          ) : (
            <div className="space-y-4">
              {balances.map((bal) => {
                const isPositive = bal.net >= 0
                return (
                  <div
                    key={bal.resource_id}
                    className="border border-zinc-900 p-2.5 rounded bg-black/20"
                  >
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-white font-bold uppercase">{bal.resource_name}</span>
                      <span
                        className={`font-bold ${isPositive ? "text-emerald-500" : "text-red-500 animate-pulse"}`}
                      >
                        {isPositive ? `+${bal.net}` : bal.net} / DIA
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-zinc-800 rounded mt-2 overflow-hidden flex">
                      <div
                        className="bg-red-500 h-full"
                        style={{
                          width: `${Math.min(100, (bal.consumption / (bal.production + bal.consumption || 1)) * 100)}%`,
                        }}
                      />
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${Math.min(100, (bal.production / (bal.production + bal.consumption || 1)) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-zinc-500 mt-1">
                      <span>CONSUMO: -{bal.consumption}</span>
                      <span>PROD: +{bal.production}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* REGISTRO DE MOVIMIENTOS RECIENTES */}
      <div className="bg-black/45 border border-[#3b4d3e] p-5 font-mono text-[11px] leading-relaxed rounded overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[#c27c2f]/20 pb-3 mb-4">
          <History className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="font-typewriter text-lg font-bold tracking-wider text-[#fca311] uppercase">
            HISTORIAL DE LOGS DE RESERVA
          </h3>
        </div>

        {movements.length === 0 ? (
          <p className="text-zinc-600 text-center py-6 uppercase font-bold">
            SIN MOVIMIENTOS REGISTRADOS
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#3b4d3e]/40 text-amber-600/80">
                  <th className="pb-2 pr-4">FECHA</th>
                  <th className="pb-2 pr-4">LOG ID</th>
                  <th className="pb-2 pr-4">RECURSO</th>
                  <th className="pb-2 pr-4">CANTIDAD</th>
                  <th className="pb-2 pr-4">TIPO</th>
                  <th className="pb-2">NOTAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b4d3e]/20">
                {movements.slice(0, 5).map((mov) => {
                  const isAddition = mov.quantity > 0
                  const resourceName =
                    resourceNameMap.get(mov.resource_id) ?? `RECURSO #${mov.resource_id}`

                  return (
                    <tr key={mov.id} className="text-zinc-300 hover:bg-black/40">
                      <td className="py-2.5 pr-4 opacity-60">
                        {mov.created_at.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-2.5 pr-4 text-amber-500">#L-{mov.id}</td>
                      <td className="py-2.5 pr-4 font-bold uppercase">{resourceName}</td>
                      <td
                        className={`py-2.5 pr-4 font-bold ${isAddition ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {isAddition ? `+${mov.quantity}` : `${mov.quantity}`}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`px-1.5 py-0.5 rounded uppercase ${
                            isAddition
                              ? "bg-emerald-950/40 text-emerald-400"
                              : "bg-red-950/40 text-red-400"
                          }`}
                        >
                          {mov.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400">{mov.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
