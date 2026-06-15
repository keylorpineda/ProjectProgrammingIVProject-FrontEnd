import { motion } from "framer-motion"

interface AccessGrantedOverlayProps {
  username: string
  password: string
}

/** Aged wooden plank texture shared by both door leaves. */
const WOOD_STYLE: React.CSSProperties = {
  backgroundImage:
    // vertical planks
    "repeating-linear-gradient(90deg, #2f2012 0px, #4a3320 6px, #543a23 26px, #3a2917 46px, #25190d 52px, #4a3320 58px)," +
    // long grain streaks
    "repeating-linear-gradient(91deg, rgba(0,0,0,0.18) 0 2px, rgba(255,255,255,0.03) 2px 5px, transparent 5px 11px)," +
    // overall darkening + worn vignette
    "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(70,45,22,0.25) 0%, rgba(10,6,3,0.7) 100%)",
  backgroundBlendMode: "normal, overlay, multiply",
  boxShadow: "inset 0 0 80px rgba(0,0,0,0.85)",
}

/** A rusty iron reinforcement band with bolt heads. */
function IronBand({ top }: { top: string }) {
  return (
    <div
      className="absolute left-0 right-0 h-[26px] flex items-center justify-between px-3"
      style={{
        top,
        background: "linear-gradient(180deg, #3a342c 0%, #1c1812 45%, #2b251d 55%, #100c08 100%)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(120,110,90,0.3)",
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="w-[10px] h-[10px] rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 30%, #6b5f4a 0%, #2a231a 60%, #0a0805 100%)",
            boxShadow: "0 1px 1px rgba(0,0,0,0.8)",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Full-screen cinematic for a granted login. Self-contained so it does not
 * depend on the busy login scene behind it: it draws its own dark backdrop, a
 * clear ID/recognition card with the operator's entered credentials, an OLD
 * WOODEN DOOR that creaks open onto eerie green light, and a rotten zombie hand
 * that lunges out, snatches the card and drags it into the dark. Timed to finish
 * just before Login navigates (~5.6s).
 */
export function AccessGrantedOverlay({ username, password }: AccessGrantedOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[105] overflow-hidden flex items-center justify-center font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ perspective: "1500px" }}
    >
      {/* Solid dark backdrop hiding the login scene */}
      <div className="absolute inset-0 bg-[#05060400]" style={{ background: "#060604" }} />

      {/* Eerie green light from beyond the doorway (revealed as the door opens) */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.9, 1] }}
        transition={{ duration: 4.8, times: [0, 0.42, 0.7, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 50% 70% at 50% 52%, rgba(70,235,130,0.5) 0%, rgba(18,90,50,0.4) 38%, rgba(2,10,6,0) 72%)",
        }}
      />
      {/* Drifting motes in the green light */}
      <motion.div
        className="absolute left-0 right-0 -top-[30%] h-[160%] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(210,255,220,0.9) 1px, transparent 2px), radial-gradient(circle at center, rgba(170,255,195,0.6) 1px, transparent 1.6px)",
          backgroundSize: "60px 60px, 95px 95px",
          WebkitMaskImage: "linear-gradient(to right, transparent 32%, black 50%, transparent 68%)",
          maskImage: "linear-gradient(to right, transparent 32%, black 50%, transparent 68%)",
        }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: [0, 0, 0.7, 0.5], y: [60, 60, -120, -240] }}
        transition={{ duration: 4.8, times: [0, 0.42, 0.75, 1], ease: "linear" }}
      />

      {/* ===== OLD WOODEN DOUBLE DOOR ===== */}
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className="absolute inset-y-0 w-1/2 z-10 overflow-hidden"
          style={{
            ...WOOD_STYLE,
            [side]: 0,
            transformOrigin: side === "left" ? "left center" : "right center",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: side === "left" ? [0, 4, -118] : [0, -4, 118] }}
          transition={{ duration: 1.6, delay: 2.0, times: [0, 0.1, 1], ease: [0.5, 0, 0.2, 1] }}
        >
          {/* Iron reinforcement bands */}
          <IronBand top="14%" />
          <IronBand top="80%" />
          {/* Cross brace */}
          <div
            className="absolute left-[-10%] right-[-10%] h-[20px] top-1/2 -translate-y-1/2 opacity-80"
            style={{
              background: "linear-gradient(180deg,#2a2018 0%,#120c07 100%)",
              transform: side === "left" ? "rotate(-22deg)" : "rotate(22deg)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.7)",
            }}
          />
          {/* Iron ring handle near the seam */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full border-[6px] border-[#1a140d]"
            style={{
              [side === "left" ? "right" : "left"]: "14px",
              boxShadow: "inset 0 2px 3px rgba(120,100,70,0.4), 0 3px 5px rgba(0,0,0,0.8)",
              background: "radial-gradient(circle at 40% 30%, #4a4034 0%, #1c160e 70%)",
            }}
          />
          {/* Deep shadow at the closing seam */}
          <div
            className="absolute inset-y-0 w-[24px]"
            style={{
              [side === "left" ? "right" : "left"]: 0,
              background:
                side === "left"
                  ? "linear-gradient(90deg, transparent, rgba(0,0,0,0.75))"
                  : "linear-gradient(270deg, transparent, rgba(0,0,0,0.75))",
            }}
          />
        </motion.div>
      ))}

      {/* ===== ID / RECOGNITION CARD ===== */}
      <motion.div
        className="relative z-20 w-[90vw] max-w-[360px]"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, scale: 0.6, y: 70, rotateX: 18 }}
        animate={{
          opacity: [0, 1, 1, 1, 1, 0],
          scale: [0.6, 1.06, 1, 1, 1.05, 0.26],
          x: [0, 0, 0, 0, -8, -150],
          y: [70, -8, 0, 0, -4, 250],
          rotate: [0, 0, 0, 0, -3, 26],
          rotateX: [18, -3, 0, 0, 0, 10],
          filter: [
            "brightness(0.6) drop-shadow(0 20px 30px rgba(0,0,0,0.8))",
            "brightness(1.05) drop-shadow(0 25px 35px rgba(0,0,0,0.8))",
            "brightness(1.05) drop-shadow(0 25px 35px rgba(0,0,0,0.8))",
            "brightness(1.1) drop-shadow(0 0 35px rgba(60,230,120,0.5))",
            "brightness(1.15) drop-shadow(0 0 25px rgba(60,230,120,0.4))",
            "brightness(0.4) drop-shadow(0 0 0 rgba(0,0,0,0))",
          ],
        }}
        transition={{ duration: 4.8, times: [0, 0.12, 0.2, 0.58, 0.66, 1], ease: [0.4, 0, 0.3, 1] }}
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
            <div className="w-[100px] h-[128px] shrink-0 bg-[#8c8270] border-2 border-[#1a1712] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden relative sepia-[0.3]">
              <div className="w-[72px] h-[54px] bg-[#2a251a] rounded-t-[28px] absolute bottom-0" />
              <div className="w-[40px] h-[48px] bg-[#2a251a] rounded-[22px] absolute top-[20px]" />
              <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]" />
            </div>

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

      {/* ===== ROTTEN ZOMBIE HAND that snatches the card ===== */}
      <motion.div
        className="absolute left-1/2 bottom-0 z-[25] origin-bottom pointer-events-none"
        style={{ x: "-50%", filter: "drop-shadow(0 0 18px rgba(0,0,0,0.9))" }}
        initial={{ opacity: 0, y: 340, scale: 0.5, rotate: -6 }}
        animate={{
          opacity: [0, 0, 1, 1, 1, 0],
          y: [340, 340, 70, 10, 0, 300],
          x: ["-50%", "-50%", "-50%", "-50%", "-54%", "-66%"],
          scale: [0.5, 0.5, 1.05, 1.2, 1.12, 0.5],
          rotate: [-6, -6, -3, 0, 4, 24],
        }}
        transition={{ duration: 4.8, times: [0, 0.46, 0.6, 0.66, 0.72, 1], ease: [0.3, 0, 0.4, 1] }}
      >
        <svg viewBox="0 0 320 360" className="h-[62vh] w-auto" aria-hidden="true">
          <defs>
            <linearGradient id="zskin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#869572" />
              <stop offset="0.55" stopColor="#5d6b46" />
              <stop offset="1" stopColor="#3a4630" />
            </linearGradient>
          </defs>
          <g stroke="#1f2615" strokeWidth="3" strokeLinejoin="round" fill="url(#zskin)">
            {/* forearm */}
            <path d="M118 360 L108 244 Q160 222 212 244 L202 360 Z" />
            {/* back of hand */}
            <path d="M100 250 Q96 206 120 186 Q160 164 200 186 Q224 206 220 250 Q202 272 160 274 Q118 272 100 250 Z" />
            {/* index */}
            <path d="M116 196 Q108 126 118 92 L134 92 Q142 134 136 198 Z" />
            {/* middle */}
            <path d="M142 192 Q136 108 146 72 L162 72 Q170 112 164 194 Z" />
            {/* ring */}
            <path d="M170 194 Q166 118 178 86 L194 88 Q200 124 192 196 Z" />
            {/* pinky */}
            <path d="M196 200 Q198 138 210 112 L224 116 Q228 152 216 204 Z" />
            {/* thumb */}
            <path d="M100 236 Q66 214 52 184 L66 172 Q98 196 114 220 Z" />
          </g>
          {/* dark jagged claws */}
          <g fill="#15140d">
            <path d="M118 92 L125 70 L134 92 Z" />
            <path d="M146 72 L154 50 L162 72 Z" />
            <path d="M178 86 L186 64 L194 88 Z" />
            <path d="M210 112 L217 92 L224 116 Z" />
            <path d="M52 184 L40 168 L66 172 Z" />
          </g>
          {/* exposed wound + blood */}
          <g>
            <path d="M150 232 Q166 226 176 236 Q166 246 150 244 Z" fill="#5a1410" />
            <circle cx="150" cy="214" r="4" fill="#5a0f0f" opacity="0.75" />
            <circle cx="178" cy="228" r="3" fill="#5a0f0f" opacity="0.7" />
            <circle cx="128" cy="226" r="2.5" fill="#3a0a0a" opacity="0.7" />
            {/* veins */}
            <path
              d="M132 250 Q150 236 168 250"
              fill="none"
              stroke="#243018"
              strokeWidth="2.5"
              opacity="0.6"
            />
          </g>
        </svg>
      </motion.div>

      {/* Final fade to black for the route hand-off */}
      <motion.div
        className="absolute inset-0 bg-black z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 5.4, times: [0, 0.86, 1] }}
      />
    </motion.div>
  )
}
