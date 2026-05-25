/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { Person, ProfessionAlert, PersonStatus } from '../types/api.types';
import { Users, ShieldAlert, Cpu, Briefcase, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManagerWorkforceProps {
  campId: string;
  onDataChanged: () => void;
  refreshTrigger: number;
}

export default function ManagerWorkforce({ campId, onDataChanged, refreshTrigger }: ManagerWorkforceProps) {
  // Lists
  const [persons, setPersons] = useState<Person[]>([]);
  const [alerts, setAlerts] = useState<ProfessionAlert[]>([]);
  
  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(4); // Compact page size
  const [total, setTotal] = useState<number>(0);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Temporary Assignment Modal State
  const [assigningPerson, setAssigningPerson] = useState<Person | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string>('Farmer');
  const [submittingAssignment, setSubmittingAssignment] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [personsRes, alertsRes] = await Promise.all([
        api.get(`/users/persons?campId=${campId}&page=${page}&limit=${limit}`),
        api.get('/users/professions/alerts/needing-workers')
      ]);
      setPersons(personsRes.data.data);
      setTotal(personsRes.data.total);
      setAlerts(alertsRes.data);
    } catch (err: any) {
      setError(err?.message || 'Fallo de enlace biométrico de sobrevivientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campId, page, refreshTrigger]);

  const handleStatusChange = async (personId: string, newStatus: PersonStatus) => {
    // ⚠️ OPTIMISTIC UI: Instantly update local state to reflect change before API returns
    const previousPersonsState = [...persons];
    setPersons(prev => 
      prev.map(p => p.id === personId ? { ...p, status: newStatus } : p)
    );

    try {
      await api.put(`/users/persons/${personId}/status`, { status: newStatus });
      onDataChanged(); // Propagate change to trigger refresh on Overview & Inventory
    } catch (err: any) {
      // Rollback on fail
      setPersons(previousPersonsState);
      setError(`No se pudo actualizar el estado de salud del sobreviviente. Código error de red: ${err?.message}`);
    }
  };

  const handleOpenAssignModal = (person: Person) => {
    setAssigningPerson(person);
    setSelectedProfession(person.profession);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPerson) return;

    setSubmittingAssignment(true);
    setError(null);
    try {
      await api.post('/users/temporary-assignments', {
        personId: assigningPerson.id,
        assignment: selectedProfession
      });
      setAssigningPerson(null);
      fetchData();
      onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Error al asignar la orden temporal de trabajo.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-[#c27c2f]">
        <RefreshCw className="h-10 w-10 animate-spin mb-4" />
        <span className="animate-pulse text-sm">LEYENDO BIO-MÉTRICA DE TRABAJADORES...</span>
      </div>
    );
  }

  const professionsList = ['Farmer', 'Doctor', 'Engineer', 'Soldier', 'Scavenger'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-4"
    >
      {/* LEFT COLUMN: IA ALERTS / ADVISORY WIDGET (4 COLS) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="border-2 border-black bg-[#1a1a1a] p-4 font-mono text-[#e0d8cc] space-y-4">
          <div className="flex items-center gap-2 text-[#c27c2f] border-b-2 border-black pb-2">
            <Cpu className="h-4.5 w-4.5 animate-pulse text-[#c27c2f]" />
            <h4 className="font-bold text-xs uppercase tracking-wider">RECOM_AUTÓMATA_SISTEMA_IA</h4>
          </div>

          <p className="text-[10px] text-zinc-400 leading-relaxed uppercase">
            Sistemas de patrullaje biónico analizan los cuellos de botella de especialización en búnker.
          </p>

          <div className="space-y-3 pt-1">
            {alerts.length === 0 ? (
              <div className="text-[10px] text-emerald-400 bg-[#161513] border-2 border-black px-3 py-2 font-bold uppercase tracking-wide">
                ✔ DISTRIBUCIÓN LABORAL ÓPTIMA. Sin cuellos de botella detectados.
              </div>
            ) : (
              alerts.map((alert, i) => {
                const colors = alert.severity === 'high' 
                  ? 'border-2 border-black bg-[#9c2720]/10 text-[#9c2720] shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' 
                  : alert.severity === 'medium'
                    ? 'border-2 border-black bg-transparent text-[#c27c2f]'
                    : 'border-2 border-black bg-[#2a2824] text-[#e0d8cc]';
                
                return (
                  <div key={i} className={`p-3 text-xs space-y-1.5 font-mono ${colors}`}>
                    <div className="flex justify-between font-bold">
                      <span className="font-black uppercase">REQ: FALTA {alert.neededCount} {alert.profession.toUpperCase()}(S)</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest px-1 border border-black bg-black text-white">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#e0d8cc]/75 uppercase">
                      {alert.impactDescription.toUpperCase()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: WORKERS TABLE PAGINATED (8 COLS) */}
      <div className="lg:col-span-8 space-y-4">
        {error && (
          <div className="border-2 border-black bg-[#9c2720]/20 text-red-250 font-mono text-xs p-3.5 flex items-start gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <span className="font-bold">CONEXIÓN RECHAZADA:</span> {error}
            </div>
          </div>
        )}

        <div className="border-2 border-black bg-[#161513] overflow-hidden">
          {/* HEADER BAR */}
          <div className="bg-black border-b border-black p-3 font-mono flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-[#c27c2f]" />
              <span className="text-xs text-[#c27c2f] font-bold uppercase tracking-wider">CENSO_FUERZA_TRABAJO_ACTIVO</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Pág. {page} / {Math.ceil(total / limit) || 1}</span>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse font-mono text-xs text-[#e0d8cc]">
              <thead className="bg-[#121110] border-b border-black text-left uppercase text-[#c27c2f] text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-2.5 border-r border-black">SOBREVIVIENTE / SKILLS</th>
                  <th className="p-2.5 border-r border-black">PROFESIÓN_ROL</th>
                  <th className="p-2.5 border-r border-black text-center">BIOMETRÍA_FÍSICA</th>
                  <th className="p-2.5 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {persons.map((person) => {
                  let rowColor = 'border-b border-black hover:bg-[#2a2824]/40';
                  
                  if (person.status === 'sick') {
                    rowColor = 'bg-[#2a1111] hover:bg-[#321515] border-b border-black text-[#e0d8cc]';
                  } else if (person.status === 'injured') {
                    rowColor = 'bg-[#2a1e12] hover:bg-[#322315] border-b border-black text-[#e0d8cc]';
                  }

                  return (
                    <tr key={person.id} className={`${rowColor} transition-colors`}>
                      <td className="p-2.5 border-r border-black">
                        <div className="font-bold flex items-center gap-1.5 uppercase">
                          {person.name}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-normal uppercase mt-1">
                          APTITUDES: {person.skills.join(', ').toUpperCase()}
                        </div>
                        {person.injuryDetails && (
                          <div className="text-[8px] text-[#9c2720] font-black uppercase tracking-wider mt-0.5 animate-pulse">
                            ☣ ALERTA: {person.injuryDetails.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-black">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-black bg-black text-[#c27c2f] font-black uppercase text-[10px]">
                          {person.profession.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-black text-center">
                        <select
                          value={person.status}
                          onChange={(e) => handleStatusChange(person.id, e.target.value as PersonStatus)}
                          className="w-full text-[10px] font-black uppercase py-1 px-1.5 text-black bg-[#9a9080] border-2 border-black hover:bg-[#b0a593] transition cursor-pointer outline-none"
                        >
                          <option value="active" className="bg-[#161513] text-[#e0d8cc]">SANO (ACTIVO)</option>
                          <option value="sick" className="bg-[#161513] text-[#e0d8cc]">ENFERMO (SICK)</option>
                          <option value="injured" className="bg-[#161513] text-[#e0d8cc]">HERIDO (INJURED)</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(person)}
                          className="underline cursor-pointer hover:text-white text-[10px] font-bold uppercase transition"
                        >
                          [ORDEN_ROL]
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="bg-[#121110] border-t-2 border-black p-3.5 flex justify-between items-center font-mono">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="border-2 border-black bg-transparent text-[#e0d8cc] text-[10px] font-bold px-3 py-1.5 uppercase hover:bg-white hover:text-black transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#e0d8cc]"
            >
              [ANTERIOR]
            </button>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">SOBREVIVIENTES ({total} REGISTRADOS)</span>
            <button
              type="button"
              disabled={page * limit >= total}
              onClick={() => setPage(p => p + 1)}
              className="border-2 border-black bg-transparent text-[#e0d8cc] text-[10px] font-bold px-3 py-1.5 uppercase hover:bg-white hover:text-black transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#e0d8cc]"
            >
              [SIGUIENTE]
            </button>
          </div>
        </div>
      </div>

      {/* TEMPORARY ASSIGNMENT MODAL (POST /users/temporary-assignments) */}
      {assigningPerson && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#161513] border-4 border-double border-[#c27c2f] p-6 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#c27c2f]">
              <Briefcase className="h-5 w-5 animate-pulse text-[#c27c2f]" />
              <h4 className="font-bold uppercase tracking-widest text-xs">DESPACHAR ORDEN TEMPORAL</h4>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed uppercase">
              Asigna de manera forzosa el rol operacional a <span className="font-bold text-[#e0d8cc]">{assigningPerson.name.toUpperCase()}</span>. 
              La IA reestructurará su perfil de habilidades de inmediato.
            </p>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">
                  ASIGNAR ROL / PROFESIÓN:
                </label>
                <select
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-sm font-bold font-mono transition uppercase font-semibold text-[#e0d8cc]"
                >
                  {professionsList.map(prof => (
                    <option key={prof} value={prof} className="bg-[#161513] text-[#e0d8cc]">{prof.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningPerson(null)}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="flex-1 border-2 border-black bg-[#c27c2f] text-[#161513] uppercase text-xs py-2 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                >
                  {submittingAssignment ? 'COMUNICANDO...' : 'REASIGNAR HUMANO'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
