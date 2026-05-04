import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getInventory } from "@/features/inventory/services/inventory.service"
import type { InventoryItem } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./Resources.css"

type InventoryRow = {
  id: string
  name: string
  total: number
  unit: string
  minimum: number
  status: "ok" | "warning" | "critical"
}

const getStatus = (item: InventoryItem): InventoryRow["status"] => {
  if (item.is_below_minimum) return "critical"
  if (item.minimum_stock_required > 0 && item.current_quantity <= item.minimum_stock_required * 1.25) {
    return "warning"
  }
  return "ok"
}

export default function Resources() {
  const { activeCampId } = useCamp()
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

  const rows = useMemo<InventoryRow[]>(
    () =>
      items.map((item) => ({
        id: item.resource_id,
        name: item.resource.name,
        total: item.current_quantity,
        unit: item.resource.unit,
        minimum: item.minimum_stock_required,
        status: getStatus(item),
      })),
    [items],
  )

  return (
    <div className="generic-container">
      <h2>MANIFIESTO DE ALMACEN</h2>

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
              <th>ID ARTICULO</th>
              <th>DESCRIPCION</th>
              <th>CANTIDAD</th>
              <th>MINIMO</th>
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
                className={`row-${item.status}`}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
              >
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>
                  {item.total} {item.unit}
                </td>
                <td>
                  {item.minimum} {item.unit}
                </td>
                <td>
                  <span className={`status-badge ${item.status}`}>{item.status.toUpperCase()}</span>
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
