import {
  LayoutDashboard,
  UserPlus,
  Users,
  Tent,
  MapPin,
  Database,
  Truck,
  UserCircle,
} from "lucide-react"
import { NavLink } from "react-router-dom"

export default function Sidebar() {
  const tabs = [
    { name: "TABLERO", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "ADMISIONES", path: "/admin/admissions", icon: UserPlus },
    { name: "PERSONAL", path: "/admin/people", icon: Users },
    { name: "CAMPAMENTOS", path: "/admin/camps", icon: Tent },
    { name: "EXPLORACIONES", path: "/admin/explorations", icon: MapPin },
    { name: "RECURSOS", path: "/admin/resources", icon: Database },
    { name: "TRASLADOS", path: "/admin/transfers", icon: Truck },
    { name: "PERFIL", path: "/admin/profile", icon: UserCircle },
  ]

  return (
    <aside className="w-full md:w-72 bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col justify-between shrink-0 z-20 select-none font-mono">
      <div>
        {/* BRAND HEADER */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            <span className="text-[#9c2720] text-xl animate-pulse font-bold">★</span>
            <span className="text-lg font-black text-[#df8120] tracking-widest uppercase">
              ADMINISTRACIÓN
            </span>
          </div>
          <p className="text-sm text-zinc-500 tracking-wider font-extrabold uppercase mt-0.5 pl-0.5">
            SISTEMA CENTRAL
          </p>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0 font-mono">
          {tabs.map((tab) => {
            const Icon = tab.icon

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `w-full text-left relative flex items-center justify-center md:justify-start gap-3 md:gap-4 py-4 px-4 md:px-5 rounded-xl transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0 ${
                    isActive ? "bg-[#c27c2f]" : "bg-[#9a9080]"
                  }`
                }
                style={{
                  borderColor: "#000000",
                  borderWidth: "2px",
                  color: "#000000",
                  boxShadow: "3px 3px 0px #000000",
                  padding: "20px 20px",
                  marginBottom: "16px",
                }}
              >
                <Icon className="w-6 h-6 shrink-0 text-black font-extrabold" />
                <span className="font-mono text-sm md:text-xs lg:text-sm tracking-wider uppercase text-black font-extrabold select-none truncate">
                  {tab.name}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
