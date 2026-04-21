import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)

interface BadgeLoginProps {
  onLogin: (u: string, p: string) => void
  isProcessing: boolean
}

export function BadgeLogin({ onLogin, isProcessing }: BadgeLoginProps) {
  const navigate = useNavigate()
  const [isHanging, setIsHanging] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Automatically hang after 10 seconds
    const timer = setTimeout(() => {
      if (!isHanging) {
        setIsHanging(true)
        playSounds()
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [isHanging])

  const handleClick = () => {
    if (!isHanging) {
      setIsHanging(true)
      playSounds()
    }
  }

  const handleSubmit = () => {
    if (isHanging && !isProcessing && username && password) {
      onLogin(username, password)
    }
  }

  const playSounds = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()

      // 1. Swoosh Sound (Air movement)
      const swooshOsc = ctx.createOscillator()
      const swooshGain = ctx.createGain()
      swooshOsc.type = "triangle"
      swooshOsc.frequency.setValueAtTime(120, ctx.currentTime)
      swooshOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4)
      swooshGain.gain.setValueAtTime(0, ctx.currentTime)
      swooshGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1)
      swooshGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      swooshOsc.connect(swooshGain)
      swooshGain.connect(ctx.destination)
      swooshOsc.start()
      swooshOsc.stop(ctx.currentTime + 0.4)

      // 2. Metallic Clack Sound (Hitting the lamp)
      setTimeout(() => {
        const clackOsc1 = ctx.createOscillator()
        const clackOsc2 = ctx.createOscillator()
        const clackGain = ctx.createGain()

        clackOsc1.type = "sine"
        clackOsc2.type = "square"
        clackOsc1.frequency.setValueAtTime(1500, ctx.currentTime)
        clackOsc2.frequency.setValueAtTime(3500, ctx.currentTime)

        clackOsc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
        clackOsc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)

        clackGain.gain.setValueAtTime(0, ctx.currentTime)
        clackGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.01)
        clackGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

        clackOsc1.connect(clackGain)
        clackOsc2.connect(clackGain)
        clackGain.connect(ctx.destination)

        clackOsc1.start()
        clackOsc2.start()
        clackOsc1.stop(ctx.currentTime + 0.15)
        clackOsc2.stop(ctx.currentTime + 0.15)
      }, 450)
    } catch (e) {
      console.error("Audio not supported", e)
    }
  }

  // Animation variants
  const badgeVariants: any = {
    onTable: {
      y: "45vh",
      x: "-45%",
      rotateX: 65,
      rotateZ: -22,
      rotateY: 0,
      scale: 0.72,
      z: 0,
      filter:
        "brightness(0.85) contrast(1.2) drop-shadow(-15px 20px 15px rgba(0,0,0,0.5)) drop-shadow(-4px 6px 4px rgba(0,0,0,0.8))",
      transition: { duration: 0 },
    },
    hanging: {
      y: "calc(5vh + 35px)",
      x: "-50%",
      rotateX: 0,
      rotateZ: [-1.5, 1.5],
      rotateY: 0,
      scale: 1,
      z: 50,
      filter: "brightness(1) contrast(1) drop-shadow(0px 30px 40px rgba(0,0,0,0.6))",
      transition: {
        y: { type: "spring", stiffness: 60, damping: 16 },
        x: { type: "spring", stiffness: 60, damping: 16 },
        rotateX: { type: "spring", stiffness: 60, damping: 16 },
        rotateZ: { repeat: Infinity, repeatType: "mirror", duration: 3, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 60, damping: 16 },
        filter: { duration: 0.5 },
      },
    },
  }

  const bracketVariants: any = {
    onTable: {
      boxShadow: "inset 0 3px 3px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.8)",
    },
    hanging: {
      boxShadow:
        "0px 5px 8px rgba(0,0,0,0.7), inset 0 3px 3px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.8)",
    },
  }

  const bodyVariants: any = {
    onTable: {
      boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
    },
    hanging: {
      boxShadow: "0px 0px 0px transparent, inset 0 0 10px rgba(0,0,0,0.5)",
    },
  }

  return (
    <motion.div
      className={`absolute top-0 z-30 origin-top flex flex-col items-center ${!isHanging ? "cursor-pointer" : ""}`}
      style={{
        width: "340px",
        left: "48%",
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
      variants={badgeVariants}
      initial="onTable"
      animate={isHanging ? "hanging" : "onTable"}
      onClick={handleClick}
    >
      {/* Wide Metal Bracket (Top Clip) */}
      <motion.div
        className="relative w-[120px] h-[25px] rounded-t-md flex justify-center items-start z-10"
        variants={bracketVariants}
        style={{
          background: "linear-gradient(90deg, #444 0%, #777 20%, #999 50%, #777 80%, #444 100%)",
          borderTop: "2px solid #aaa",
          borderLeft: "2px solid #888",
          borderRight: "2px solid #666",
          borderBottom: "none",
          transformStyle: "preserve-3d",
        }}
      >
        {/* 3D Extrusion Layers for Bracket */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`bracket-layer-${i}`}
            className="absolute inset-0 rounded-t-md pointer-events-none"
            style={{
              background: i === 3 ? "#000" : "#222",
              transform: `translateZ(-${i + 1}px)`,
            }}
          />
        ))}
        <div className="w-[30px] h-[8px] bg-[#0a0c0e] rounded-b-sm shadow-[inset_0_3px_5px_rgba(0,0,0,1)] relative z-10" />
      </motion.div>

      {/* Badge Body */}
      <motion.div
        className="relative w-full rounded-xl flex flex-col"
        variants={bodyVariants}
        style={{
          height: "460px",
          background: "linear-gradient(145deg, #5a5e65 0%, #2a2d32 100%)",
          padding: "8px",
          borderTop: "1px solid #8a9098",
          borderLeft: "1px solid #6a7078",
          borderBottom: "1px solid #111",
          borderRight: "1px solid #1a1c20",
          transformStyle: "preserve-3d",
        }}
      >
        {/* 3D Extrusion Layers for Badge Body (Physical thickness) */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`body-layer-${i}`}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: i === 7 ? "#050607" : "#1a1c20",
              transform: `translateZ(-${i + 1}px)`,
              boxShadow: i === 7 ? "0 0 15px rgba(0,0,0,0.9), 0 15px 30px rgba(0,0,0,0.7)" : "none",
            }}
          />
        ))}
        {/* Lanyard Hole */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[70px] h-[14px] bg-[#0a0c0e] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.2)] z-30 border border-[#222]" />

        {/* Inner Card Surface */}
        <div
          className="w-full h-full rounded-md flex flex-col relative"
          style={{
            background:
              "linear-gradient(105deg, #a0a6ad 0%, #c5cbd1 20%, #aab1b8 50%, #d4dadf 80%, #a0a6ad 100%)",
            boxShadow:
              "inset 0 4px 8px rgba(0,0,0,0.8), inset 0 1px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.3)",
            borderTop: "2px solid #111",
            borderLeft: "2px solid #222",
            borderBottom: "1px solid #fff",
            borderRight: "1px solid #eee",
            overflow: "hidden",
          }}
        >
          {/* Enhanced Matte Plastic Texture */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              filter: "contrast(1.5) brightness(0.8)",
            }}
          />

          {/* Active LED Indicator */}
          <div className="absolute top-[12px] right-[12px] w-[6px] h-[6px] rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse z-30" />

          {/* Dynamic Glare */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-20 mix-blend-screen"
            initial={{ backgroundPosition: "50% 200%", opacity: 0 }}
            animate={{
              backgroundPosition: isHanging ? "50% 200%" : "50% 10%",
              opacity: isHanging ? 0 : 0.8,
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(0deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.8) 48%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.8) 52%, rgba(255,255,255,0.1) 55%, transparent 60%)",
              backgroundSize: "100% 300%",
            }}
          />

          {/* Header */}
          <div
            className="h-[100px] w-full flex flex-col justify-center items-center px-4 text-center relative overflow-hidden mt-1 mx-1 rounded-t-sm"
            style={{
              width: "calc(100% - 8px)",
              background: "linear-gradient(180deg, #3a3f45 0%, #26292d 100%)",
              borderTop: "1px solid #555",
              borderBottom: "3px solid #0a0a0a",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.1), 0 6px 10px rgba(0,0,0,0.5)",
            }}
          >
            <h1
              className="text-[#f0f2f5] font-sans font-black text-[32px] leading-[1] tracking-tighter uppercase relative z-10"
              style={{ textShadow: "0 3px 6px rgba(0,0,0,0.9)" }}
            >
              Ingreso
              <br />
              Al Sistema
            </h1>
          </div>

          {/* Form Area */}
          <div className="flex-1 w-full p-5 flex flex-col gap-4 relative z-10">
            {/* Input Group: Usuario */}
            <div className="relative flex flex-col gap-1 group">
              <label
                className="text-[#1a1c1e] font-sans font-bold text-[14px] uppercase tracking-widest transition-colors group-focus-within:text-[#000]"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
              >
                Usuario:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-[38px] rounded-sm px-3 text-[#e0e5ec] font-mono text-lg outline-none transition-all duration-300 focus:bg-[#16181a] focus:-translate-y-[1px]"
                style={{
                  background: "linear-gradient(180deg, #111 0%, #222 100%)",
                  boxShadow:
                    "inset 0 5px 8px rgba(0,0,0,0.9), inset 0 2px 4px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.6)",
                  borderTop: "2px solid #000",
                  borderLeft: "1px solid #000",
                  borderBottom: "none",
                  borderRight: "none",
                }}
                disabled={!isHanging || isProcessing}
              />
              {/* Focus Glow Line */}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#4ade80] transition-all duration-300 group-focus-within:w-full shadow-[0_0_8px_#4ade80]" />
            </div>

            {/* Input Group: Contraseña */}
            <div className="relative flex flex-col gap-1 group">
              <label
                className="text-[#1a1c1e] font-sans font-bold text-[14px] uppercase tracking-widest transition-colors group-focus-within:text-[#000]"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
              >
                Contraseña:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[38px] rounded-sm pl-3 pr-10 text-[#e0e5ec] font-mono text-lg outline-none transition-all duration-300 focus:bg-[#16181a] focus:-translate-y-[1px]"
                  style={{
                    background: "linear-gradient(180deg, #111 0%, #222 100%)",
                    boxShadow:
                      "inset 0 5px 8px rgba(0,0,0,0.9), inset 0 2px 4px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.6)",
                    borderTop: "2px solid #000",
                    borderLeft: "1px solid #000",
                    borderBottom: "none",
                    borderRight: "none",
                  }}
                  disabled={!isHanging || isProcessing}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPassword(!showPassword)
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#4ade80] hover:bg-white/5 p-1.5 rounded-md active:scale-90 transition-all z-20"
                  disabled={!isHanging || isProcessing}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {/* Focus Glow Line */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#4ade80] transition-all duration-300 group-focus-within:w-full shadow-[0_0_8px_#4ade80]" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative mt-auto flex flex-col items-center gap-3 pb-4">
              <button
                onClick={handleSubmit}
                className={`w-[90%] py-2.5 rounded-xl text-white font-sans font-black text-[18px] uppercase tracking-widest transition-all duration-200 ${isHanging && !isProcessing ? "active:scale-95 active:brightness-90 hover:brightness-110" : "opacity-80 cursor-not-allowed"}`}
                style={{
                  background: "linear-gradient(180deg, #4ade80 0%, #16a34a 40%, #15803d 100%)",
                  boxShadow:
                    "inset 0 2px 1px rgba(255,255,255,0.6), inset 0 -4px 4px rgba(0,0,0,0.5), 0 6px 12px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.6)",
                  borderTop: "1px solid #86efac",
                  borderBottom: "2px solid #064e3b",
                  borderLeft: "1px solid #166b26",
                  borderRight: "1px solid #166b26",
                  textShadow: "0 -1px 1px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)",
                }}
                disabled={!isHanging || isProcessing}
              >
                {isProcessing ? "Procesando..." : "Ingresar"}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate("/register")
                }}
                className="text-[#222] hover:text-[#000] text-[13px] font-sans font-bold uppercase tracking-widest underline decoration-[#555] underline-offset-4 transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
                disabled={!isHanging || isProcessing}
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
