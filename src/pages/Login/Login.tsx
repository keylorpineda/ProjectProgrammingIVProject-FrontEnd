import { useState, useEffect, useRef } from "react"
import { BadgeLogin } from "../../components/BadgeLogin"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { login } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/store/useAuthStore"

type LoginStatus = "waiting" | "processing" | "granted" | "denied"

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("waiting")
  const [isGateOpen, setIsGateOpen] = useState(false)
  const rafRef = useRef<number | null>(null)

  // MotionValues bypass React state — zero re-renders on mouse move
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const bgX2  = useTransform(mouseX, v => v * -2)
  const bgY2  = useTransform(mouseY, v => v * -2)
  const bgX4  = useTransform(mouseX, v => v * -4)
  const bgY4  = useTransform(mouseY, v => v * -4)
  const bgX5  = useTransform(mouseX, v => v * -5)
  const bgY5  = useTransform(mouseY, v => v * -5)
  const bgX6  = useTransform(mouseX, v => v * -6)
  const bgY6  = useTransform(mouseY, v => v * -6)
  const bgX8  = useTransform(mouseX, v => v * -8)
  const bgY8  = useTransform(mouseY, v => v * -8)
  const bgX20 = useTransform(mouseX, v => v * -20)
  const bgY20 = useTransform(mouseY, v => v * -20)

  const finalizeLogin = (role?: string) => {
    setLoginStatus("granted")
    setTimeout(() => {
      setIsGateOpen(true)
      setTimeout(() => {
        const normalizedRole = role?.toLowerCase()
        navigate(
          normalizedRole === "admin" || normalizedRole === "superadmin" || normalizedRole === "super_admin"
            ? "/admin/dashboard"
            : "/dashboard",
        )
      }, 3500)
    }, 1500)
  }

  const handleLogin = async (u: string, p: string) => {
    setLoginStatus("processing")

    let beeps = 0
    const beepInterval = setInterval(() => {
      beeps++
      if (beeps > 4) clearInterval(beepInterval)
    }, 150)

    try {
      const response = await login({ username: u, password: p })
      setAuth(response.access_token, response.user, response.refresh_token)
      finalizeLogin(response.user.role)
    } catch {
      const isDevBypass = import.meta.env.DEV || import.meta.env.VITE_ADMIN_BYPASS === "true"
      if (isDevBypass && u.toLowerCase() === "admin" && p === "1234") {
        setAuth("dev-admin-token", { id: "admin-dev", username: "Admin", role: "admin", campId: "" }, null)
        finalizeLogin("admin")
        return
      }

      setLoginStatus("denied")
      setTimeout(() => setLoginStatus("waiting"), 2000)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5
        const y = e.clientY / window.innerHeight - 0.5
        // Update MotionValues directly — no React setState, no re-render
        mouseX.set(x)
        mouseY.set(y)
        rafRef.current = null
      })
    }
    document.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [mouseX, mouseY])



  return (
    <div className="industrial-login-page fixed inset-0 overflow-hidden bg-[#020202] font-sans selection:bg-[#4ade80] selection:text-black">
      {/* SVG filters removed — they are very expensive on GPU */}

      {/* BACKGROUND SCENE: Realistic Cinematic Camp Entrance */}
      <div
        className="absolute inset-0 z-0 bg-[#020406] overflow-hidden flex flex-col items-center"
        style={{ perspective: "1000px" }}
      >
        {/* APOCALYPTIC SKY */}
        <div className="absolute top-0 w-[100vw] h-[60vh] bg-gradient-to-b from-[#1a0f08] via-[#0f0c08] to-[#050403] z-0">
          {/* Eerie toxic orange/greenish glow on the horizon (safe RGBA) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_40%_at_50%_100%,rgba(180,70,10,0.2)_0%,rgba(100,90,20,0.1)_40%,rgba(0,0,0,0)_70%)] mix-blend-screen pointer-events-none" />
          {/* Distant fire glows / smog without bounds clipping */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_90%,rgba(220,30,30,0.15)_0%,rgba(0,0,0,0)_30%),radial-gradient(circle_at_80%_95%,rgba(250,100,0,0.1)_0%,rgba(0,0,0,0)_40%)] mix-blend-screen pointer-events-none" />

          {/* Subtle star field / ash falling */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at center, #ffd 1.5px, transparent 1px)",
              backgroundSize: "70px 70px",
              backgroundPosition: "20px 20px",
            }}
          ></div>
        </div>

        {/* Distant Mountains / City Ruins - Layer 1 (Furthest) */}
        <motion.div
          className="absolute bottom-[25%] left-[-10%] w-[120%] h-[50vh] opacity-40 pointer-events-none mix-blend-screen"
          style={{
            x: bgX2,
            y: bgY2,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1000 200' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,200 L0,120 L40,130 L60,90 L90,140 L130,110 L160,150 L200,80 L230,120 L270,100 L310,160 L360,70 L390,130 L450,110 L480,180 L520,130 L560,150 L600,90 L650,160 L700,80 L750,140 L800,100 L870,170 L920,80 L1000,150 L1000,200 Z' fill='%231a1510'/%3E%3C/svg%3E\")",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            willChange: "transform",
          }}
        />

        {/* Distant Mountains / City Ruins - Layer 2 (Mid) */}
        <motion.div
          className="absolute bottom-[20%] left-[-5%] w-[110%] h-[45vh] opacity-60 pointer-events-none mix-blend-overlay"
          style={{
            x: bgX4,
            y: bgY4,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1000 200' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,200 L0,150 L50,120 L120,160 L180,90 L200,120 L250,100 L280,140 L320,80 L350,150 L400,160 L440,110 L480,100 L550,150 L620,110 L680,140 L700,180 L740,150 L780,120 L820,140 L850,160 L890,110 L920,80 L960,130 L1000,150 L1000,200 Z' fill='%2305080e'/%3E%3C/svg%3E\")",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            willChange: "transform",
          }}
        />

        {/* Glowing Atmosphere behind gates (Fixed clipping square artifact) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,200,100,0.06)_0%,rgba(255,100,0,0.02)_30%,rgba(0,0,0,0)_60%)] pointer-events-none mix-blend-screen z-0" />

        {/* Distant Watchtowers & Ruined Trees Silhouettes */}
        <motion.div
          className="absolute bottom-[20%] left-0 w-full h-[50vh] opacity-80 pointer-events-none mix-blend-overlay flex justify-between z-0"
          style={{ x: bgX6, y: bgY6, willChange: "transform" }}
        >
          {/* Left Watchtower silhouette */}
          <div className="w-[15%] h-full relative" style={{ transform: "translateX(20%)" }}>
            <div className="absolute bottom-0 w-4 h-full bg-black left-4 rotate-[1deg]" />
            <div className="absolute bottom-0 w-4 h-full bg-black right-4 -rotate-[1deg]" />
            <div className="absolute top-[20%] w-[130%] h-10 bg-black -left-[15%]" />
            <div className="absolute top-[15%] w-[90%] h-8 bg-black left-[5%]" />
            {/* Crossbeams */}
            <div className="absolute top-[40%] w-[100%] h-2 bg-black left-0 rotate-[35deg]" />
            <div className="absolute top-[40%] w-[100%] h-2 bg-black left-0 -rotate-[35deg]" />
            <div className="absolute top-[60%] w-[100%] h-2 bg-black left-0 rotate-[35deg]" />
            <div className="absolute top-[60%] w-[100%] h-2 bg-black left-0 -rotate-[35deg]" />
          </div>

          {/* Center Ruined trees / structures */}
          <div className="flex-1 h-full flex items-end justify-center px-[10%] opacity-90 blur-[1px]">
            <div className="w-2 h-[45%] bg-black rotate-[-5deg] mx-2" />
            <div className="w-1 h-[25%] bg-black rotate-[15deg] mx-4" />
            <div className="w-3 h-[55%] bg-black rotate-[2deg] mx-8" />
            <div className="w-2 h-[35%] bg-black rotate-[-12deg] mx-4" />
            <div className="w-4 h-[65%] bg-black rotate-[5deg] mx-10" />
            <div className="w-2 h-[25%] bg-black rotate-[-28deg] mx-2" />
            <div className="w-3 h-[40%] bg-black rotate-[8deg] mx-6" />
            <div className="w-1 h-[20%] bg-black rotate-[-15deg] mx-4" />
          </div>

          {/* Right Watchtower silhouette */}
          <div
            className="w-[15%] h-full relative"
            style={{ transform: "translateX(-20%) scale(0.8)" }}
          >
            <div className="absolute bottom-0 w-4 h-full bg-black left-4 -rotate-1" />
            <div className="absolute bottom-0 w-4 h-full bg-black right-4 rotate-1" />
            <div className="absolute top-[20%] w-[130%] h-10 bg-black -left-[15%]" />
            <div className="absolute top-[15%] w-[90%] h-8 bg-black left-[5%]" />
            {/* Crossbeams */}
            <div className="absolute top-[40%] w-[100%] h-2 bg-black left-0 rotate-[35deg]" />
            <div className="absolute top-[40%] w-[100%] h-2 bg-black left-0 -rotate-[35deg]" />
            <div className="absolute top-[60%] w-[100%] h-2 bg-black left-0 rotate-[35deg]" />
            <div className="absolute top-[60%] w-[100%] h-2 bg-black left-0 -rotate-[35deg]" />
          </div>
        </motion.div>

        {/* Layered Foreground Hills/Terrain Background */}
        <motion.div
          className="absolute bottom-[-10%] left-[-10%] w-[150%] h-[60vh] opacity-80 pointer-events-none flex items-end z-0"
          style={{
            x: bgX8,
            y: bgY8,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1000 200' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,200 L0,180 Q10,140 20,190 T40,160 T60,200 T80,150 T100,190 T120,140 T140,180 T160,130 T180,170 T200,120 T220,180 T240,140 T260,190 T280,130 T300,180 T320,120 T340,170 T360,110 T380,160 T400,130 T420,180 T440,140 T460,190 T480,150 T500,180 T520,120 T540,170 T560,130 T580,180 T600,140 T620,190 T640,150 T660,200 T680,140 T700,190 T720,150 T740,200 T760,160 T780,190 L1000,190 L1000,200 Z' fill='%23050403'/%3E%3C/svg%3E\")",
            backgroundSize: "30% 100%",
            backgroundRepeat: "repeat-x",
            willChange: "transform",
          }}
        >
          <div className="w-full h-1/2 bg-[#050403]" />
        </motion.div>

        {/* Parallax Group for Depth */}
        <motion.div
          className="absolute inset-0 pointer-events-none transform-gpu flex items-center justify-center"
          style={{
            x: bgX5,
            y: bgY5,
            willChange: "transform",
          }}
        >
          {/* The Massive Fence Gate - Left Gate */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 w-1/2 flex flex-col justify-end overflow-hidden pb-[5%]"
            initial={{ x: "0%" }}
            animate={{ x: isGateOpen ? "-100%" : "0%" }}
            transition={{ type: "tween", ease: [0.5, 0.0, 0.1, 1], duration: 5, delay: 0.5 }}
          >
            {/* Chainlink mesh pattern */}
            <div
              className="absolute inset-x-0 bottom-0 top-[30%] opacity-80 z-0 bg-[#000]/20"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #050505 25%, transparent 25%, transparent 75%, #050505 75%, #050505), linear-gradient(45deg, #050505 25%, transparent 25%, transparent 75%, #050505 75%, #050505)",
                backgroundPosition: "0 0, 15px 15px",
                backgroundSize: "30px 30px",
                filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.8))",
                WebkitMaskImage:
                  "linear-gradient(to top, transparent 0%, black 20%, black 80%, transparent 100%)",
              }}
            />

            {/* Frame */}
            <div className="absolute top-[25%] bottom-0 right-0 w-[4vw] max-w-[30px] bg-gradient-to-r from-[#050505] via-[#2a2a2a] to-[#0a0a0a] z-10 block shadow-[-8px_0_20px_rgba(0,0,0,0.9)] border-l border-[#555]/30 flex flex-col justify-evenly items-center shadow-[inset_-2px_0_5px_rgba(0,0,0,0.8)]">
              <div className="w-full h-[3px] bg-[#000]/90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
              <div className="w-full h-[3px] bg-[#000]/90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
              <div className="w-full h-[3px] bg-[#000]/90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
            </div>

            <div className="absolute top-[25%] w-[100%] h-[30px] bg-gradient-to-b from-[#222] via-[#3a3a3a] to-[#111] shadow-[0_15px_30px_rgba(0,0,0,1)] border-y border-[#555]/30 z-10 flex items-center justify-center">
              <div className="w-[80%] flex justify-between absolute right-10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
              </div>
            </div>

            <div className="absolute top-[60%] w-[100%] h-[30px] bg-gradient-to-b from-[#222] via-[#3a3a3a] to-[#111] shadow-[0_15px_30px_rgba(0,0,0,1)] border-y border-[#555]/30 z-10 flex items-center justify-center">
              <div className="w-[80%] flex justify-between absolute right-10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
              </div>
            </div>

            {/* Crossbeam */}
            <div className="absolute top-[30%] bottom-[35%] right-[20%] w-[120%] h-[20px] bg-gradient-to-b from-[#151515] via-[#2a2a2a] to-[#0a0a0a] shadow-[0_5px_15px_rgba(0,0,0,0.8)] border-y border-[#555]/20 z-0 origin-top-right -rotate-[30deg]" />
            <div className="absolute top-[65%] bottom-[-5%] right-[20%] w-[120%] h-[20px] bg-gradient-to-b from-[#151515] via-[#2a2a2a] to-[#0a0a0a] shadow-[0_5px_15px_rgba(0,0,0,0.8)] border-y border-[#555]/20 z-0 origin-top-right rotate-[30deg]" />

            {/* Danger Stripes - filter removed for performance */}
            <div
              className="absolute bottom-[20%] w-[80%] h-[50px] opacity-70 mx-10 rotate-[-5deg] z-10"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #111, #111 20px, #b45309 20px, #b45309 40px)",
              }}
            />
          </motion.div>

          {/* The Massive Fence Gate - Right Gate */}
          <motion.div
            className="absolute top-0 bottom-0 right-0 w-1/2 flex flex-col justify-end overflow-hidden pb-[5%]"
            initial={{ x: "0%" }}
            animate={{ x: isGateOpen ? "100%" : "0%" }}
            transition={{ type: "tween", ease: [0.5, 0.0, 0.1, 1], duration: 5, delay: 0.5 }}
          >
            {/* Chainlink mesh pattern */}
            <div
              className="absolute inset-x-0 bottom-0 top-[30%] opacity-80 z-0 bg-[#000]/20"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #050505 25%, transparent 25%, transparent 75%, #050505 75%, #050505), linear-gradient(45deg, #050505 25%, transparent 25%, transparent 75%, #050505 75%, #050505)",
                backgroundPosition: "0 0, 15px 15px",
                backgroundSize: "30px 30px",
                filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.8))",
                WebkitMaskImage:
                  "linear-gradient(to top, transparent 0%, black 20%, black 80%, transparent 100%)",
              }}
            />

            {/* Frame */}
            <div className="absolute top-[25%] bottom-0 left-0 w-[4vw] max-w-[30px] bg-gradient-to-r from-[#0a0a0a] via-[#2a2a2a] to-[#050505] z-10 block shadow-[8px_0_20px_rgba(0,0,0,0.9)] border-r border-[#555]/30 flex flex-col justify-evenly items-center shadow-[inset_2px_0_5px_rgba(0,0,0,0.8)]">
              <div className="w-full h-[3px] bg-[#000]/90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
              <div className="w-full h-[3px] bg-[#000]/90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
              <div className="w-full h-[3px] bg-[#000]/90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
            </div>

            <div className="absolute top-[25%] w-[100%] h-[30px] bg-gradient-to-b from-[#222] via-[#3a3a3a] to-[#111] shadow-[0_15px_30px_rgba(0,0,0,1)] border-y border-[#555]/30 z-10 flex items-center justify-center">
              <div className="w-[80%] flex justify-between absolute left-10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
              </div>
            </div>

            <div className="absolute top-[60%] w-[100%] h-[30px] bg-gradient-to-b from-[#222] via-[#3a3a3a] to-[#111] shadow-[0_15px_30px_rgba(0,0,0,1)] border-y border-[#555]/30 z-10 flex items-center justify-center">
              <div className="w-[80%] flex justify-between absolute left-10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)]"></div>
              </div>
            </div>

            {/* Crossbeam */}
            <div className="absolute top-[30%] bottom-[35%] left-[20%] w-[120%] h-[20px] bg-gradient-to-b from-[#151515] via-[#2a2a2a] to-[#0a0a0a] shadow-[0_5px_15px_rgba(0,0,0,0.8)] border-y border-[#555]/20 z-0 origin-top-left rotate-[30deg]" />
            <div className="absolute top-[65%] bottom-[-5%] left-[20%] w-[120%] h-[20px] bg-gradient-to-b from-[#151515] via-[#2a2a2a] to-[#0a0a0a] shadow-[0_5px_15px_rgba(0,0,0,0.8)] border-y border-[#555]/20 z-0 origin-top-left -rotate-[30deg]" />

            {/* Danger Stripes - filter removed for performance */}
            <div
              className="absolute bottom-[10%] w-[80%] h-[50px] opacity-70 ml-10 rotate-[5deg] z-10"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #111, #111 20px, #b45309 20px, #b45309 40px)",
              }}
            />
          </motion.div>

          {/* Pillars - filter removed for performance */}
          <div className="absolute top-[10%] bottom-0 left-[-2%] w-[8vw] md:left-[-5%] md:w-[15%] bg-gradient-to-r from-[#050505] via-[#222] to-[#050505] shadow-[20px_0_50px_rgba(0,0,0,1)] border-r border-[#333] z-10" />
          <div className="absolute top-[10%] bottom-0 right-[-2%] w-[8vw] md:right-[-5%] md:w-[15%] bg-gradient-to-l from-[#050505] via-[#222] to-[#050505] shadow-[-20px_0_50px_rgba(0,0,0,1)] border-l border-[#333] z-10" />
        </motion.div>

        {/* FOREGROUND LAYER: Thick Fog/Atmosphere at the bottom of the gate */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_150%_40%_at_50%_110%,rgba(10,8,6,1)_0%,rgba(0,0,0,0)_80%)] z-20 pointer-events-none mix-blend-normal" />

        {/* Moving Fog/Mist Layer */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none mix-blend-screen opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(200, 210, 220, 0.08) 0%, rgba(0,0,0,0) 40%), radial-gradient(circle at 80% 60%, rgba(180, 200, 220, 0.05) 0%, rgba(0,0,0,0) 50%)",
            backgroundSize: "200% 200%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        />

        {/* Additional Dense Smoke Puffs in foreground (using soft radial instead of blur) */}
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_0%_100%,rgba(34,34,34,0.3)_0%,rgba(0,0,0,0)_60%)] z-20 mix-blend-screen pointer-events-none"
          animate={{
            backgroundPosition: ["0px 0px", "50px 0px", "0px 0px"],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_100%_100%,rgba(17,17,17,0.3)_0%,rgba(0,0,0,0)_60%)] z-20 mix-blend-screen pointer-events-none"
          animate={{
            backgroundPosition: ["0px 0px", "-40px 0px", "0px 0px"],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        />

        {/* Parallax particles (dust floating in the air / embers) */}
        <motion.div
          className="absolute inset-0 opacity-80 mix-blend-screen z-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(254,240,138,1) 1px, rgba(0,0,0,0) 2px), radial-gradient(circle at center, rgba(251,146,60,1) 1px, rgba(0,0,0,0) 1.5px)",
            backgroundSize: "120px 120px, 90px 90px",
            backgroundPosition: "0 0, 45px 45px",
            x: bgX20,
            y: bgY20,
            willChange: "transform",
          }}
          animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        />

        {/* Cinematic Spotlight — static center, no mouse tracking (perf) */}
        <div
          className="absolute inset-0 z-30 pointer-events-none mix-blend-screen opacity-50"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(220,240,255,0.12) 0%, rgba(200,220,255,0.04) 40%, rgba(0,0,0,0) 70%)" }}
        />
      </div>

      {/* Cinematic Vignette overlay for depth replacing boxy shadow */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_30%,rgba(2,2,2,0.9)_100%)] mix-blend-multiply" />

      {/* Fade to Black transition overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-[100] pointer-events-none flex items-center justify-center flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: isGateOpen ? 1 : 0 }}
        transition={{ duration: 3, delay: 1 }}
      ></motion.div>

      {/* Badge Login placed within the 3d environment */}
      <div className="relative z-50">
        <BadgeLogin
          onLogin={handleLogin}
          isProcessing={loginStatus === "processing"}
          loginStatus={loginStatus}
        />
      </div>
    </div>
  )
}
