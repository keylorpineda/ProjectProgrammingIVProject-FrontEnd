import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import "./Sidebar.css"

export default function Sidebar() {
  const tabs = [
    { name: "TABLERO", path: "/admin/dashboard" },
    { name: "ADMISIONES", path: "/admin/admissions" },
    { name: "PERSONAL", path: "/admin/people" },
    { name: "CAMPAMENTOS", path: "/admin/camps" },
    { name: "EXPLORACIONES", path: "/admin/explorations" },
    { name: "RECURSOS", path: "/admin/resources" },
    { name: "TRASLADOS", path: "/admin/transfers" },
    { name: "MAP/TEST", path: "/admin/map-test" },
  ]

  return (
    <nav className="sidebar-container">
      {tabs.map((tab, index) => (
        <motion.div
          key={tab.path}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
        >
          <NavLink
            to={tab.path}
            className={({ isActive }) => `sidebar-tab ${isActive ? "active" : ""}`}
          >
            {tab.name}
          </NavLink>
        </motion.div>
      ))}
    </nav>
  )
}
