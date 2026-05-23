// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Person, CampStatistics, User as UserType } from '../types';
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
  Skull
} from 'lucide-react';

interface ProfileViewProps {
  user: UserType | null;
  statistics: CampStatistics;
  residents: Person[];
}

export default function ProfileView({ user, statistics, residents }: ProfileViewProps) {
  
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
          <h2 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase">
            EXPEDIENTE JURÍDICO DEL REFUGIO Y COMBATIENTES
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
              [IDENTIFICACIÓN CONSEJO MILITAR]
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
                <span className="font-bold">LÍDER DE VIAJES</span>
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
        <div id="bunker-audit-card" className="bg-black/30 border border-[#3b4d3e] rounded-lg backdrop-blur-sm shadow-md p-6 border-[#3b4d3e] flex flex-col justify-between col-span-2">
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
                <span className="text-[9px] font-mono text-[#ab9e8b] block uppercase">POBLACIÓN TOTAL</span>
                <span className="font-typewriter text-2xl font-bold text-amber-500">{statistics.total_persons}</span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-1">SOBREVIVIENTES</span>
              </div>

              <div className="bg-black/45 p-3 rounded border border-[#3b4d3e]/40 text-center">
                <span className="text-[9px] font-mono text-[#ab9e8b] block uppercase">MANO DE OBRA ACTIVA</span>
                <span className="font-typewriter text-2xl font-bold text-emerald-500">{statistics.active_workers}</span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-1">OPERARIOS SANOS</span>
              </div>

              <div className="bg-black/45 p-3 rounded border border-[#3b4d3e]/40 text-center">
                <span className="text-[9px] font-mono text-[#ab9e8b] block uppercase">EN BÚSQUEDA EXCLUSIÓN</span>
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
                <span className="text-[10px] text-zinc-400 font-mono block uppercase">TASA OCUPACIÓN BÚNKER (8 CAMAS)</span>
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
      <div id="citizens-manifest-section" className="bg-black/30 border border-[#3b4d3e] rounded-lg backdrop-blur-sm shadow-md p-6 border-[#3b4d3e]">
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
                className="bg-black/30 border border-[#3b4d3e]/30 p-4 rounded-lg flex flex-col sm:flex-row gap-4 relative hover:border-[#3b4d3e]/60 transition-colors"
              >
                {/* ID Tag top corner */}
                <div className="absolute top-2 right-2 text-[9px] font-mono text-zinc-500">
                  ID: #{p.id}
                </div>

                {/* Left Profile Avatar space or placeholders with referrer policy */}
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center overflow-hidden rounded">
                  {p.photo_url ? (
                    <img 
                      src={p.photo_url} 
                      alt={p.first_name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter contrast-125 saturate-50"
                    />
                  ) : (
                    <User className="w-8 h-8 text-zinc-600 animate-pulse" />
                  )}
                </div>

                {/* Right Person files details */}
                <div className="flex-1 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-typewriter text-sm font-bold text-white uppercase">
                      {p.first_name} {p.last_name}
                    </h4>
                    {getStatusBadge(p.status)}
                  </div>

                  <p className="text-[10px] text-[#ab9e8b] uppercase pb-1 border-b border-zinc-900/60 leading-3">
                    PROFESIÓN: <span className="text-white font-bold">{p.profession.name}</span>
                  </p>

                  <div className="flex justify-between items-center text-[11px] pt-1">
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
                    <div className="bg-zinc-900/50 p-1.5 rounded text-[10.5px] text-[#ab9e8b] font-mono leading-3.5 italic border border-zinc-850">
                      * Notas de reclutamiento: "{p.previous_skills}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
