import { motion } from "framer-motion"

interface AccessGrantedOverlayProps {
  username: string
  password: string
}

/**
 * Full-screen cinematic shown on a granted login. Self-contained so it does not
 * depend on the busy login scene behind it: it draws its own dark backdrop, a
 * clear ID/recognition card with the operator's entered credentials, and a pair
 * of blast doors that swing open onto green "safe-zone" light, then sends the
 * card through and fades out. Timed to finish just before Login navigates (~5.3s).
 */
export function AccessGrantedOverlay({ username, password }: AccessGrantedOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[105] overflow-hidden flex items-center justify-center font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ perspective: "1400px" }}
    >
      {/* Solid dark backdrop hiding the login scene */}
      <div className="absolute inset-0 bg-[#020302]" />

      {/* Green safe-zone light revealed behind the doors */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.85, 1] }}
        transition={{ duration: 4.6, times: [0, 0.58, 0.85, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 55% 75% at 50% 50%, rgba(60,230,120,0.55) 0%, rgba(20,120,55,0.35) 35%, rgba(2,12,6,0) 72%)",
        }}
      />
      {/* Drifting motes in the green light */}
      <motion.div
        className="absolute left-0 right-0 -top-[30%] h-[160%] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(210,255,220,0.9) 1px, transparent 2px), radial-gradient(circle at center, rgba(170,255,195,0.6) 1px, transparent 1.6px)",
          backgroundSize: "60px 60px, 95px 95px",
          WebkitMaskImage: "linear-gradient(to right, transparent 30%, black 50%, transparent 70%)",
          maskImage: "linear-gradient(to right, transparent 30%, black 50%, transparent 70%)",
        }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: [0, 0, 0.7, 0.5], y: [60, 60, -120, -240] }}
        transition={{ duration: 4.6, times: [0, 0.58, 0.85, 1], ease: "linear" }}
      />

      {/* ===== BLAST DOORS ===== */}
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className="absolute inset-y-0 w-1/2 z-10"
          style={{
            [side]: 0,
            background:
              side === "left"
                ? "linear-gradient(90deg,#0a0a0a 0%,#222 70%,#2e2e2e 100%)"
                : "linear-gradient(270deg,#0a0a0a 0%,#222 70%,#2e2e2e 100%)",
            boxShadow:
              side === "left"
                ? "inset -6px 0 14px rgba(0,0,0,0.9)"
                : "inset 6px 0 14px rgba(0,0,0,0.9)",
          }}
          initial={{ x: 0 }}
          animate={{ x: side === "left" ? "-100%" : "100%" }}
          transition={{ duration: 1.7, delay: 2.75, ease: [0.6, 0, 0.15, 1] }}
        >
          {/* Riveted panels */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(0deg, transparent 48%, rgba(0,0,0,0.6) 50%, transparent 52%), linear-gradient(90deg, transparent 48%, rgba(0,0,0,0.5) 50%, transparent 52%)",
              backgroundSize: "100% 120px, 120px 100%",
            }}
          />
          {/* Hazard stripes along the closing edge */}
          <div
            className="absolute inset-y-0 w-[60px]"
            style={{
              [side === "left" ? "right" : "left"]: 0,
              backgroundImage:
                "repeating-linear-gradient(45deg,#0d0d0d,#0d0d0d 18px,#b8860b 18px,#b8860b 36px)",
              opacity: 0.85,
            }}
          />
          {/* Seam highlight */}
          <div
            className="absolute inset-y-0 w-[3px] bg-[#3a3a3a]"
            style={{ [side === "left" ? "right" : "left"]: 0 }}
          />
        </motion.div>
      ))}

      {/* ===== ID / RECOGNITION CARD ===== */}
      <motion.div
        className="relative z-20 w-[90vw] max-w-[360px]"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, scale: 0.6, y: 70, rotateX: 18 }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          scale: [0.6, 1.06, 1, 1, 0.16],
          y: [70, -8, 0, 0, -36],
          rotateX: [18, -3, 0, 0, 22],
          filter: [
            "brightness(0.6) drop-shadow(0 20px 30px rgba(0,0,0,0.8))",
            "brightness(1.05) drop-shadow(0 25px 35px rgba(0,0,0,0.8))",
            "brightness(1.05) drop-shadow(0 25px 35px rgba(0,0,0,0.8))",
            "brightness(1.2) drop-shadow(0 0 40px rgba(60,230,120,0.6))",
            "brightness(2.4) drop-shadow(0 0 0 rgba(0,0,0,0))",
          ],
        }}
        transition={{ duration: 4.6, times: [0, 0.13, 0.22, 0.64, 1], ease: [0.4, 0, 0.2, 1] }}
      >
        <div
          className="relative w-full overflow-hidden rounded-[6px]"
          style={{
            height: "460px",
            background: "radial-gradient(ellipse at center, #dcd7c9 0%, #b8b1a1 100%)",
            boxShadow:
              "inset 0 0 40px rgba(50,40,30,0.4), inset 2px 2px 10px rgba(255,255,255,0.6), 0 0 0 1px #222",
          }}
        >
          {/* Lanyard hole */}
          <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[60px] h-[10px] bg-black rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)] opacity-90" />

          {/* Header */}
          <div className="px-6 pt-8 pb-3 mx-6 border-b-[4px] border-[#3a3528]">
            <h2
              className="font-black text-[18px] tracking-tight leading-none uppercase"
              style={{ color: "#3a3528" }}
            >
              Credencial de Acceso
            </h2>
            <p
              className="text-[10px] tracking-[0.25em] font-bold uppercase mt-1"
              style={{ color: "#6b6354" }}
            >
              Sistema Doomsday · Zona Segura
            </p>
          </div>

          {/* Body: photo + credentials */}
          <div className="flex gap-4 px-6 pt-5">
            {/* Photo */}
            <div className="w-[100px] h-[128px] shrink-0 bg-[#8c8270] border-2 border-[#1a1712] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden relative sepia-[0.3]">
              <div className="w-[72px] h-[54px] bg-[#2a251a] rounded-t-[28px] absolute bottom-0" />
              <div className="w-[40px] h-[48px] bg-[#2a251a] rounded-[22px] absolute top-[20px]" />
              <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]" />
            </div>

            {/* Credentials */}
            <div className="flex-1 flex flex-col justify-center gap-3 min-w-0">
              <div>
                <div
                  className="text-[10px] font-black tracking-[0.2em] uppercase"
                  style={{ color: "#6b6354" }}
                >
                  Usuario
                </div>
                <div
                  className="font-mono font-bold text-[16px] truncate border-b-2 border-[#3a3528]/40 pb-0.5"
                  style={{ color: "#1a1814" }}
                  title={username}
                >
                  {username || "—"}
                </div>
              </div>
              <div>
                <div
                  className="text-[10px] font-black tracking-[0.2em] uppercase"
                  style={{ color: "#6b6354" }}
                >
                  Contraseña
                </div>
                <div
                  className="font-mono font-bold text-[16px] truncate border-b-2 border-[#3a3528]/40 pb-0.5"
                  style={{ color: "#1a1814" }}
                  title={password}
                >
                  {password || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Barcode */}
          <div className="px-6 mt-6">
            <div className="h-[40px] border-y-2 border-black/80 opacity-70 bg-[linear-gradient(90deg,#000_10%,transparent_10%,transparent_15%,#000_15%,#000_20%,transparent_20%,transparent_25%,#000_25%,#000_35%,transparent_35%,transparent_40%,#000_40%,#000_45%,transparent_45%,transparent_50%,#000_50%,#000_65%,transparent_65%,transparent_80%,#000_80%,#000_90%,transparent_90%)]" />
            <div
              className="mt-1 text-[10px] font-mono tracking-[0.3em] text-center"
              style={{ color: "#3a3528" }}
            >
              ID-{(username || "GUEST").toUpperCase().slice(0, 8)}-0007
            </div>
          </div>

          {/* Green confirmation scan sweeping down */}
          <motion.div
            className="absolute left-0 right-0 h-[5px] bg-[#4ade80] shadow-[0_0_22px_10px_rgba(74,222,128,0.6)] pointer-events-none"
            initial={{ top: "-8%", opacity: 0 }}
            animate={{ top: ["-8%", "108%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.0, delay: 0.55, ease: "easeInOut" }}
          />

          {/* GREEN "ACCESO PERMITIDO" stamp */}
          <motion.div
            className="absolute left-1/2 bottom-[6%] -translate-x-1/2 flex flex-col items-center gap-1"
            style={{ mixBlendMode: "multiply" }}
            initial={{ scale: 2.4, opacity: 0, rotate: -15 }}
            animate={{ scale: [2.4, 0.92, 1], opacity: [0, 0.95, 0.9], rotate: [-15, -12, -13] }}
            transition={{ duration: 0.5, delay: 0.7, times: [0, 0.7, 1], ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="border-[5px] border-[#15803d] text-[#15803d] px-4 py-1.5 font-black text-[22px] tracking-[0.12em] uppercase whitespace-nowrap flex items-center gap-2">
              <span className="text-[24px] leading-none">✓</span> Acceso Permitido
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Final fade to black for the route hand-off */}
      <motion.div
        className="absolute inset-0 bg-black z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 5.1, times: [0, 0.86, 1] }}
      />
    </motion.div>
  )
}
