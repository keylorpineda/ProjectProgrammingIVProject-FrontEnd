import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import "./Sidebar.css"

export default function Sidebar() {
  const tabs = [
    { name: "DASHBOARD", path: "/admin/dashboard" },
    { name: "ADMISSIONS", path: "/admin/admissions" },
    { name: "PEOPLE", path: "/admin/people" },
    { name: "CAMPS", path: "/admin/camps" },
    { name: "EXPLORATIONS", path: "/admin/explorations" },
    { name: "RESOURCES", path: "/admin/resources" },
    { name: "TRANSFERS", path: "/admin/transfers" },
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
