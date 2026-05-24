// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Person, CampStatistics, User as UserType } from '../types';
import Badge, { ACHIEVEMENTS_DICT } from './Badge';
import { 
  User, 
  MapPin, 
  Users, 
  Briefcase, 
  Heart, 
  TrendingUp, 
  Award, 
  CheckCircle,
  Shield,
  Star,
  Skull,
  X,
  FileText
} from 'lucide-react';

interface ProfileViewProps {
  user: UserType | null;
  statistics: CampStatistics;
  residents: Person[];
}

export default function ProfileView({ user, statistics, residents }: ProfileViewProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  // Status color badges
  const getStatusBadge = (status: Person['status']) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">ACTIVO</span>;
      case 'sick':
        return <span className="bg-amber-950/40 text-amber-500 border border-amber-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">ENFERMO</span>;
      case 'injured':
        return <span className="bg-red-950/40 text-red-400 border border-red-500/35 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">LESIONADO</span>;
      case 'exploring':
        return <span className="bg-blue-950/40 text-blue-400 border border-blue-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">EMBARCADO</span>;
      case 'deceased':
        return <span className="bg-zinc-900 border border-zinc-700 text-[9px] text-zinc-500 font-mono px-1.5 py-0.5 rounded uppercase font-bold">FALLECIDO</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* PAGE HEADER */}
      <div className="border-b border-[#c27c2f]/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase uppercase">
            EXPEDIENTE JURIDICO DEL REFUGIO Y COMBATIENTES
          </h2>
          <p className="font-mono text-xs text-[#fca311]/60 uppercase tracking-widest">
            REGISTRO DE PERSONAS DE COMBATE, SALUD VITAL Y EXPEDIENTES EXCURSIONISTAS
          </p>
        </div>
        <div className="vintage-tape mt-2 md:mt-0">
          CONFIDENCIAL COMANDANTE
        </div>
      </div>

      {/* COMMANDER & BUNKER MACRO OVERVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1: COMMANDER METRICS OVERVIEW */}
        <div id="commander-manifest-card" className="bg-[#9a9080] border border-black relative overflow-hidden text-black transition-transform hover:scale-[1.01] p-6 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[9px] font-bold text-zinc-600 block uppercase tracking-wider">
              [IDENTIFICACION CONSEJO MILITAR]
            </span>
            <h3 className="font-typewriter text-md font-bold text-black uppercase mt-1 leading-5">
              MANIFEST DE COMANDANCIA ALFA
            </h3>

            <div className="border border-dashed border-black/25 rounded p-3 bg-black/5 mt-4 space-y-2 text-xs font-mono text-zinc-950">
              <p className="flex justify-between">
                <span className="text-zinc-600 uppercase font-bold">NOMBRE:</span>
                <span className="font-bold text-right truncate w-2/3 uppercase">{user?.username}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-zinc-600 uppercase font-bold">CREDITO:</span>
                <span className="font-bold">LIDER DE VIAJES</span>
              </p>
              <p className="flex justify-between">
                <span className="text-zinc-600 uppercase font-bold">BASE ASIGNADA:</span>
                <span className="font-bold text-red-900">REFUGIO CENTRAL</span>
              </p>
              <p className="flex justify-between">
                <span className="text-zinc-600 uppercase font-bold">SEGURIDAD LICENCIA:</span>
                <span className="font-bold">NIVEL COBRE IV</span>
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-800 shrink-0" />
            <p className="text-[10px] font-mono text-zinc-700 uppercase leading-3.5">
              EL COMANDANTE ASUME RESPONSABILIDAD PENAL ABSOLUTA POR LAS BAJAS COMPROBADAS EN LA ZONA MUERTA EXTERIOR.
            </p>
          </div>
        </div>

        {/* COL 2: SURVIVAL STATS GRID */}
        <div id="bunker-audit-card" className="bg-black/30 border border-[#3b4d3e] rounded-lg backdrop-blur-sm shadow-md p-6 flex flex-col justify-between col-span-2">
          <div>
            <div className="flex items-center gap-2 border-b border-[#c27c2f]/20 pb-3 mb-4">
              <Users className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-typewriter text-sm text-[#fca311] font-bold tracking-widest">
                INFORMES INTEGRALES DEL REFUGIO ALFA-01
              </h3>
            </div>

            {/* Stats list items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              <div className="bg-black/45 p-3 rounded border border-[#3b4d3e]/40 text-center">
                <span className="text-[9px] font-mono text-[#ab9e8b] block uppercase">POBLACION TOTAL</span>
                <span className="font-typewriter text-2xl font-bold text-amber-500">{statistics.total_persons}</span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-1">SOBREVIVIENTES</span>
              </div>

              <div className="bg-black/45 p-3 rounded border border-[#3b4d3e]/40 text-center">
                <span className="text-[9px] font-mono text-[#ab9e8b] block uppercase">MANO DE OBRA ACTIVA</span>
                <span className="font-typewriter text-2xl font-bold text-emerald-500">{statistics.active_workers}</span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-1">OPERARIOS SANOS</span>
              </div>

              <div className="bg-black/45 p-3 rounded border border-[#3b4d3e]/40 text-center">
                <span className="text-[9px] font-mono text-[#ab9e8b] block uppercase">EN BUSQUEDA EXCLUSION</span>
                <span className="font-typewriter text-2xl font-bold text-blue-400">{statistics.exploring}</span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-1">EMBARCADOS</span>
              </div>

              <div className="bg-black/45 p-3 rounded border border-[#3b4d3e]/40 text-center">
                <span className="text-[9px] font-mono text-red-500 block uppercase">ENFERMOS O HERIDOS</span>
                <span className="font-typewriter text-2xl font-bold text-red-500">{statistics.injured_or_sick}</span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-1">CAMP CUIDADOS</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-900 pt-4 mt-4">
            <div className="flex gap-3 items-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-[10px] text-zinc-400 font-mono block uppercase">TASA OCUPACION BUNKER (8 CAMAS)</span>
                <div className="w-full h-1.5 bg-zinc-800 rounded mt-1 overflow-hidden">
                  <div className="bg-yellow-500 h-full" style={{ width: `${statistics.occupancy_rate}%` }} />
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">{statistics.occupancy_rate}% CAPACIDAD OCUPADA</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-center justify-end">
              <Award className="w-5 h-5 text-[#3b4d3e]" />
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-mono block uppercase">EXPEDICIONES SATISFACTORIAS</span>
                <span className="font-typewriter text-md font-bold text-white uppercase">{statistics.explorations_completed} EXITOSAS</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROSTER PERSONS COMPREHENSIVE CITIZENRY FILE */}
      <div id="citizens-manifest-section" className="bg-black/30 border border-[#3b4d3e] rounded-lg backdrop-blur-sm shadow-md p-6">
        <div className="flex items-center gap-2 border-b border-[#c27c2f]/20 pb-3 mb-4">
          <CheckCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase">
            LISTADO OPERACIONAL DE PERSONAL EN BUNKER ALFA
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {residents.map((p) => {
            const levelStars = Array.from({ length: p.experience_level }, (_, i) => i);
            
            return (
              <div 
                key={p.id} 
                onClick={() => setSelectedPerson(p)}
                className="bg-black/30 border border-[#3b4d3e]/30 p-4 rounded-lg flex flex-col sm:flex-row gap-4 relative hover:border-[#c27c2f]/50 hover:bg-black/50 transition-all duration-150 cursor-pointer group select-none"
              >
                {/* ID Tag top corner */}
                <div className="absolute top-2 right-2 text-[9px] font-mono text-zinc-500">
                  ID: #{p.id}
                </div>

                {/* Left Profile Avatar */}
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center overflow-hidden rounded relative">
                  {p.photo_url ? (
                    <img 
                      src={p.photo_url} 
                      alt={p.first_name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter contrast-125 saturate-50 group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <User className="w-8 h-8 text-zinc-600 animate-pulse" />
                  )}
                </div>

                {/* Right Person files details */}
                <div className="flex-1 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-typewriter text-sm font-bold text-white uppercase group-hover:text-[#fca311] transition-colors">
                      {p.first_name} {p.last_name}
                    </h4>
                    {getStatusBadge(p.status)}
                  </div>

                  <p className="text-[10px] text-[#ab9e8b] uppercase pb-1 border-b border-zinc-900/60 leading-3">
                    PROFESION: <span className="text-white font-bold">{p.profession.name}</span>
                  </p>

                  {/* MINI BADGES - GAMIFICACION */}
                  <div className="flex flex-wrap gap-1 py-1">
                    {p.achievements && p.achievements.length > 0 ? (
                      p.achievements.map((ach) => (
                        <Badge key={ach} code={ach} showText={false} />
                      ))
                    ) : (
                      <span className="text-[9px] text-zinc-600 font-bold uppercase italic tracking-wider">
                        - SIN LOGROS REGISTRADOS -
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-zinc-900/30">
                    <div className="flex gap-1 items-center">
                      <span className="text-zinc-500">RANGO:</span>
                      <div className="flex text-amber-500 shrink-0">
                        {levelStars.map((s) => (
                          <Star key={s} className="w-3 h-3 fill-current shrink-0" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-500">EXPEDICIONES RESISTIDOS:</span>
                      <span className="text-white font-bold ml-1">{p.expeditionsSurvived}</span>
                    </div>
                  </div>

                  {p.previous_skills && (
                    <div className="bg-zinc-900/50 p-1.5 rounded text-[10.5px] text-[#ab9e8b] font-mono leading-3.5 italic border border-zinc-900 truncate max-w-[280px]">
                      * Notas de reclutamiento: "{p.previous_skills}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DOSSIER MODAL - GAMIFICACION */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark glass backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body Card */}
            <motion.div
              id="person-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative max-w-xl w-full bg-[#161513] border-2 border-[#c27c2f] rounded shadow-[8px_8px_0px_#000000] p-6 text-left text-zinc-100 overflow-y-auto max-h-[90vh] z-20"
            >
              {/* Retro top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c27c2f] via-zinc-900 to-[#c27c2f] animate-pulse" />

              {/* Close Button */}
              <button 
                onClick={() => setSelectedPerson(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-900/60 p-1.5 border border-zinc-700 rounded transition-all duration-150 cursor-pointer"
                title="Cerrar Expediente"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Stamp Tab */}
              <div className="vintage-tape mb-6 mt-2">
                EXPEDIENTE MILITAR CLASIFICADO: #{selectedPerson.id}
              </div>

              {/* Modal Grid: AVATAR + STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-5 border-b border-[#3b4d3e]/40">
                {/* Avatar */}
                <div className="sm:col-span-1 flex flex-col items-center">
                  <div className="w-32 h-32 bg-zinc-950 border-2 border-zinc-800 rounded overflow-hidden relative shadow-[4px_4px_0px_rgba(0,0,0,0.7)]">
                    {selectedPerson.photo_url ? (
                      <img 
                        src={selectedPerson.photo_url} 
                        alt={selectedPerson.first_name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter contrast-125 saturate-50"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                        <User className="w-12 h-12 text-zinc-600 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-red-950/80 px-1 py-0.5 rounded text-[8px] text-red-500 font-bold border border-red-800 tracking-widest font-mono">
                      RAD-BIO
                    </div>
                  </div>
                  <div className="mt-4 w-full text-center">
                    {getStatusBadge(selectedPerson.status)}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">[SUJETO ARCHIVADO]</span>
                    <h3 className="font-typewriter text-2xl font-bold text-white uppercase tracking-wider leading-none mt-1">
                      {selectedPerson.first_name} {selectedPerson.last_name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-black/60 p-3 rounded border border-[#3b4d3e]/30 font-mono">
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">PROFESION</span>
                      <span className="text-white font-bold block truncate mt-0.5">{selectedPerson.profession.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">VIAJES SUPERADOS</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">{selectedPerson.expeditionsSurvived} EXITOSAS</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">PUNTOS DE COMBATE</span>
                      <span className="text-[#fca311] font-bold block mt-0.5">{selectedPerson.experience_points} EXP PTS</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">LOGISTICA / RANGO</span>
                      <div className="flex text-amber-500 mt-0.5">
                        {Array.from({ length: selectedPerson.experience_level }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current shrink-0" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Psych Notes */}
              <div className="py-4 space-y-1.5">
                <h4 className="text-[10px] text-[#fca311] tracking-widest font-bold uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#c27c2f]" /> NOTAS PSICOLOGICAS Y DE CAMPAMENTO:
                </h4>
                <p className="bg-neutral-950/60 p-3 rounded text-[11.5px] leading-4 text-zinc-300 border border-zinc-900 italic font-mono">
                  "{selectedPerson.previous_skills || 'No existen antecedentes psiquiatricos reportados para este sobreviviente en las terminales.'}"
                </p>
              </div>

              {/* LOGROS CLASIFICADOS - GAMIFICACION */}
              <div className="pt-2 pb-1 space-y-2.5">
                <h4 className="text-[10px] text-[#ab9e8b] tracking-widest font-bold uppercase flex items-center gap-1.5 border-t border-zinc-900 pt-4">
                  <Award className="w-4 h-4 text-[#fca311]" /> LOGROS CLASIFICADOS:
                </h4>

                {selectedPerson.achievements && selectedPerson.achievements.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedPerson.achievements.map((achCode) => (
                      <div 
                        key={achCode}
                        className="flex items-start gap-3 bg-black/40 p-2.5 rounded border border-[#3b4d3e]/20"
                      >
                        <div className="shrink-0 pt-0.5">
                          <Badge code={achCode} showText={false} />
                        </div>
                        <div className="text-[11px] space-y-0.5 font-mono">
                          <p className="font-bold text-[#fafafa] uppercase tracking-wider text-[11px]">
                            {ACHIEVEMENTS_DICT[achCode]?.name || achCode}
                          </p>
                          <p className="text-zinc-400 text-[10px] leading-3.5 italic">
                            {ACHIEVEMENTS_DICT[achCode]?.description || "Sin descripcion disponible para esta medalla de servicio militar."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center bg-zinc-900/20 rounded border border-dashed border-zinc-800/40 opacity-55">
                    <span className="text-[11px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                      - SIN LOGROS REGISTRADOS -
                    </span>
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="mt-5 pt-3.5 border-t border-zinc-900 flex justify-end">
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="cursor-pointer px-4 py-1.5 text-xs text-black font-bold uppercase tracking-widest bg-[#c27c2f] border border-amber-900 hover:bg-amber-500 transition-colors rounded"
                >
                  Cerrar Expediente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}