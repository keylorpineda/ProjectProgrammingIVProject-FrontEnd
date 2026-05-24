import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getInventory } from "@/features/inventory/services/inventory.service"
import type { InventoryItem } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./Resources.css"

type InventoryRow = {
  id: number
  name: string
  camps: Record<string, number>
  total: number
  unit: string
  status: "OK" | "ADVERTENCIA" | "CRÍTICO"
}

const getStatus = (item: InventoryItem): InventoryRow["status"] => {
  if (item.alert_active) return "CRÍTICO"
  if (item.minimum_stock_required > 0 && item.current_quantity <= item.minimum_stock_required * 1.25) {
    return "ADVERTENCIA"
  }
  return "OK"
}

export default function Resources() {
  const { activeCampId, camps } = useCamp()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true

    const loadInventory = async () => {
      setError("")
      try {
        const response = await getInventory(activeCampId)
        if (!isMounted) return
        setItems(response)
      } catch {
        if (!isMounted) return
        setError("No se pudo cargar el inventario del campamento.")
      }
    }

    void loadInventory()

    return () => {
      isMounted = false
    }
  }, [activeCampId])

  const campName = camps.find((camp) => camp.id === activeCampId)?.name ?? "Campamento"

  const rows = useMemo<InventoryRow[]>(
    () =>
      items.map((item, index) => ({
        id: index + 1,
        name: item.resource?.name ?? "N/D",
        camps: { [campName]: Number(item.current_quantity) },
        total: Number(item.current_quantity),
        unit: item.resource?.unit ?? "",
        status: getStatus(item),
      })),
    [items, campName],
  )

  return (
    <div className="generic-container">
      <h2>MANIFIESTO DE ALMACÉN</h2>

      {error ? (
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-critical)" }}>{error}</div>
      ) : null}

      <motion.div
        className="inventory-sheet"
        initial={{ y: 100, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 50 }}
      >
        <div className="sheet-header">
          <div>DEPÓSITO CENTRAL // RED ENLAZADA</div>
          <div>HOJA 1/1</div>
        </div>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID ARTÍCULO</th>
              <th>DESCRIPCIÓN</th>
              <th>CANT. GLOBAL</th>
              <th>DESGLOSE POR CAMPAMENTO</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {rows.map((item) => (
              <motion.tr
                key={item.id}
                className={`row-${item.status === "CRÍTICO" ? "critical" : item.status === "ADVERTENCIA" ? "warning" : "ok"}`}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
              >
                <td>{String(item.id).padStart(4, "0")}</td>
                <td>{item.name}</td>
                <td>
                  {item.total} {item.unit}
                </td>
                <td style={{ fontSize: "0.85em", opacity: 0.9 }}>
                  {Object.entries(item.camps).map(([camp, qty]) => (
                    <div
                      key={camp}
                      style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted rgba(255,255,255,0.1)" }}
                    >
                      <span>{camp}:</span> <span>{qty}</span>
                    </div>
                  ))}
                </td>
                <td>
                  <span
                    className={`status-badge ${item.status === "CRÍTICO" ? "critical" : item.status === "ADVERTENCIA" ? "warning" : "ok"}`}
                  >
                    {item.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
        <div className="sheet-tape tape-top-left"></div>
        <div className="sheet-tape tape-top-right"></div>
      </motion.div>
    </div>
  )
}
