import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  AlertTriangle,
  Cpu,
  Droplets,
  Flame,
  Map as MapIcon,
  Package,
  Radar,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Circle, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet"

import { AnimatedMarker } from "./AnimatedMarker"
import { HazardZone } from "./HazardZone"
import { useCamps } from "../context/CampContext"
import { aiEvaluationService } from "../services/aiEvaluationService"

import type { Camp } from "../types/camp"
import "leaflet/dist/leaflet.css"
import "../styles/map-effects.css"

const MapController = ({ selectedCoords }: { selectedCoords: [number, number] | null }) => {
  const map = useMap()

  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 15)
    }
  }, [map, selectedCoords])

  return null
}

const RadarPing = ({
  coords,
  color = "var(--primary-color)",
}: {
  coords: [number, number]
  color?: string
}) => {
  return (
    <Circle
      center={coords}
      radius={150}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 1 }}
    />
  )
}

export const MapDashboard = () => {
  const { camps, transfers, expeditions, hazardAreas, selectedCamp, setSelectedCamp } = useCamps()
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleAiAnalysis = async (camp: Camp) => {
    setAnalyzing(true)
    setAiAnalysis(null)
    const result = await aiEvaluationService.analyzeCampSituation(camp)
    setAiAnalysis(result)
    setAnalyzing(false)
  }

  return (
    <div className="h-full w-full relative flex overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)] font-sans tactical-map-container cursor-default">
      <div className="vignette-tactical pointer-events-none z-[2000]" />

      <main className="flex-1 relative z-0 overflow-hidden pb-12 pt-20">
        <div className="scanlines absolute inset-0 pointer-events-none z-[400]" />
        <div className="noise-overlay absolute inset-0 pointer-events-none z-[401] opacity-20" />

        <MapContainer
          center={[9.934739, -84.087502]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution="&copy; Map Data"
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />

          <MapController selectedCoords={selectedCamp?.coords || null} />

          {hazardAreas.map((area) => (
            <HazardZone
              key={`hazard-area-${area.id}`}
              coords={area.coords}
              radius={area.radius}
              dangerLevel={area.dangerLevel}
              name={area.name}
            />
          ))}

          {transfers.map((line) => (
            <Polyline
              key={line.id}
              positions={[line.from, line.to]}
              pathOptions={{
                color:
                  line.resourceType === "food" ? "var(--primary-color)" : "var(--accent-critical)",
                weight: 3,
                opacity: 0.8,
                dashArray: "10, 10",
              }}
              className="marching-ants"
            />
          ))}

          {expeditions.map((expedition) => {
            const origin = camps.find((camp) => camp.id === expedition.originId)
            if (!origin) return null

            return (
              <Polyline
                key={`line-${expedition.id}`}
                positions={[origin.coords, expedition.coords]}
                pathOptions={{ color: "var(--ink)", weight: 1, dashArray: "4, 4", opacity: 0.5 }}
              />
            )
          })}

          {camps.map((camp) => (
            <AnimatedMarker
              key={camp.id}
              camp={camp}
              onClick={(nextCamp) => {
                setSelectedCamp(nextCamp)
                setAiAnalysis(null)
              }}
            />
          ))}

          {expeditions.map((expedition) => (
            <RadarPing
              key={expedition.id}
              coords={expedition.coords}
              color="var(--primary-color)"
            />
          ))}
        </MapContainer>
      </main>

      <header className="absolute top-0 left-0 right-0 h-20 border-b-4 border-[var(--ink)] paper-panel !shadow-none !border-t-0 !border-x-0 z-30 flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-[var(--ink)] border-2 border-[var(--ink)] flex items-center justify-center shadow-[4px_4px_0px_var(--bg-paper-dark)]">
            <MapIcon className="text-[var(--bg-paper)]" size={32} />
          </div>
          <div>
            <h1 className="text-xl font-typewriter font-black uppercase tracking-normal text-[var(--ink)]">
              SISTEMA DE CONTROL Z-07
            </h1>
            <p className="text-[10px] font-mono text-[var(--ink-soft)] uppercase flex items-center gap-2">
              <Activity size={12} className="text-[var(--accent-critical)]" /> ENLACE ESTABLE //
              SECTOR BRAVO-NINER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right hidden md:block">
            <div className="text-sm font-mono font-bold text-[var(--ink)] uppercase tracking-wider">
              {new Date().toISOString().split("T")[1].split(".")[0]} ZULU
            </div>
            <div className="text-[10px] font-mono text-[var(--ink-soft)] uppercase">
              MODO: VISTA SATELITAL
            </div>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-3 h-3 border border-[var(--ink)] ${
                  index === 1 ? "bg-[var(--accent-warning)]" : "bg-[var(--bg-paper-dark)]"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {selectedCamp ? (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            className="absolute right-0 top-20 bottom-12 w-[400px] z-[2001] p-6 flex flex-col"
          >
            <div className="flex-1 paper-panel flex flex-col p-8 overflow-hidden relative">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-6 bg-[var(--accent-tape)] opacity-80 rotate-1 border border-[var(--ink)] shadow-md" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className={`status-badge ${selectedCamp.hasAlert ? "critical" : "stable"}`}>
                    {selectedCamp.hasAlert ? "ALERTA CRITICA" : "SECTOR SEGURO"}
                  </div>
                  <h2 className="text-3xl font-typewriter font-bold text-[var(--ink)] uppercase tracking-tighter mt-4 leading-none">
                    {selectedCamp.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCamp(null)}
                  className="text-[var(--ink)] hover:rotate-90 transition-transform p-1 border-2 border-transparent hover:border-[var(--ink)]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 font-mono">
                <section>
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-[var(--ink-soft)] pb-1">
                    <TrendingUp size={16} className="text-[var(--ink)]" />
                    <h3 className="text-xs font-bold text-[var(--ink)] uppercase">
                      Logistica de Suministros
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {selectedCamp.resources.map((resource) => (
                      <div key={resource.type} className="group">
                        <div className="flex justify-between text-[11px] uppercase mb-1 font-bold text-[var(--ink)]">
                          <span className="flex items-center gap-2">
                            {resource.type === "food" ? <Package size={12} /> : null}
                            {resource.type === "water" ? <Droplets size={12} /> : null}
                            {resource.type === "ammo" ? <ShieldCheck size={12} /> : null}
                            {resource.type === "fuel" ? <Flame size={12} /> : null}
                            {resource.type}
                          </span>
                          <span>{resource.amount}%</span>
                        </div>
                        <div className="h-3 bg-[var(--bg-paper-dark)] border border-[var(--ink)] p-[1px]">
                          <motion.div
                            className={`h-full ${
                              resource.amount < 30
                                ? "bg-[var(--accent-critical)]"
                                : "bg-[var(--ink)]"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${resource.amount}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-[var(--ink-soft)] pb-1">
                    <Users size={16} className="text-[var(--ink)]" />
                    <h3 className="text-xs font-bold text-[var(--ink)] uppercase">
                      Personal Asignado
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedCamp.professions.map((profession) => (
                      <div
                        key={profession.label}
                        className="bg-[var(--bg-paper-dark)] border border-[var(--ink)] p-2 flex flex-col items-center rotate-[0.5deg] hover:rotate-0 transition-transform"
                      >
                        <span className="text-2xl font-bold text-[var(--ink)] leading-none">
                          {profession.count}
                        </span>
                        <span className="text-[9px] text-[var(--ink-soft)] uppercase mt-1 font-bold">
                          {profession.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-[var(--ink-soft)] pb-1">
                    <Cpu size={16} className="text-[var(--ink)]" />
                    <h3 className="text-xs font-bold text-[var(--ink)] uppercase">
                      Evaluacion Tactica (IA)
                    </h3>
                  </div>
                  <div className="bg-[var(--bg-paper-dark)] border-2 border-dashed border-[var(--ink)] p-4 min-h-[100px] relative">
                    {analyzing ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-[var(--ink)] animate-pulse py-4">
                        <Radar size={24} className="animate-spin" />
                        <span className="text-[10px] font-bold">ANALIZANDO SECTOR...</span>
                      </div>
                    ) : aiAnalysis ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] text-[var(--ink)] leading-relaxed uppercase italic font-bold"
                      >
                        {aiAnalysis}
                      </motion.p>
                    ) : (
                      <p className="text-[10px] text-[var(--ink-soft)] italic text-center py-6">
                        ESPERANDO SOLICITUD DE EVALUACION...
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <footer className="mt-8 pt-4 border-t-2 border-[var(--ink)]">
                <button
                  onClick={() => {
                    void handleAiAnalysis(selectedCamp)
                  }}
                  disabled={analyzing}
                  className="w-full py-4 bg-[var(--ink)] text-[var(--bg-paper)] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--ink-soft)] transition-colors disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                >
                  <Zap size={16} className={analyzing ? "animate-pulse" : ""} /> ANALIZAR SITUACION
                </button>
              </footer>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <footer className="absolute bottom-0 left-0 right-0 h-12 paper-panel !shadow-none !border-b-0 !border-x-0 !border-t-4 z-30 flex items-center px-8 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink)]">
        <div className="flex items-center gap-8 border-r border-[var(--ink-soft)] pr-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--accent-approved)] rounded-full animate-pulse" />
            SISTEMA ACTIVO
          </div>
          <button
            onClick={() => {
              const alertCamps = camps.filter((camp) => camp.hasAlert)
              if (alertCamps.length > 0) {
                const currentIndex = selectedCamp
                  ? alertCamps.findIndex((camp) => camp.id === selectedCamp.id)
                  : -1
                const nextIndex = (currentIndex + 1) % alertCamps.length
                setSelectedCamp(alertCamps[nextIndex])
              }
            }}
            className="flex items-center gap-2 text-[var(--accent-critical)] hover:bg-[var(--accent-critical)] hover:text-white px-2 py-1 transition-all cursor-pointer rounded"
          >
            <AlertTriangle size={12} /> {camps.filter((camp) => camp.hasAlert).length} ALERTAS
          </button>
        </div>

        <div className="flex-1 flex justify-center gap-12 text-[var(--ink-soft)]">
          <span>RESIDUOS: NOMINAL</span>
          <span>ENLACE: 98%</span>
          <span>EXPEDICIONES: {expeditions.length} ACTIVAS</span>
        </div>

        <div className="border-l border-[var(--ink-soft)] pl-8 flex items-center gap-4">
          <span className="text-[var(--ink)]">ENCRYPTION: ARC-V4</span>
          <div className="flex items-end gap-1 h-3">
            {[2, 4, 3, 1, 4].map((value, index) => (
              <div
                key={index}
                className="w-1 bg-[var(--ink)]"
                style={{ height: `${value * 25}%` }}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
