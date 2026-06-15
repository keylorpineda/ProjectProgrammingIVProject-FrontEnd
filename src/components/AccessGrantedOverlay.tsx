import { motion } from "framer-motion"

interface AccessGrantedOverlayProps {
  username: string
  password: string
}

/**
 * One leaf of the apocalyptic wooden door. The plank wood, rust and moss are
 * generated procedurally with SVG turbulence filters (real grain, knots,
 * corrosion) and overlaid with hand-drawn battle damage: a smashed plank that
 * leaks green light, cracks, claw gouges, blood and a nailed barricade board.
 */
function WoodenDoorLeaf({ side }: { side: "left" | "right" }) {
  const u = side
  const seed = side === "left" ? 7 : 23
  const plankSeams = [48, 96, 144, 192]
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 240 700"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Procedural wood: noise → grayscale → brown grain ramp */}
        <filter id={`wood-${u}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.2 0.017"
            numOctaves="5"
            seed={seed}
            result="n"
          />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g">
            <feFuncR type="table" tableValues="0.05 0.20 0.41 0.27 0.52 0.31 0.17 0.44" />
            <feFuncG type="table" tableValues="0.03 0.13 0.27 0.17 0.34 0.20 0.10 0.28" />
            <feFuncB type="table" tableValues="0.015 0.06 0.14 0.08 0.19 0.10 0.05 0.15" />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>
        </filter>

        {/* Rust for the iron bands */}
        <filter id={`rust-${u}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8 0.9"
            numOctaves="3"
            seed="5"
            result="n"
          />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g">
            <feFuncR type="table" tableValues="0.10 0.42 0.26 0.5" />
            <feFuncG type="table" tableValues="0.07 0.20 0.13 0.24" />
            <feFuncB type="table" tableValues="0.05 0.09 0.07 0.11" />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>
        </filter>

        {/* Mossy rot blotches */}
        <filter id={`moss-${u}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.06 0.09"
            numOctaves="4"
            seed="13"
            result="n"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.16  0 0 0 0 0.27  0 0 0 0 0.10  0 0 0 1.7 -0.7"
          />
        </filter>

        <radialGradient id={`hole-${u}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5dffab" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#107a44" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`edgeDark-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.85" />
          <stop offset="14%" stopColor="#000" stopOpacity="0" />
          <stop offset="86%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Base planks */}
      <rect x="0" y="0" width="240" height="700" fill="#3a2a18" filter={`url(#wood-${u})`} />

      {/* Per-plank weathering tints */}
      <rect x="0" y="0" width="48" height="700" fill="#120c06" opacity="0.28" />
      <rect x="96" y="0" width="48" height="700" fill="#243018" opacity="0.2" />
      <rect x="192" y="0" width="48" height="700" fill="#0f0a05" opacity="0.3" />

      {/* Knots */}
      {[
        [30, 150],
        [170, 470],
        [120, 300],
      ].map(([cx, cy], i) => (
        <g key={i} opacity="0.7">
          <ellipse cx={cx} cy={cy} rx="9" ry="14" fill="#1c1206" />
          <ellipse cx={cx} cy={cy} rx="5" ry="8" fill="none" stroke="#0d0803" strokeWidth="2" />
        </g>
      ))}

      {/* Plank seams with bevel highlight/shadow */}
      {plankSeams.map((x) => (
        <g key={x}>
          <rect x={x - 4} y="0" width="2.5" height="700" fill="#000" opacity="0.35" />
          <rect x={x - 1.5} y="0" width="3" height="700" fill="#070401" opacity="0.9" />
          <rect x={x + 1.6} y="0" width="2" height="700" fill="#7a5e36" opacity="0.3" />
        </g>
      ))}

      {/* Rusty iron reinforcement bands with bolts */}
      {[100, 560].map((by) => (
        <g key={by}>
          <rect x="-6" y={by} width="252" height="34" fill="#3a2a1e" filter={`url(#rust-${u})`} />
          <rect x="-6" y={by} width="252" height="3" fill="#fff" opacity="0.06" />
          <rect x="-6" y={by + 31} width="252" height="3" fill="#000" opacity="0.5" />
          {[20, 70, 120, 170, 220].map((bx) => (
            <circle key={bx} cx={bx} cy={by + 17} r="5.5" fill="#15100a" />
          ))}
          {[20, 70, 120, 170, 220].map((bx) => (
            <circle
              key={`h${bx}`}
              cx={bx - 1.5}
              cy={by + 15}
              r="1.6"
              fill="#7a6a4a"
              opacity="0.6"
            />
          ))}
        </g>
      ))}

      {/* Nailed barricade board (diagonal) */}
      <g transform={`rotate(${side === "left" ? -24 : 24} 120 350)`}>
        <rect x="-30" y="312" width="300" height="60" fill="#3a2a18" filter={`url(#wood-${u})`} />
        <rect x="-30" y="312" width="300" height="60" fill="#1a1208" opacity="0.25" />
        <rect x="-30" y="313" width="300" height="2" fill="#7a5e36" opacity="0.4" />
        <rect x="-30" y="369" width="300" height="2" fill="#000" opacity="0.5" />
        {[10, 110, 210].map((nx) => (
          <g key={nx}>
            <circle cx={nx} cy="342" r="6" fill="#0f0b07" />
            <circle cx={nx - 1.5} cy="340" r="1.8" fill="#8a795a" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* Smashed plank — hole leaking green light from beyond */}
      <g>
        <ellipse
          cx={side === "left" ? 170 : 70}
          cy="225"
          rx="58"
          ry="46"
          fill={`url(#hole-${u})`}
        />
        <path
          d={
            side === "left"
              ? "M132 210 L150 196 L160 214 L178 200 L196 220 L206 208 L210 232 L196 250 L206 262 L184 258 L172 272 L160 254 L142 262 L138 240 L124 232 Z"
              : "M44 210 L62 196 L72 214 L90 200 L108 220 L118 208 L122 232 L108 250 L118 262 L96 258 L84 272 L72 254 L54 262 L50 240 L36 232 Z"
          }
          fill="#050702"
          stroke="#1c1206"
          strokeWidth="2"
        />
        {/* splinters around the hole */}
        {(side === "left"
          ? [
              [128, 232, 116, 244],
              [210, 232, 224, 226],
              [172, 272, 176, 288],
            ]
          : [
              [36, 232, 24, 226],
              [122, 232, 134, 244],
              [84, 272, 80, 288],
            ]
        ).map(([x1, y1, x2, y2], i) => (
          <path
            key={i}
            d={`M${x1} ${y1} L${x2} ${y2} L${x2 + 5} ${y2 - 3} Z`}
            fill="#2a1c0d"
            stroke="#0d0803"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Cracks */}
      <path
        d={
          side === "left"
            ? "M60 0 L66 90 L58 180 L70 300 L60 430 L72 560 L64 700"
            : "M180 0 L172 100 L184 210 L174 330 L186 460 L176 590 L184 700"
        }
        fill="none"
        stroke="#0a0602"
        strokeWidth="2.5"
        opacity="0.7"
      />

      {/* Claw gouges (zombie scratches) — lighter raw wood */}
      <g
        stroke="#caa46a"
        strokeWidth="3"
        opacity="0.55"
        fill="none"
        transform={`translate(${side === "left" ? 30 : 110} 400) rotate(18)`}
      >
        <path d="M0 0 L70 28" />
        <path d="M-2 16 L68 44" />
        <path d="M-4 32 L66 60" />
        <path d="M-6 48 L64 76" />
      </g>
      <g
        stroke="#0d0803"
        strokeWidth="1.4"
        opacity="0.6"
        fill="none"
        transform={`translate(${side === "left" ? 30 : 110} 402) rotate(18)`}
      >
        <path d="M0 0 L70 28" />
        <path d="M-2 16 L68 44" />
        <path d="M-4 32 L66 60" />
        <path d="M-6 48 L64 76" />
      </g>

      {/* Bloodstain with drips */}
      <g fill="#4a0d0a" opacity="0.85">
        <path
          d={
            side === "left"
              ? "M96 470 q20 -14 40 -2 q14 10 4 26 q-16 18 -38 8 q-16 -10 -6 -32 Z"
              : "M104 470 q20 -14 40 -2 q14 10 4 26 q-16 18 -38 8 q-16 -10 -6 -32 Z"
          }
        />
        <rect x={side === "left" ? 118 : 126} y="496" width="5" height="40" rx="2" />
        <rect x={side === "left" ? 104 : 112} y="500" width="4" height="26" rx="2" />
        <circle cx={side === "left" ? 120 : 128} cy="540" r="3.5" />
      </g>

      {/* Moss / rot creeping up from the bottom */}
      <rect
        x="0"
        y="470"
        width="240"
        height="230"
        filter={`url(#moss-${u})`}
        opacity="0.5"
        style={{
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      {/* Top/bottom grime + edge darkening */}
      <rect x="0" y="0" width="240" height="700" fill={`url(#edgeDark-${u})`} />
      {/* Deep shadow at the closing seam */}
      <rect x={side === "left" ? 228 : 0} y="0" width="12" height="700" fill="#000" opacity="0.6" />
    </svg>
  )
}

/**
 * Full-screen cinematic for a granted login. Self-contained so it does not
 * depend on the busy login scene behind it: dark backdrop, an ID/recognition
 * card with the operator's entered credentials, an OLD, battered APOCALYPTIC
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
      <div className="absolute inset-0" style={{ background: "#060604" }} />

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

      {/* ===== APOCALYPTIC WOODEN DOUBLE DOOR ===== */}
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className="absolute inset-y-0 w-1/2 z-10 overflow-hidden"
          style={{
            [side]: 0,
            transformOrigin: side === "left" ? "left center" : "right center",
            transformStyle: "preserve-3d",
            willChange: "transform",
            filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.8))",
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: side === "left" ? [0, 4, -118] : [0, -4, 118] }}
          transition={{ duration: 1.6, delay: 2.0, times: [0, 0.1, 1], ease: [0.5, 0, 0.2, 1] }}
        >
          <WoodenDoorLeaf side={side} />
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
        <svg viewBox="0 0 340 390" className="h-[66vh] w-auto" aria-hidden="true">
          <defs>
            <radialGradient id="zflesh" cx="42%" cy="36%" r="78%">
              <stop offset="0%" stopColor="#9da978" />
              <stop offset="42%" stopColor="#717f52" />
              <stop offset="78%" stopColor="#49562f" />
              <stop offset="100%" stopColor="#28311a" />
            </radialGradient>
            <linearGradient id="zfinger" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#28311a" />
              <stop offset="38%" stopColor="#7c8a59" />
              <stop offset="58%" stopColor="#909c6c" />
              <stop offset="100%" stopColor="#2c3a1d" />
            </linearGradient>
            <linearGradient id="zbone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ece6c8" />
              <stop offset="100%" stopColor="#9c9068" />
            </linearGradient>
            <radialGradient id="zblood" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#7a1410" />
              <stop offset="100%" stopColor="#2c0707" />
            </radialGradient>
            <radialGradient id="zbruise" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34173a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#34173a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="znec" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10160a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10160a" stopOpacity="0" />
            </radialGradient>
            {/* organic edge roughening so it never looks like a clean cartoon */}
            <filter id="zrough" x="-25%" y="-25%" width="150%" height="150%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.013 0.022"
                numOctaves="3"
                seed="8"
                result="d"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="d"
                scale="10"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            {/* mottled skin pores */}
            <filter id="zpores">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8 0.85"
                numOctaves="3"
                seed="3"
                result="n"
              />
              <feColorMatrix
                in="n"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 -0.32"
              />
            </filter>
            <clipPath id="zclip">
              <path d="M122 390 L110 252 Q172 226 228 252 L216 390 Z" />
              <path d="M100 260 Q94 210 124 186 Q172 160 216 186 Q238 210 232 260 Q212 288 166 290 Q122 288 100 260 Z" />
              <path d="M122 198 Q112 122 124 88 L142 88 Q152 130 144 202 Z" />
              <path d="M150 194 Q144 102 156 64 L174 64 Q184 106 174 198 Z" />
              <path d="M180 198 Q176 112 190 78 L208 80 Q216 120 206 202 Z" />
              <path d="M210 206 Q212 142 226 112 L242 116 Q248 154 234 212 Z" />
              <path d="M100 246 Q62 222 46 188 L62 174 Q98 200 116 228 Z" />
            </clipPath>
          </defs>

          <g filter="url(#zrough)">
            {/* base volume */}
            <path d="M122 390 L110 252 Q172 226 228 252 L216 390 Z" fill="url(#zflesh)" />
            <path
              d="M100 260 Q94 210 124 186 Q172 160 216 186 Q238 210 232 260 Q212 288 166 290 Q122 288 100 260 Z"
              fill="url(#zflesh)"
            />
            <path d="M122 198 Q112 122 124 88 L142 88 Q152 130 144 202 Z" fill="url(#zfinger)" />
            <path d="M150 194 Q144 102 156 64 L174 64 Q184 106 174 198 Z" fill="url(#zfinger)" />
            <path d="M180 198 Q176 112 190 78 L208 80 Q216 120 206 202 Z" fill="url(#zfinger)" />
            <path d="M210 206 Q212 142 226 112 L242 116 Q248 154 234 212 Z" fill="url(#zfinger)" />
            <path d="M100 246 Q62 222 46 188 L62 174 Q98 200 116 228 Z" fill="url(#zfinger)" />

            {/* shading + rot, clipped to the hand silhouette */}
            <g clipPath="url(#zclip)">
              <rect x="40" y="58" width="224" height="340" filter="url(#zpores)" opacity="0.45" />
              {/* knuckle valleys */}
              <ellipse cx="133" cy="196" rx="14" ry="10" fill="#1c2410" opacity="0.5" />
              <ellipse cx="162" cy="192" rx="15" ry="10" fill="#1c2410" opacity="0.5" />
              <ellipse cx="192" cy="196" rx="14" ry="10" fill="#1c2410" opacity="0.5" />
              <ellipse cx="222" cy="204" rx="13" ry="9" fill="#1c2410" opacity="0.5" />
              {/* tendon highlights */}
              <path
                d="M132 250 L140 200"
                stroke="#aeb98a"
                strokeWidth="6"
                opacity="0.25"
                strokeLinecap="round"
              />
              <path
                d="M162 256 L168 196"
                stroke="#aeb98a"
                strokeWidth="6"
                opacity="0.25"
                strokeLinecap="round"
              />
              <path
                d="M192 252 L196 200"
                stroke="#aeb98a"
                strokeWidth="6"
                opacity="0.22"
                strokeLinecap="round"
              />
              {/* necrotic patches */}
              <ellipse cx="140" cy="270" rx="34" ry="24" fill="url(#znec)" />
              <ellipse cx="206" cy="244" rx="26" ry="20" fill="url(#znec)" />
              <ellipse cx="118" cy="322" rx="30" ry="42" fill="url(#znec)" />
              {/* bruises */}
              <ellipse cx="182" cy="280" rx="30" ry="22" fill="url(#zbruise)" />
              <ellipse cx="150" cy="150" rx="16" ry="26" fill="url(#zbruise)" />
              {/* veins */}
              <path
                d="M118 286 Q150 250 150 200"
                fill="none"
                stroke="#243a26"
                strokeWidth="3"
                opacity="0.55"
              />
              <path
                d="M210 286 Q196 250 196 206"
                fill="none"
                stroke="#2a2038"
                strokeWidth="2.6"
                opacity="0.5"
              />
              <path
                d="M150 290 Q170 256 196 250"
                fill="none"
                stroke="#243a26"
                strokeWidth="2.4"
                opacity="0.45"
              />
              {/* wrist grime crease */}
              <path
                d="M104 256 Q166 232 228 256"
                fill="none"
                stroke="#10160a"
                strokeWidth="8"
                opacity="0.4"
              />
              {/* blood smear */}
              <path
                d="M150 300 Q190 290 214 312 Q186 332 150 322 Q132 312 150 300 Z"
                fill="url(#zblood)"
                opacity="0.85"
              />
            </g>

            {/* exposed bone + torn flesh at two fingertips */}
            <path
              d="M180 78 L186 50 L198 56 L208 80 Z"
              fill="url(#zbone)"
              stroke="#6a5f3e"
              strokeWidth="1.5"
            />
            <path d="M180 78 Q194 70 208 80 Q196 88 180 84 Z" fill="#5a1410" />
            <path
              d="M210 112 L222 92 L234 100 L242 116 Z"
              fill="url(#zbone)"
              stroke="#6a5f3e"
              strokeWidth="1.5"
            />
            <path d="M210 112 Q226 104 242 116 Q228 122 210 118 Z" fill="#5a1410" />

            {/* long, cracked, dirty nails on the other fingers */}
            <g fill="#15140d">
              <path d="M124 88 L130 60 L142 62 L142 88 Z" />
              <path d="M156 64 L162 38 L174 40 L174 64 Z" />
              <path d="M46 188 L34 170 L52 168 L62 174 Z" />
            </g>
            <g fill="#6a6248" opacity="0.55">
              <path d="M127 70 L133 64 L135 72 Z" />
              <path d="M159 48 L165 42 L167 50 Z" />
            </g>

            {/* blood drips down the wrist */}
            <g fill="#4a0d0a">
              <rect x="150" y="330" width="6" height="46" rx="3" />
              <rect x="176" y="324" width="5" height="34" rx="2.5" />
              <circle cx="153" cy="380" r="4.5" />
              <circle cx="178" cy="362" r="3.5" />
            </g>
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
