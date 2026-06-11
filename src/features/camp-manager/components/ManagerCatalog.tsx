/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2, RefreshCw, ShieldAlert, PackageSearch } from "lucide-react"
import { useState } from "react"

import { api } from "../config/api"

import type { FormEvent } from "react"

interface Resource {
  id: string
  name: string
  unit: string
  category: string
  description: string | null
}

interface ManagerCatalogProps {
  campId: string
  onDataChanged: () => void
}

const CATEGORIES = [
  { value: "food", label: "ALIMENTOS", icon: "🌽" },
  { value: "water", label: "AGUA", icon: "💧" },
  { value: "medical", label: "MEDICINA", icon: "💊" },
  { value: "weapons", label: "ARMAMENTO", icon: "⚔️" },
  { value: "materials", label: "MATERIALES", icon: "📦" },
  { value: "tools", label: "HERRAMIENTAS", icon: "🔧" },
]

function catIcon(category: string): string {
  const c = category.toLowerCase()
  return (
    CATEGORIES.find((cat) => c === cat.value || c.includes(cat.value) || cat.value.includes(c))
      ?.icon ?? "📦"
  )
}

const emptyForm = { name: "", unit: "", category: "food", description: "" }

export default function ManagerCatalog({ campId, onDataChanged }: ManagerCatalogProps) {
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["managerCatalog"],
    queryFn: async () => {
      const res = await api.get("/resources?limit=100")
      const raw = res.data?.data ?? res.data ?? []
      return (Array.isArray(raw) ? raw : []) as Resource[]
    },
    staleTime: 1000 * 60 * 2,
  })

  const resources = data ?? []

  const [errorState, setErrorState] = useState<string | null>(null)
  const error = queryError ? (queryError as any).message || "Error al cargar catálogo." : errorState

  // Modal state
  const [mode, setMode] = useState<"create" | "edit" | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Initialize inventory
  const [initializing, setInitializing] = useState(false)
  const [initDone, setInitDone] = useState(false)

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setErrorState(null)
    setMode("create")
  }

  const openEdit = (r: Resource) => {
    setForm({
      name: r.name,
      unit: r.unit,
      category: r.category,
      description: r.description ?? "",
    })
    setEditingId(r.id)
    setErrorState(null)
    setMode("edit")
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.unit.trim()) {
      setErrorState("Nombre y unidad son obligatorios.")
      return
    }
    setSubmitting(true)
    setErrorState(null)
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim(),
        category: form.category,
        description: form.description.trim() || undefined,
      }
      if (mode === "create") {
        await api.post("/resources", payload)
      } else {
        await api.patch(`/resources/${editingId}`, payload)
      }
      setMode(null)
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.response?.data?.message || err?.message || "Error al guardar recurso.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/resources/${confirmDelete.id}`)
      setConfirmDelete(null)
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.response?.data?.message || err?.message || "Error al eliminar recurso.")
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleInitialize = async () => {
    setInitializing(true)
    setErrorState(null)
    try {
      await api.post(`/resources/inventory/initialize/${campId}`)
      setInitDone(true)
      setTimeout(() => setInitDone(false), 3000)
    } catch (err: any) {
      setErrorState(
        err?.response?.data?.message || err?.message || "Error al inicializar inventario.",
      )
    } finally {
      setInitializing(false)
    }
  }

  if (isLoading) return <div className="min-h-[400px]" />

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          onClick={handleInitialize}
          disabled={initializing}
          className="cursor-pointer flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 text-zinc-300 px-5 py-3 text-sm font-black uppercase transition active:translate-y-0.5"
        >
          <PackageSearch className="h-4 w-4" />
          {initDone ? "INVENTARIO LISTO" : initializing ? "INICIALIZANDO..." : "INIT INVENTARIO"}
        </button>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer flex items-center gap-2 bg-[#c27c2f]/10 hover:bg-[#c27c2f] hover:text-black border-2 border-[#c27c2f] text-[#c27c2f] px-5 py-3 text-sm font-black uppercase transition active:translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> NUEVO RECURSO
        </button>
      </div>

      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-200 font-mono text-xs p-3.5 flex items-start gap-4">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>
            <span className="font-bold">ERROR:</span> {error}
          </span>
        </div>
      )}

      {/* TABLE — ledger book style */}
      <div
        style={{
          backgroundColor: "#cec8b6",
          border: "1px solid rgba(0,0,0,0.25)",
          borderLeft: "4px solid #6a4a1a",
          boxShadow: "-3px 10px 32px rgba(0,0,0,0.75)",
          overflow: "hidden",
          color: "#1a1208",
        }}
      >
        <table className="table-auto w-full border-collapse font-mono">
          <thead style={{ backgroundColor: "#b8b29e" }}>
            <tr>
              <th
                style={{
                  padding: "20px 28px",
                  borderRight: "1px solid rgba(0,0,0,0.2)",
                  textAlign: "left",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#2a1a08",
                }}
              >
                RECURSO
              </th>
              <th
                style={{
                  padding: "20px 28px",
                  borderRight: "1px solid rgba(0,0,0,0.2)",
                  textAlign: "left",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#2a1a08",
                }}
              >
                CATEGORÍA
              </th>
              <th
                style={{
                  padding: "20px 28px",
                  borderRight: "1px solid rgba(0,0,0,0.2)",
                  textAlign: "left",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#2a1a08",
                }}
              >
                UNIDAD
              </th>
              <th
                className="hidden md:table-cell"
                style={{
                  padding: "20px 28px",
                  borderRight: "1px solid rgba(0,0,0,0.2)",
                  textAlign: "left",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#2a1a08",
                }}
              >
                DESCRIPCIÓN
              </th>
              <th
                style={{
                  padding: "20px 28px",
                  textAlign: "center",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#2a1a08",
                }}
              >
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "#9a8a6a",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  SIN RECURSOS REGISTRADOS
                </td>
              </tr>
            )}
            {resources.map((r, idx) => (
              <tr
                key={r.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#cec8b6" : "#d8d2bf",
                  borderBottom: "1px solid rgba(0,0,0,0.12)",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#c4bda8")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                    idx % 2 === 0 ? "#cec8b6" : "#d8d2bf")
                }
              >
                <td style={{ padding: "22px 28px", borderRight: "1px solid rgba(0,0,0,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: "2.2rem", lineHeight: 1, flexShrink: 0 }}>
                      {catIcon(r.category)}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        textTransform: "uppercase",
                        color: "#0d0a04",
                        lineHeight: 1.2,
                      }}
                    >
                      {r.name}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "22px 28px", borderRight: "1px solid rgba(0,0,0,0.15)" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      color: "#6a3a0a",
                      border: "1px solid rgba(106,58,10,0.5)",
                      padding: "5px 12px",
                      letterSpacing: "1px",
                    }}
                  >
                    {CATEGORIES.find((c) => c.value === r.category)?.label ??
                      r.category.toUpperCase()}
                  </span>
                </td>
                <td
                  style={{
                    padding: "22px 28px",
                    borderRight: "1px solid rgba(0,0,0,0.15)",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    color: "#3a2a0a",
                  }}
                >
                  {r.unit}
                </td>
                <td
                  className="hidden md:table-cell"
                  style={{
                    padding: "22px 28px",
                    borderRight: "1px solid rgba(0,0,0,0.15)",
                    fontFamily: "monospace",
                    fontSize: "0.82rem",
                    color: "#6a5a3a",
                    maxWidth: 300,
                  }}
                >
                  {r.description ?? "—"}
                </td>
                <td style={{ padding: "22px 28px", textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(106,58,10,0.6)",
                        color: "#6a3a0a",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        padding: "8px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "rgba(106,58,10,0.15)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "transparent")
                      }
                    >
                      <Pencil style={{ width: 14, height: 14 }} /> EDITAR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete(r)
                        setErrorState(null)
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(156,39,32,0.6)",
                        color: "#9c2720",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        padding: "8px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "rgba(156,39,32,0.12)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "transparent")
                      }
                    >
                      <Trash2 style={{ width: 14, height: 14 }} /> BORRAR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: CREATE / EDIT */}
      {mode && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-[#161513] border-4 border-double border-[#c27c2f] p-8 md:p-10 font-mono text-[#e0d8cc] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6 text-[#c27c2f]">
              {mode === "create" ? <Plus className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
              <h4 className="font-black uppercase tracking-widest text-base md:text-lg">
                {mode === "create" ? "REGISTRAR NUEVO RECURSO" : "MODIFICAR RECURSO"}
              </h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="catalog-name"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  NOMBRE DEL RECURSO:
                </label>
                <input
                  id="catalog-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#2a2824] border-2 border-black p-3 text-[#e0d8cc] outline-none text-base font-bold font-mono"
                  placeholder="Ej: Comida Enlatada"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="catalog-category"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  CATEGORÍA:
                </label>
                <select
                  id="catalog-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#2a2824] border-2 border-black p-3 text-[#e0d8cc] outline-none text-base font-bold font-mono uppercase"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="catalog-unit"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  UNIDAD DE MEDIDA:
                </label>
                <input
                  id="catalog-unit"
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-full bg-[#2a2824] border-2 border-black p-3 text-[#e0d8cc] outline-none text-base font-bold font-mono"
                  placeholder="Ej: kg, litros, unidades"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="catalog-desc"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  DESCRIPCIÓN (OPCIONAL):
                </label>
                <textarea
                  id="catalog-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={200}
                  rows={3}
                  className="w-full bg-[#2a2824] border-2 border-black p-3 text-[#e0d8cc] outline-none text-base font-mono resize-none"
                  placeholder="Breve descripción del recurso..."
                />
              </div>

              {errorState && (
                <div className="text-sm text-red-400 uppercase border border-[#9c2720]/50 bg-[#9c2720]/10 p-3">
                  {errorState}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode(null)
                    setErrorState(null)
                  }}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-sm py-3 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 border-2 border-black uppercase text-sm py-3 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#c27c2f", color: "#e0d8cc" }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> GUARDANDO...
                    </>
                  ) : mode === "create" ? (
                    "REGISTRAR"
                  ) : (
                    "ACTUALIZAR"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-[#161513] border-4 border-double border-[#9c2720] p-6 font-mono text-[#e0d8cc] shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#9c2720]">
              <Trash2 className="h-5 w-5" />
              <h4 className="font-bold uppercase tracking-widest text-xs">CONFIRMAR ELIMINACIÓN</h4>
            </div>
            <p className="text-xs text-zinc-400 uppercase leading-relaxed mb-5">
              Eliminar{" "}
              <span className="font-bold text-[#e0d8cc]">{confirmDelete.name.toUpperCase()}</span>{" "}
              del catálogo. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
              >
                [CANCELAR]
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 border-2 border-black uppercase text-xs py-2 hover:bg-[#801815] transition font-black"
                style={{ backgroundColor: "#9c2720", color: "#fff" }}
              >
                {deleting ? "ELIMINANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
