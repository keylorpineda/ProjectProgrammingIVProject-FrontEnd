import React from 'react'
import { User, MapPin, Briefcase, Users, Shield, Loader2 } from 'lucide-react'
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

export default function WorkerProfile({ activeTab }: WorkerProfileProps) {
  const { user } = useAuth()
  const { data: assignedResources, isLoading: loadingResources } = useAssignedResources()
  const { data: professions, isLoading: loadingProfessions } = useProfessions()

  const isLoading = loadingResources || loadingProfessions

  // Find user's profession if exists
  const userProfession = React.useMemo(() => {
    if (!professions) return null
    // This would need to come from user data ideally
    return professions[0] || null
  }, [professions])

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
      className="p-4 space-y-3 animate-in fade-in duration-500 max-w-6xl mx-auto"
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

      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-8">
        {/* Main Dossier Card */}
        <div className="xl:col-span-12 2xl:col-span-7 flex gap-3">
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

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                    ID Interno
                  </p>
                  <p className="text-xl font-display">{user?.id}</p>
                </div>

                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                    Estado de Empleo
                  </p>
                  <p className="text-lg font-display text-success-green font-bold">APTO PARA TRABAJO</p>
                </div>

                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                    Campamento Asignado
                  </p>
                  <p className="text-lg font-display">Sector {user?.campId}</p>
                </div>

                <div className="pt-4 border-t border-ink-black/10">
                  <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-2">
                    Descripción del Dossier
                  </p>
                  <p className="text-sm leading-relaxed font-mono text-ink-black/80 italic">
                    Este expediente contiene datos completos de asignación: identificación del
                    trabajador, rol asignado, ubicación del campamento, profesiones relacionadas y
                    recursos. Toda información es auditada y verificada por comando central.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Profession Card */}
      {userProfession && (
        <motion.div variants={itemVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            PROFESIÓN ASIGNADA
          </h3>

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-ink-black border border-paper-dark/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-8 h-8 text-paper-base" />
            </div>

            <div className="flex-1">
              <p className="text-2xl font-display uppercase mb-3">{userProfession.name}</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase">Personal Total</p>
                  <p className="text-2xl font-display mt-1">{userProfession.persons?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase">Activos Ahora</p>
                  <p className="text-2xl font-display mt-1">
                    {userProfession.persons?.filter((p) => p.status === 'activo').length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase">Mín Requerido</p>
                  <p className="text-2xl font-display mt-1">{userProfession.minimum_active_required}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-mono text-ink-black/60 uppercase mb-2">Autorización de Exploración</p>
                <p className="text-sm font-mono">
                  {userProfession.can_explore ? (
                    <span className="text-success-green font-bold">✓ AUTORIZADO</span>
                  ) : (
                    <span className="text-accent-orange font-bold">✗ RESTRINGIDO</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Assigned Resources Section */}
      {assignedResources && assignedResources.length > 0 && (
        <motion.div variants={itemVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            ASIGNACIÓN DE RECURSOS
          </h3>

          <div className="space-y-4">
            {assignedResources.map((resource) => (
              <motion.div
                key={resource.id}
                whileHover={{ translateX: 4 }}
                className="border border-ink-black/10 p-4 rounded-sm bg-bunker-bg hover:bg-paper-dark/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {resource.image_url && (
                    <img
                      src={resource.image_url}
                      alt={resource.name}
                      className="w-16 h-16 object-cover rounded border border-ink-black/20 flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg uppercase font-bold">{resource.name}</p>
                        <p className="text-xs font-mono text-paper-base/70 uppercase mt-1">
                          {resource.category}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-display font-bold">{resource.current_quantity}</p>
                        <p className="text-xs font-mono text-ink-black/60">{resource.unit}</p>
                      </div>
                    </div>

                    <p className="text-sm text-ink-black/70 mt-3 leading-relaxed italic">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Profile Summary */}
      <motion.div
        variants={itemVariants}
        className="dashed-accent p-8 bg-paper-base/30 relative overflow-hidden"
      >
        <div className="relative z-10">
          <h3 className="text-2xl uppercase font-display text-ink-black mb-4">INFORMACIÓN DE AUDITORIA</h3>
          <p className="marker-note text-lg">"Duty and Dedication"</p>
          <p className="mt-6 text-sm text-ink-black/75 leading-relaxed font-mono italic">
            Este dossier contiene información completa de asignación: identificación del trabajador,
            rol asignado, ubicación del campamento, profesiones relacionadas y recursos. Toda información
            es auditada y verificada por comando central. Modificaciones no autorizadas serán registradas
            e informadas inmediatamente.
          </p>

          <div className="mt-6 pt-6 border-t border-ink-black/20">
            <p className="text-xs font-mono text-ink-black/60 uppercase mb-2">Última Actualización</p>
            <p className="font-mono text-sm">{new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="absolute -bottom-8 -right-8 opacity-5 rotate-12">
          <Users className="w-64 h-64 text-ink-black" />
        </div>
      </motion.div>

      {/* Status Information */}
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
