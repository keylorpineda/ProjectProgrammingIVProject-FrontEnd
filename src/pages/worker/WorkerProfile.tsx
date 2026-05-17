import React from 'react'
import { Users, Shield, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/pages/admin/context/AuthContext'
import { useAssignedResources, useProfessions } from '@/features/worker/hooks/useWorkerAPI'

interface WorkerProfileProps {
  activeTab?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

interface WorkerMetricStat {
  label: string
  val: string | number
  status: string
}

interface WorkerMetricGroup {
  title: string
  stats: WorkerMetricStat[]
}

// Get metrics for worker's profession
const getMetricsForWorker = (profession: any): WorkerMetricGroup => {
  if (!profession) {
    return {
      title: 'ESTADO OPERATIVO GENERAL',
      stats: [
        { label: 'ESTADO ACTUAL', val: 'ACTIVO', status: 'OK' },
        { label: 'DATOS VERIFICADOS', val: '100%', status: 'VERIFICADO' },
      ],
    }
  }

  const name = profession.name.toLowerCase()
  const count = profession.persons?.length || 0

  const metricSpecs: Record<string, any> = {
    recolector: {
      title: 'ESTADO DE RECOLECCIÓN',
      stats: [
        { label: 'Personas activas', val: count, status: 'OK' },
        { label: 'Puede explorar', val: profession.can_explore ? 'Sí ✓' : 'No ✗', status: 'AUTORIZADO' },
      ],
    },
    aguatero: {
      title: 'MÉTRICAS DE HIDRATACIÓN',
      stats: [
        { label: 'Trabajadores', val: count, status: 'ESTABLE' },
        { label: 'Función', val: 'Extracción H₂O', status: 'SISTEMA' },
      ],
    },
    explorador: {
      title: 'LOG DE EXPLORACIÓN',
      stats: [
        { label: 'Personal asignado', val: count, status: 'ACTIVO' },
        { label: 'Exploración', val: profession.can_explore ? 'Permitido' : 'No', status: 'SÍ' },
      ],
    },
    guardia: {
      title: 'ORDEN Y SEGURIDAD',
      stats: [
        { label: 'Efectivos', val: count, status: 'DESPLEGADOS' },
        { label: 'Mínimo', val: `${profession.minimum_active_required} req.`, status: 'OK' },
      ],
    },
    médico: {
      title: 'CENTRO SANITARIO',
      stats: [
        { label: 'Médicos', val: count, status: 'GUARDIA' },
        { label: 'Prioridad', val: (profession.minimum_active_required || 0) > 1 ? 'Alta' : 'Normal', status: 'ALTA' },
      ],
    },
    ingeniero: {
      title: 'MANTENIMIENTO TÉCNICO',
      stats: [
        { label: 'Cantidad', val: count, status: 'ACTIVO' },
        { label: 'Área', val: 'Infraestructura', status: 'VERIFICADO' },
      ],
    },
    cocinero: {
      title: 'DIAGNOSIS ALIMENTARIA',
      stats: [
        { label: 'Asignados', val: count, status: 'COCINA' },
        { label: 'Tipo', val: 'Alimentos', status: 'OK' },
      ],
    },
    almacenista: {
      title: 'LOGÍSTICA DE SUMINISTROS',
      stats: [
        { label: 'Personal', val: count, status: 'DEPÓSITO' },
        { label: 'Estado', val: 'Disponible', status: 'OK' },
      ],
    },
    agricultor: {
      title: 'PRODUCCIÓN PRIMARIA',
      stats: [
        { label: 'Agricultores', val: count, status: 'CAMPO' },
        { label: 'Ciclo', val: 'Largo plazo', status: 'ESTABLE' },
      ],
    },
    constructor: {
      title: 'DEPARTAMENTO DE OBRAS',
      stats: [
        { label: 'Constructores', val: count, status: 'PROYECTO' },
        { label: 'Obra', val: 'Infraestructura', status: 'OK' },
      ],
    },
  }

  const match = Object.keys(metricSpecs).find((k) => name.includes(k))
  if (match) return metricSpecs[match]

  return {
    title: 'ESTADO OPERATIVO',
    stats: [
      { label: 'Actualmente', val: 'ACTIVO', status: 'OK' },
      { label: 'Verificado', val: 'Sí', status: 'VERIFICADO' },
    ],
  }
}

export default function WorkerProfile(_props: WorkerProfileProps) {
  const { user } = useAuth()
  const { data: assignedResources, isLoading: loadingResources } = useAssignedResources()
  const { data: professions, isLoading: loadingProfessions } = useProfessions()

  const isLoading = loadingResources || loadingProfessions

  // Find user's profession if exists
  const userProfession = React.useMemo(() => {
    if (!professions) return null
    return professions[0] || null
  }, [professions])

  const roleData = React.useMemo(() => {
    return getMetricsForWorker(userProfession)
  }, [userProfession])

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-accent-orange opacity-60 mb-4" />
        <p className="font-mono text-sm text-paper-base/70 uppercase">Loading profile...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="p-4 space-y-3 animate-in fade-in duration-500 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Breadcrumbs / Status */}
      <motion.div variants={itemVariants} className="flex justify-end items-center mb-4">
        <p className="text-[10px] font-mono text-paper-base uppercase opacity-80">
          IDENTIFICACIÓN CONFIRMADA // TERMINAL PERSONAL
        </p>
      </motion.div>

      {/* Main Header */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center bg-zinc-900/30 p-2 border border-paper-dark/10"
      >
        <h2 className="text-xl font-display text-white tracking-widest uppercase">EXPEDIENTE DE PERSONAL</h2>
        <div className="px-4 py-1 border border-paper-dark/30 text-[9px] font-mono text-accent-orange bg-black/60 uppercase font-bold">
          SECTOR {user?.campId}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 2xl:grid-cols-12 gap-8 items-start pb-8">
        {/* Left: Main Dossier Card */}
        <div className="2xl:col-span-7 flex gap-3">
          {/* Punched Paper Edge */}
          <div className="flex flex-col gap-4 py-8 px-2 justify-center items-center bg-paper-dark/10 border border-paper-dark/20 rounded-l shadow-lg">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="punch-hole w-2.5 h-2.5 bg-bunker-bg border border-paper-dark/50 rounded-full"
              />
            ))}
          </div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="paper-card flex-1 p-8"
          >
            <div className="watermark bottom-4 right-8 text-xl opacity-5">CONFIDENCIAL</div>

            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-display text-ink-black leading-tight border-b border-ink-black/20 pb-2">
                  {user?.username?.toUpperCase()}
                </h3>
                <p className="text-accent-orange font-mono text-xs font-bold mt-2 tracking-tighter">
                  [{user?.role?.toUpperCase()}]
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1 font-bold">ID Sistema</p>
                  <p className="text-lg font-display">{user?.id}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1 font-bold">Capacidad Operativa</p>
                  <div className="pt-1">
                    <span className="px-3 py-1 bg-success-green/10 border border-success-green/30 text-success-green font-display text-sm rounded-sm uppercase">
                      APTO
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1 font-bold">Profesión</p>
                  <span className="bg-ink-black text-paper-base px-3 py-1 text-xs font-mono font-bold inline-block">
                    {userProfession?.name.toUpperCase() || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1 font-bold">Destino</p>
                  <p className="text-sm font-mono font-bold text-ink-black">Sector {user?.campId}</p>
                </div>
              </div>

              <div className="bg-ink-black/[0.04] p-6 border-l-4 border-accent-orange/40 italic text-ink-black/90 font-mono text-xs leading-relaxed shadow-inner">
                Este expediente contiene datos completos de asignación: identificación del trabajador, rol
                asignado, ubicación del campamento, profesiones relacionadas y recursos. Toda información es
                auditada y verificada por comando central.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Operational Status Panels */}
        <div className="2xl:col-span-5 space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="paper-card p-8 bg-zinc-900 border-t-4 border-t-accent-orange shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            <h4 className="text-[12px] font-mono text-paper-base/90 uppercase border-b border-white/10 pb-2 mb-6 font-bold tracking-[0.2em]">
              {roleData.title}
            </h4>

            <div className="space-y-6">
              {roleData.stats.map((stat, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[13px] font-mono font-bold items-end">
                    <span className="text-white/80 uppercase">{stat.label}</span>
                    <div className="text-right">
                      <span className="text-xl font-display block leading-none text-white">{stat.val}</span>
                      <span className="text-[11px] text-accent-orange uppercase tracking-tighter">{stat.status}</span>
                    </div>
                  </div>
                  <div className="status-line bg-white/10 h-1.5">
                    <div className="h-full bg-accent-orange transition-all duration-1000" style={{ width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Traceability Section */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-3 py-6 px-2 justify-center items-center bg-paper-dark/5 border border-paper-dark/10 rounded-l">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="punch-hole w-2 h-2 bg-bunker-bg border border-paper-dark/30 rounded-full" />
          ))}
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="paper-card flex-1 p-6"
        >
          <div className="watermark bottom-4 right-8 text-xl opacity-5">CONFIDENCIAL</div>
          <h3 className="text-xl font-display text-ink-black border-b border-ink-black/10 pb-2 mb-4">
            TRAZABILIDAD DEL REGISTRO
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-[11px] font-mono text-ink-black/70 uppercase font-bold">RECURSOS Y BADGES</p>
              <div className="space-y-3">
                <div className="p-3 bg-ink-black/[0.02] border border-ink-black/10">
                  <p className="text-[12px] font-mono font-bold uppercase mb-1">Recursos Asignados</p>
                  <p className="text-[11px] font-mono text-ink-black/85 italic pb-2">
                    {assignedResources && assignedResources.length > 0
                      ? assignedResources.map((r) => `${r.name} (${r.current_quantity})`).join(', ')
                      : 'Cargando...'}
                  </p>
                  <button className="text-[10px] font-mono text-accent-orange hover:underline font-bold">
                    SOLICITAR REPOSICIÓN
                  </button>
                </div>
                <div className="p-3 bg-ink-black/[0.02] border border-ink-black/10">
                  <p className="text-[12px] font-mono font-bold uppercase mb-1">Log de Acciones</p>
                  <ul className="space-y-1 text-[10px] font-mono text-ink-black/85">
                    <li>- [{new Date().toISOString().split('T')[0]}] Perfil consultado</li>
                    <li>- Asignación verificada por comando central</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-mono text-ink-black/70 uppercase font-bold">CAMPOS CONFIRMADOS</p>
              <div className="space-y-0 text-[11px] font-mono">
                {[
                  { label: 'CAMPO', val: 'ESTADO' },
                  { label: 'Nombre', val: 'DISPONIBLE' },
                  { label: 'Estado', val: 'DISPONIBLE' },
                  { label: 'Puede trabajar', val: 'DISPONIBLE' },
                  { label: 'ID Sistema', val: 'VERIFICADO' },
                  { label: 'Insignias', val: '2 ACTIVAS' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex justify-between py-2 border-b border-ink-black/10 ${
                      i === 0 ? 'text-ink-black/80 border-b-2 border-ink-black/20 font-bold' : ''
                    }`}
                  >
                    <span className="uppercase text-[12px]">{row.label}</span>
                    <span className={i === 0 ? 'uppercase text-[11px]' : 'font-bold'}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="paper-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-success-green rounded-sm flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-mono text-ink-black/70 uppercase font-bold">Security Status</p>
            <p className="text-sm font-display mt-1">CLEARANCE GRANTED</p>
          </div>
        </div>

        <div className="paper-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-orange rounded-sm flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-ink-black" />
          </div>
          <div>
            <p className="text-xs font-mono text-ink-black/70 uppercase font-bold">Crew Assignment</p>
            <p className="text-sm font-display mt-1">CREW {user?.campId} - ACTIVE</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
