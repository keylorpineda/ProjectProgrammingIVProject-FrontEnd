import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { getPersons } from "@/features/persons/services/persons.service"
import type { Person } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./People.css"

type PersonView = {
  id: string
  name: string
  status: string
  profession: string
  camp: string
  age?: number | string
}

const statusLabels: Record<string, string> = {
  active: "Activa",
  sick: "Enfermo",
  injured: "Herido",
  exploring: "Explorando",
  traveling: "En traslado",
  resting: "Reposo",
  idle: "Inactivo",
  out_of_camp: "Fuera de campamento",
  deceased: "Fallecido",
}

export default function People() {
  const { activeCampId, camps } = useCamp()
  const [people, setPeople] = useState<Person[]>([])
  const [page, setPage] = useState(1)
  const [filterCamp, setFilterCamp] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<PersonView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const campById = useMemo(() => new Map(camps.map((camp) => [camp.id, camp.name])), [camps])

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true

    const loadPeople = async () => {
      setIsLoading(true)
      setError("")
      try {
        const response = await getPersons({ campId: activeCampId, page, limit: 10 })
        if (!isMounted) return
        setPeople(response.data)
      } catch {
        if (!isMounted) return
        setError("No se pudo cargar el listado de personas.")
        setPeople([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadPeople()

    return () => {
      isMounted = false
    }
  }, [activeCampId, page])

  const mappedPeople = useMemo<PersonView[]>(
    () =>
      people.map((person) => {
        const name = [person.first_name, person.last_name, person.last_name2]
          .filter(Boolean)
          .join(" ")
          .trim()
        return {
          id: person.id,
          name: name || "N/D",
          status: statusLabels[person.status ?? ""] ?? (person.status ?? "N/D"),
          profession: person.profession?.name ?? person.profession_id ?? "N/D",
          camp: campById.get(activeCampId) ?? activeCampId,
          age: "N/D",
        }
      }),
    [people, campById, activeCampId],
  )

  const filteredPeople = mappedPeople.filter((person) => {
    if (filterCamp && person.camp !== filterCamp) return false
    if (filterStatus && person.status !== filterStatus) return false
    return true
  })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, rotate: -5 },
    show: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring" as const, stiffness: 200 } },
  }

  return (
    <div className="people-container">
      <h2>DOSSIERS DEL SISTEMA {page > 1 ? `| PÁGINA ${page}` : ""}</h2>

      <div className="filters-bar" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <input
          className="vintage-input"
          placeholder="Filtrar por campamento (ej: Sector 4)"
          value={filterCamp}
          onChange={(event) => setFilterCamp(event.target.value)}
        />
        <input
          className="vintage-input"
          placeholder="Estado (ej: Activa, Herido)"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        />
      </div>

      {error ? (
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-critical)" }}>{error}</div>
      ) : null}

      {isLoading ? (
        <div style={{ fontFamily: "var(--font-mono)", opacity: 0.7 }}>CARGANDO...</div>
      ) : (
        <motion.div className="dossier-grid" variants={containerVariants} initial="hidden" animate="show">
          {filteredPeople.map((person) => (
            <motion.div
              key={person.id}
              className="dossier-card"
              variants={cardVariants}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              onClick={() => setSelectedPerson(person)}
            >
              <div className="dossier-photo-placeholder">
                <svg viewBox="0 0 24 24" fill="var(--ink)" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                </svg>
              </div>
              <div className="dossier-info">
                <div className="d-name">{person.name}</div>
                <div className="d-prof">{person.profession}</div>
                <div className="d-status">STS: {person.status}</div>
                <div className="d-camp" style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                  CMP: {person.camp}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
          ANTERIOR
        </button>
        <button onClick={() => setPage((prev) => prev + 1)} disabled={people.length === 0}>
          SIGUIENTE
        </button>
      </div>

      <AnimatePresence>
        {selectedPerson ? (
          <motion.div
            className="person-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPerson(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <motion.div
              className="person-modal-content"
              initial={{ y: 50, rotateX: 20 }}
              animate={{ y: 0, rotateX: 0 }}
              exit={{ y: 50, rotateX: -20, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                padding: "40px",
                backgroundColor: "var(--bg-paper)",
                fontFamily: "var(--font-mono)",
                border: "2px solid var(--ink)",
                boxShadow: "10px 10px 0 #000",
                maxWidth: "500px",
                width: "100%",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  borderBottom: "2px solid var(--ink)",
                  paddingBottom: "10px",
                }}
              >
                DETALLE CLASIFICADO
              </h2>
              <p>
                <strong>NOMBRE:</strong> {selectedPerson.name}
              </p>
              <p>
                <strong>EDAD:</strong> {selectedPerson.age}
              </p>
              <p>
                <strong>PROFESIÓN:</strong> {selectedPerson.profession}
              </p>
              <p>
                <strong>ESTADO:</strong> {selectedPerson.status}
              </p>
              <p>
                <strong>CAMPAMENTO:</strong> {selectedPerson.camp}
              </p>
              <div style={{ marginTop: "20px", textAlign: "right" }}>
                <button
                  onClick={() => setSelectedPerson(null)}
                  style={{
                    border: "1px solid var(--ink)",
                    background: "transparent",
                    padding: "5px 15px",
                    cursor: "pointer",
                  }}
                >
                  CERRAR DOSSIER
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
