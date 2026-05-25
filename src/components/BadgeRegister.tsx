import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface BadgeRegisterProps {
  onRegister: (u: string, p: string) => void
  isProcessing: boolean
  registerStatus: "waiting" | "processing" | "granted" | "denied"
}

export function BadgeRegister({ onRegister, isProcessing, registerStatus }: BadgeRegisterProps) {
  const [isHanging, setIsHanging] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHanging(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (registerStatus === "denied") {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [registerStatus])

  const handleClick = () => {
    if (!isHanging) setIsHanging(true)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isHanging && !isProcessing) {
      if (!username || !password) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      onRegister(username, password)
    }
  }

  // 3D positioning variants
  const badgeVariants = {
    initialDistortion: {
      y: "-120vh",
      x: "-50%",
      rotateX: -60,
      rotateZ: 30,
      rotateY: 45,
      scale: 0.8,
      z: -200,
      filter: "brightness(0.5) contrast(1) drop-shadow(0px 0px 0px rgba(0,0,0,0))",
      transition: { duration: 0 },
    },
    hanging: {
      y: "0vh",
      x: "-50%",
      rotateX: 0,
      rotateZ: [-2, 2],
      rotateY: 0,
      scale: 0.95,
      z: 50,
      filter: "brightness(1.15) contrast(1.1) drop-shadow(0px 30px 40px rgba(0,0,0,0.95))",
      transition: {
        y: { type: "spring", stiffness: 40, damping: 12, mass: 1.5 },
        x: { type: "spring", stiffness: 40, damping: 12, mass: 1.5 },
        rotateX: { type: "spring", stiffness: 40, damping: 12, mass: 1.5 },
        rotateZ: {
          repeat: Infinity,
          repeatType: "mirror",
          duration: 4,
          ease: "easeInOut",
        },
        rotateY: { type: "spring", stiffness: 40, damping: 12, mass: 1.5 },
        scale: { type: "spring", stiffness: 45, damping: 10 },
      },
    },
    processing: {
      y: "-25vh",
      x: "-50%",
      rotateX: -10,
      rotateZ: 0,
      rotateY: -5,
      scale: 1.2,
      z: 200,
      filter: "brightness(1.3) contrast(1.2) drop-shadow(0px 80px 60px rgba(0,0,0,0.8))",
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
      },
    },
    granted: {
      y: "-150vh",
      x: "-50%",
      rotateX: -40,
      rotateZ: 5,
      rotateY: 10,
      scale: 1.3,
      z: 300,
      filter: "brightness(1.5) contrast(1.3) drop-shadow(0px 100px 50px rgba(0,0,0,0.5))",
      transition: {
        duration: 1.2,
        ease: [0.6, 0.01, 0.05, 1.2],
      },
    },
  }

  const currentVariant =
    registerStatus === "granted"
      ? "granted"
      : registerStatus === "processing"
        ? "processing"
        : isHanging
          ? "hanging"
          : "initialDistortion"

  return (
    <motion.div
      className={`absolute top-0 z-30 origin-top flex flex-col items-center ${!isHanging ? "cursor-pointer" : ""} w-[90vw] sm:w-[420px] max-w-[420px]`}
      style={{ left: "50%", perspective: "1200px", transformStyle: "preserve-3d" }}
      variants={badgeVariants as any}
      initial="initialDistortion"
      animate={currentVariant}
      onClick={handleClick}
    >
      <AnimatePresence>
        {isHanging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-[100%] w-[8px] h-[50vh] bg-[#3a3528] z-0 shadow-[2px_0_5px_rgba(0,0,0,0.5)]"
            style={{
              backgroundImage: "linear-gradient(90deg, #2a251a 0%, #4a4538 50%, #2a251a 100%)",
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative w-[100px] h-[30px] rounded-t-md flex justify-center items-start z-10"
        style={{
          background: "linear-gradient(90deg, #444 0%, #888 20%, #bbb 50%, #888 80%, #444 100%)",
          borderTop: "2px solid #ccc",
          boxShadow:
            "inset 0 3px 3px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.8), 0 5px 10px rgba(0,0,0,0.6)",
          transform: "translateZ(1px)",
        }}
      >
        <div className="w-[30px] h-[8px] bg-[#0a0c0e] rounded-b-sm shadow-[inset_0_3px_5px_rgba(0,0,0,1)] relative z-10 block mt-[1px]" />
      </div>

      <div
        style={{
          filter:
            "drop-shadow(0 20px 25px rgba(0,0,0,0.8)) drop-shadow(0 5px 10px rgba(0,0,0,0.5))",
          width: "100%",
        }}
      >
        <div
          className="relative w-full flex flex-col overflow-hidden bg-[#d8d3c5]"
          style={{
            height: "580px",
            background: "radial-gradient(ellipse at center, #d8d3c5 0%, #b8b1a1 100%)",
            boxShadow:
              "inset 0 0 40px rgba(50,40,30,0.4), inset 2px 2px 10px rgba(255,255,255,0.6), 0 0 0 1px #222",
            clipPath:
              "polygon(0 8px, 4px 6px, 8px 0, 30% 0, 32% 4px, 35% 0, calc(100% - 8px) 0, 100% 8px, 100% 40%, 96% 42%, 100% 44%, 100% 80%, 97% 81%, 95% 83%, 98% 87%, 92% 89%, 95% 94%, 86% 96%, 82% 100%, 60% 100%, 58% 96%, 50% 100%, 8px 100%, 0 calc(100% - 8px), 0 60%, 4% 58%, 0 54%, 0 20%, 4% 16%, 1% 14%, 0 10%)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20 z-0 bg-gradient-to-b from-transparent to-[#4a3e35]/30" />
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-xl border border-white/40"
            style={{
              boxShadow: "inset 0 0 15px rgba(255,255,255,1), inset 0 0 30px rgba(255,255,255,0.5)",
            }}
          />

          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 rounded-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-[40px] h-[40px] bg-white opacity-40 blur-[4px]" />
            <div className="absolute top-0 left-0 w-[80px] h-[15px] bg-white opacity-50 blur-[2px] rounded-br-[40px]" />
            <div className="absolute bottom-[-10px] right-[-10px] w-[60px] h-[60px] bg-white opacity-60 blur-[3px]" />
            <div className="absolute top-[30%] right-[2px] w-[5px] h-[50px] bg-white opacity-70 blur-[1px]" />
            <div className="absolute top-[32%] right-[1px] w-[3px] h-[60px] bg-white opacity-90 blur-[0.5px]" />
            <div className="absolute bottom-[20%] left-[-2px] w-[8px] h-[40px] bg-white opacity-50 blur-[2px]" />
          </div>

          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 z-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[60px] h-[12px] bg-[#000] rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_2px_0_rgba(255,255,255,0.7)] z-30 opacity-90" />

          <div
            className="flex-1 w-full flex flex-col p-4 sm:p-6 relative z-20"
            style={{ marginTop: "3.5rem" }}
          >
            {/* Header */}
            <div
              className="border-b-[4px] border-[#3a3528] pb-3 mb-10 flex justify-between items-start gap-2"
              style={{ width: "80%", margin: "0 auto" }}
            >
              <div className="flex flex-col relative w-full pt-1">
                <h2
                  className="font-sans font-black text-[20px] sm:text-[22px] tracking-tighter leading-none uppercase"
                  style={{ color: "#3a3528" }}
                >
                  FORJAR IDENTIDAD
                </h2>
                <p
                  className="text-[10px] tracking-widest font-bold uppercase mt-1"
                  style={{ color: "#3a3528" }}
                >
                  Registro de Personal
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {registerStatus === "processing" && (
                <motion.div
                  key="laser"
                  initial={{ top: "-10%", opacity: 0 }}
                  animate={{ top: ["-10%", "110%"], opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 1.4,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                  className="absolute left-0 right-0 h-[6px] bg-blue-500 shadow-[0_0_20px_10px_rgba(59,130,246,0.4)] z-50 pointer-events-none"
                />
              )}
            </AnimatePresence>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col gap-6 w-full"
              style={{ marginTop: "30px" }}
            >
              <motion.div
                className="flex flex-row gap-4 w-[80%] items-center"
                style={{ margin: "0 auto" }}
                animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <div className="w-[110px] h-[140px] shrink-0 bg-[#8c8270] border-2 border-[#1a1712] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5),0_5px_8px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden relative sepia-[0.3]">
                  <div className="w-[80px] h-[60px] bg-[#2a251a] rounded-t-[30px] absolute bottom-0 opacity-50" />
                  <div className="w-[45px] h-[55px] bg-[#2a251a] rounded-[24px] absolute top-[25px] opacity-50" />

                  {/* Big question mark indicating unknown identity */}
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-black/40 mix-blend-overlay">
                    ?
                  </div>

                  <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] pointer-events-none" />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, transparent 100%)",
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <motion.div
                    className="flex flex-col gap-1.5 relative"
                    animate={
                      (shake && !username) || registerStatus === "denied"
                        ? { x: [-8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.4 } }
                        : {}
                    }
                  >
                    <label className="text-[12px] font-black font-sans text-[#1a1a1a] tracking-[0.2em] uppercase flex items-center gap-2">
                      NOMBRE EN CÓDIGO
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full ${(shake && !username) || registerStatus === "denied" ? "bg-red-900/10 border-red-900/50 text-red-900 placeholder:text-red-900/50" : "bg-[#000]/[0.05] border-[#000]/20 text-[#1a1814] placeholder:text-[#1a1814]/40 focus:border-[#000]/40"} rounded-[4px] px-6 py-8 border-2 outline-none font-mono text-[14px] sm:text-[16px] font-bold transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.4)]`}
                      style={{ height: "44px" }}
                      placeholder="Identificador"
                      disabled={!isHanging || isProcessing}
                    />
                  </motion.div>

                  <motion.div
                    className="flex flex-col gap-1.5 relative"
                    animate={
                      (shake && !password) || registerStatus === "denied"
                        ? { x: [-8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.4 } }
                        : {}
                    }
                  >
                    <label className="text-[12px] font-black font-sans text-[#1a1a1a] tracking-[0.2em] uppercase flex items-center gap-2">
                      NUEVA CLAVE
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full ${(shake && !password) || registerStatus === "denied" ? "bg-red-900/10 border-red-900/50 text-red-900 placeholder:text-red-900/50" : "bg-[#000]/[0.05] border-[#000]/20 text-[#1a1814] placeholder:text-[#1a1814]/40 focus:border-[#000]/40"} rounded-[4px] px-6 py-8 border-2 outline-none font-mono text-[14px] sm:text-[16px] tracking-[0.2em] font-bold placeholder:tracking-normal transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.4)] pr-12`}
                        style={{ height: "44px" }}
                        placeholder="***"
                        disabled={!isHanging || isProcessing}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowPassword(!showPassword)
                        }}
                        className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full border-[2px] border-[#2a2620] bg-[#111] shadow-[0_1px_1px_rgba(255,255,255,0.4),inset_0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden cursor-pointer group active:scale-95 transition-transform"
                        disabled={!isHanging || isProcessing}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 rounded-full z-20 pointer-events-none" />
                        <motion.div
                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-black/50 z-10"
                          animate={{ backgroundColor: showPassword ? "#1e3a8a" : "#1a1814" }}
                        >
                          <motion.div
                            className="bg-blue-500 rounded-full flex items-center justify-center overflow-hidden"
                            animate={{
                              height: showPassword ? 8 : 2,
                              width: showPassword ? 8 : 12,
                              opacity: showPassword ? 1 : 0.4,
                            }}
                          />
                        </motion.div>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <div
                className="w-[80%] flex justify-between mb-2 items-center gap-4"
                style={{ margin: "0 auto", marginTop: "3rem" }}
              >
                <div className="flex-1 h-[45px] border-y-2 border-black/80 flex flex-col justify-center gap-[2px] opacity-70">
                  <div className="h-full w-full bg-[linear-gradient(90deg,#000_10%,transparent_10%,transparent_15%,#000_15%,#000_20%,transparent_20%,transparent_25%,#000_25%,#000_35%,transparent_35%,transparent_40%,#000_40%,#000_45%,transparent_45%,transparent_50%,#000_50%,#000_65%,transparent_65%,transparent_80%,#000_80%,#000_90%,transparent_90%)]" />
                </div>

                <div className="w-12 h-12 rounded-full border border-blue-500/30 flex items-center justify-center bg-gradient-to-tr from-blue-100 via-blue-400 to-blue-600 opacity-80 mix-blend-multiply shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] relative overflow-hidden shrink-0">
                  <span className="text-[9px] font-black text-black/40 rotate-45 tracking-widest drop-shadow-md">
                    NEW ID
                  </span>
                  <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#555]/40"></div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4 mb-2 w-[80%]" style={{ margin: "0 auto" }}>
                <button
                  type="submit"
                  className="w-full h-[70px] font-sans font-black text-[18px] uppercase tracking-widest active:translate-y-[4px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden focus:outline-none flex items-center justify-center hover:scale-[1.02]"
                  style={{
                    backgroundColor: "#1a1a1a",
                    color: "#cccccc",
                    boxShadow: "inset 0 0 0 2px #333, 0 4px 0 #0a0a0a, 0 5px 5px rgba(0,0,0,0.5)",
                  }}
                  disabled={!isHanging || isProcessing}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001f3f"
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "inset 0 0 0 2px #3b82f6, 0 4px 0 #0a0a0a, 0 0 20px rgba(59,130,246,0.4), 0 5px 5px rgba(0,0,0,0.5)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#3b82f6"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a1a1a"
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "inset 0 0 0 2px #333, 0 4px 0 #0a0a0a, 0 5px 5px rgba(0,0,0,0.5)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#cccccc"
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(59,130,246,0.15)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <span className="relative z-10 group-active:text-blue-300 transition-colors">
                    {isProcessing ? "VERIFICANDO..." : "ESTABLECER IDENTIDAD"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <AnimatePresence>
            {registerStatus === "granted" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center bg-green-500/20 mix-blend-multiply"
              >
                <div className="border-[8px] border-[#0a4a0a] text-[#0a4a0a] px-6 py-4 font-black text-[32px] sm:text-[36px] tracking-widest rotate-[-15deg] mix-blend-multiply">
                  AUTORIZADO
                </div>
              </motion.div>
            )}

            {registerStatus === "denied" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center bg-red-600/20 mix-blend-multiply"
              >
                <div className="border-[8px] border-[#7a1010] text-[#7a1010] px-6 py-4 font-black text-[32px] sm:text-[36px] tracking-widest rotate-[-15deg] mix-blend-multiply">
                  DENEGADO
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute inset-0 pointer-events-none z-40 mix-blend-screen"
            initial={{ backgroundPosition: "50% 200%", opacity: 0 }}
            animate={{
              backgroundPosition: isHanging ? "50% 100%" : "50% 10%",
              opacity: isHanging ? 0 : 0.7,
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.6) 48%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 52%, rgba(255,255,255,0.05) 55%, transparent 70%)",
              backgroundSize: "100% 300%",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-40 border border-white/20"
            style={{ borderRadius: "16px" }}
          />
        </div>
      </div>
    </motion.div>
  )
}
