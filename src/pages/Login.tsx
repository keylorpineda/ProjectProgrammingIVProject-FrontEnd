/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate } from "framer-motion"
import { BadgeLogin } from "../components/BadgeLogin"
import { useNavigate } from "react-router-dom"
type LoginStatus = "waiting" | "processing" | "granted" | "denied"

export default function Login() {
  const navigate = useNavigate()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("waiting")
  const [isDoorOpen, setIsDoorOpen] = useState(false)

  // Sound functions
  const playTerminalSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch (e) {
      console.warn("Audio not supported", e)
    }
  }

  const playGrantedSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch (e) {
      console.warn("Audio not supported", e)
    }
  }

  const playDeniedSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch (e) {
      console.warn("Audio not supported", e)
    }
  }

  const handleLogin = (u: string, p: string) => {
    setLoginStatus("processing")

    let beeps = 0
    const beepInterval = setInterval(() => {
      playTerminalSound()
      beeps++
      if (beeps > 5) clearInterval(beepInterval)
    }, 200)

    setTimeout(() => {
      if (u.toLowerCase() === "admin" && p === "1234") {
        setLoginStatus("granted")
        playGrantedSound()
        setTimeout(() => {
          setIsDoorOpen(true)
          setTimeout(() => {
            navigate("/dashboard")
          }, 3500)
        }, 1500)
      } else {
        setLoginStatus("denied")
        playDeniedSound()
        setTimeout(() => {
          setLoginStatus("waiting")
        }, 3000)
      }
    }, 1500)
  }

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      animationFrameId = requestAnimationFrame(() => {
        mouseX.set(e.clientX / window.innerWidth - 0.5)
        mouseY.set(e.clientY / window.innerHeight - 0.5)
      })
    }
    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [mouseX, mouseY])

  const xLeft = useTransform(mouseX, x => x * -8)
  const yLeft = useTransform(mouseY, y => y * -4)
  const xRight = useTransform(mouseX, x => x * 6)
  const yRight = useTransform(mouseY, y => y * -3)

  const transformLeft = useMotionTemplate`translate(${xLeft}px, ${yLeft}px) scale(1.025)`
  const transformRight = useMotionTemplate`translate(${xRight}px, ${yRight}px) scale(1.025)`

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="industrial-root relative flex w-screen h-screen">
        {/* SVG Filters */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            {/* Basic Noise */}
            <filter id="brushed">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0 0.8"
                numOctaves="2"
                seed="5"
                result="noise"
              />
              <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
              <feBlend in="SourceGraphic" in2="grey" mode="overlay" />
            </filter>

            {/* High-Fidelity Brushed Metal (Complex multi-frequency noise) */}
            <filter id="realistic-brushed-metal" x="0" y="0" width="100%" height="100%">
              {/* Base horizontal brush strokes */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.001 0.8"
                numOctaves="2"
                seed="12"
                result="brush"
              />
              {/* Fine micro-grain for realism */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8 0.8"
                numOctaves="2"
                seed="42"
                result="grain"
              />
              {/* Combine brush and grain */}
              <feBlend in="brush" in2="grain" mode="multiply" result="combinedNoise" />
              {/* Colorize to subtle dark greys */}
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.25 0"
                in="combinedNoise"
                result="coloredNoise"
              />
              <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
            </filter>

            {/* Micro-texture / Anodized finish */}
            <filter id="micro-texture">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1.5"
                numOctaves="2"
                seed="1"
                result="noise"
              />
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0"
                in="noise"
                result="coloredNoise"
              />
              <feBlend in="SourceGraphic" in2="coloredNoise" mode="overlay" />
            </filter>

            {/* Organic Grime/Dirt (Softer, broader) */}
            <filter id="organic-grime">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.008"
                numOctaves="2"
                seed="8"
                result="noise"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.4 0"
                in="noise"
                result="coloredNoise"
              />
              <feBlend in="SourceGraphic" in2="coloredNoise" mode="darken" />
            </filter>

            {/* Concrete Texture (Hyper-realistic, rough, deep pores) */}
            <filter id="concrete-noise">
              {/* Base rough noise */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.08"
                numOctaves="3"
                seed="5"
                result="baseNoise"
              />
              {/* High-frequency grit */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="1"
                seed="15"
                result="grit"
              />
              {/* Combine for complex texture */}
              <feBlend in="baseNoise" in2="grit" mode="multiply" result="combinedNoise" />

              {/* Create a bump map effect (lighting) */}
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
                in="combinedNoise"
                result="bumpMap"
              />

              {/* Apply directional lighting to the bump map to create depth */}
              <feDiffuseLighting
                in="bumpMap"
                surfaceScale="5"
                diffuseConstant="1.2"
                lightingColor="#ffffff"
                result="litConcrete"
              >
                <feDistantLight azimuth="45" elevation="30" />
              </feDiffuseLighting>

              {/* Colorize the lit texture to dark concrete greys */}
              <feColorMatrix
                type="matrix"
                values="
                0.1 0   0   0 0.05
                0   0.1 0   0 0.06
                0   0   0.1 0 0.07
                0   0   0   1 0
              "
                in="litConcrete"
                result="coloredConcrete"
              />

              <feBlend in="SourceGraphic" in2="coloredConcrete" mode="multiply" />
            </filter>

            {/* Oxidized / Mottled Metal (For right wall panels) */}
            <filter id="oxidized-metal">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.01 0.05"
                numOctaves="4"
                seed="77"
                result="noise"
              />
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0"
                in="noise"
                result="coloredNoise"
              />
              <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
            </filter>

            {/* Diamond Plate Pattern */}
            <pattern id="diamond-plate" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#0a0c0e" />
              <g filter="drop-shadow(2px 3px 2px rgba(0,0,0,0.9))">
                <rect
                  x="8"
                  y="2"
                  width="6"
                  height="16"
                  rx="2"
                  fill="#2a3138"
                  transform="rotate(45 11 10)"
                />
                <rect
                  x="28"
                  y="22"
                  width="6"
                  height="16"
                  rx="2"
                  fill="#2a3138"
                  transform="rotate(45 31 30)"
                />
                <rect
                  x="28"
                  y="2"
                  width="6"
                  height="16"
                  rx="2"
                  fill="#2a3138"
                  transform="rotate(-45 31 10)"
                />
                <rect
                  x="8"
                  y="22"
                  width="6"
                  height="16"
                  rx="2"
                  fill="#2a3138"
                  transform="rotate(-45 11 30)"
                />
              </g>
              {/* Highlights */}
              <rect
                x="9"
                y="2"
                width="2"
                height="14"
                rx="1"
                fill="#4a5560"
                transform="rotate(45 11 10)"
              />
              <rect
                x="29"
                y="22"
                width="2"
                height="14"
                rx="1"
                fill="#4a5560"
                transform="rotate(45 31 30)"
              />
              <rect
                x="29"
                y="2"
                width="2"
                height="14"
                rx="1"
                fill="#4a5560"
                transform="rotate(-45 31 10)"
              />
              <rect
                x="9"
                y="22"
                width="2"
                height="14"
                rx="1"
                fill="#4a5560"
                transform="rotate(-45 11 30)"
              />
            </pattern>
          </defs>
        </svg>

        {/* LEFT PANEL (55%) */}
        <motion.div
          className="left-panel relative h-full overflow-hidden"
          style={{
            width: "55%",
            transform: transformLeft,
            transition: "transform 0.1s ease-out",
            willChange: "transform",
          }}
        >
          {/* Concrete Wall (Top 30%) */}
          <div className="absolute top-0 left-0 w-full h-[30%] bg-[#15181a] overflow-hidden">
            {/* Base Wall Color with slight gradient */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, #1a1d21 0%, #0f1114 100%)" }}
            />

            {/* Concrete Texture (Now with bump mapping and lighting) */}
            <div
              className="absolute inset-0 opacity-90 mix-blend-overlay"
              style={{ filter: "url(#concrete-noise)" }}
            />

            {/* Large Concrete Panel Seams (Deep debossed lines with highlights) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                linear-gradient(to right, transparent 25%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.95) 25.5%, rgba(255,255,255,0.15) 25.5%, transparent 26%, transparent 75%, rgba(0,0,0,0.95) 75%, rgba(0,0,0,0.95) 75.5%, rgba(255,255,255,0.15) 75.5%, transparent 76%),
                linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0.95) 46%, rgba(255,255,255,0.15) 46%, transparent 47%)
              `,
              }}
            />

            {/* Wall Grunge/Vignette (Deepens the corners and bottom) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 120%, transparent 0%, rgba(0,0,0,0.85) 100%)",
              }}
            />

            {/* Ambient Occlusion at the bottom seam where it meets the table */}
            <div
              className="absolute bottom-0 left-0 w-full h-[20px]"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
              }}
            />
          </div>

          {/* ================= TABLE SECTION (Viewed from Left Perspective) ================= */}
          <div
            className="absolute bottom-0 left-0 w-[105%] h-[70%] origin-bottom-left"
            style={{
              transform: "skewY(-1.5deg)", // Angles the whole table up towards the right
              zIndex: 5,
            }}
          >
            {/* Back Edge / Ledge (Matches the skew) */}
            <div
              className="absolute top-0 left-0 w-full h-[8px] z-30"
              style={{
                background: "linear-gradient(to bottom, #4a4e52 0%, #1a1e20 100%)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
            </div>

            {/* Table Surface (Top 85%) */}
            <div className="absolute top-[8px] left-0 w-full h-[calc(85%-8px)] overflow-hidden">
              {/* Layer 1 — Base metal (Cooler blue-grey, slightly darker) */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, #151d24 0%, #222d38 30%, #2d3b4a 60%, #18222b 100%)",
                }}
              />

              {/* Layer 1.5 — Micro-texture (Anodized feel) */}
              <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{ filter: "url(#micro-texture)" }}
              />

              {/* Layer 2 — High-Fidelity Brushed Steel (Perspective from Left) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ perspective: "1200px", perspectiveOrigin: "0% 50%" }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    filter: "url(#realistic-brushed-metal)",
                    transform: "rotateX(65deg) scale(2.5)",
                    transformOrigin: "top center",
                    opacity: 0.85,
                  }}
                />
              </div>

              {/* Layer 3 — Organic Grime (Smudges and unevenness) */}
              <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{ filter: "url(#organic-grime)" }}
              />

              {/* Layer 4 — Cinematic Desk Lamp Spill (Soft, directional light) */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 40% 30%, rgba(255, 255, 255, 0.8) 0%, rgba(180, 210, 255, 0.3) 40%, transparent 80%)",
                }}
              />

              {/* Layer 5 — Sharp Specular Highlight (LED bar reflection on brushed metal) */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen opacity-90"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0.4) 38%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.4) 42%, rgba(255,255,255,0.05) 45%, transparent 50%)",
                }}
              />

              {/* Layer 5.5 — Secondary ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{
                  background:
                    "radial-gradient(circle at 45% 45%, rgba(150,200,255,0.15) 0%, transparent 60%)",
                }}
              />

              {/* Layer 6 — Edge Vignette & Ambient Occlusion */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 15%, transparent 80%, rgba(0,0,0,0.75) 100%)",
                }}
              />

              {/* Layer 7 — Top edge shadow (Deep shadow where table meets wall) */}
              <div
                className="absolute top-0 left-0 w-full h-[80px]"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.1) 60%, transparent 100%)",
                }}
              />

              {/* TABLE FRONT EDGE */}
              <div
                className="absolute bottom-0 left-0 w-full h-[40px] z-20"
                style={{
                  background: "linear-gradient(to bottom, #3a4552 0%, #1a2228 20%, #0a0d10 100%)",
                  boxShadow: "inset 0 2px 1px rgba(255,255,255,0.15), 0 -8px 20px rgba(0,0,0,0.8)",
                }}
              >
                <div className="absolute inset-0 opacity-40" style={{ filter: "url(#brushed)" }} />
              </div>
            </div>

            {/* UNDER-TABLE AREA (Bottom 15%) */}
            <div className="absolute bottom-0 left-0 w-full h-[15%] bg-[#050607] overflow-hidden">
              {/* Table Legs / Supports (Left is huge, Right is small) */}
              <div className="absolute left-[-2%] bottom-0 w-[80px] h-full bg-[#0a0d10] border-r border-white/10 shadow-[30px_0_40px_rgba(0,0,0,0.95)]">
                <div className="absolute top-0 right-0 w-[3px] h-full bg-white/20" />
                <div
                  className="absolute inset-0 opacity-50"
                  style={{ filter: "url(#concrete-noise)" }}
                />
              </div>
              <div className="absolute right-[20%] bottom-0 w-[20px] h-full bg-[#050708] shadow-[-5px_0_10px_rgba(0,0,0,0.9)]">
                <div className="absolute top-0 left-0 w-[1px] h-full bg-white/5" />
              </div>

              {/* Heavy Cast Shadow from Table Lip */}
              <div
                className="absolute top-0 left-0 w-full h-[60%]"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, transparent 100%)",
                }}
              />
            </div>
          </div>

          {/* Fluorescent Lamp Fixture (Photorealistic, Industrial, Perspective Matched) */}
          <div
            className="absolute top-[2%] left-[48%] -translate-x-1/2 z-20 w-[75%] flex flex-col items-center"
            style={{ transform: "skewY(-1deg)" }} // Slight perspective match to the room
          >
            {/* Soft Volumetric Light Cone (Replaces the sharp polygon) */}
            <div
              className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[250%] h-[500px] pointer-events-none mix-blend-screen"
              style={{
                background:
                  "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(200,230,255,0.2) 0%, rgba(180,215,255,0.05) 40%, transparent 80%)",
              }}
            />
            {/* Secondary intense atmospheric glow near the fixture */}
            <div
              className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[150%] h-[300px] pointer-events-none mix-blend-screen"
              style={{
                background:
                  "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(220,240,255,0.3) 0%, rgba(190,220,255,0.08) 50%, transparent 100%)",
              }}
            />

            {/* Hanging Cables (Industrial) */}
            <div className="flex justify-between w-[80%] h-[40px] relative z-10">
              <div className="w-[3px] h-full bg-gradient-to-r from-[#222] via-[#666] to-[#111] shadow-[2px_0_5px_rgba(0,0,0,0.9)]" />
              <div className="w-[3px] h-full bg-gradient-to-r from-[#222] via-[#666] to-[#111] shadow-[2px_0_5px_rgba(0,0,0,0.9)]" />
            </div>

            {/* Housing Body (Sleek LED Strip Fixture) */}
            <div
              className="relative w-full h-[20px] rounded-sm flex items-center justify-center px-[2px]"
              style={{
                background: "linear-gradient(to bottom, #1a1c1e 0%, #0a0c0e 100%)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)",
                borderTop: "1px solid #333",
                borderBottom: "1px solid #000",
              }}
            >
              {/* LED Panel (Bright white strip) */}
              <div
                className="w-full h-[12px] rounded-[1px] animate-tube-flicker relative z-10"
                style={{
                  background: "#ffffff",
                  boxShadow:
                    "0 0 15px 5px rgba(220,240,255,0.8), 0 0 30px 10px rgba(200,225,255,0.4), inset 0 0 4px rgba(0,0,0,0.2)",
                }}
              />

              {/* Wide Metal Bracket (Hanging mechanism) */}
              <div
                className="absolute -bottom-[15px] left-1/2 -translate-x-1/2 w-[80px] h-[15px] z-0"
                style={{
                  background:
                    "linear-gradient(90deg, #555 0%, #888 20%, #aaa 50%, #888 80%, #555 100%)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.5)",
                  borderLeft: "1px solid #333",
                  borderRight: "1px solid #333",
                  borderBottom: "1px solid #222",
                }}
              >
                {/* Small cutout in the bracket */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20px] h-[6px] bg-[#0a0c0e] rounded-b-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />
              </div>
            </div>
          </div>

          {/* Badge Login Component */}
          <BadgeLogin onLogin={handleLogin} isProcessing={loginStatus === "processing"} />
        </motion.div>

        {/* VERTICAL DIVIDER */}
        <div
          className="relative z-30 h-full"
          style={{
            width: "12px",
            background: "linear-gradient(to right, #0a0c0e 0%, #141618 40%, #0a0c0e 100%)",
            boxShadow: "-3px 0 12px rgba(0,0,0,0.6), 3px 0 12px rgba(0,0,0,0.6)",
          }}
        />

        {/* RIGHT PANEL (45%) */}
        <motion.div
          className="right-panel relative h-full overflow-hidden bg-[#1a1d20]"
          style={{
            width: "45%",
            transform: transformRight,
            transition: "transform 0.1s ease-out",
            willChange: "transform",
          }}
        >
          {/* Base Metal Texture for Right Panel */}
          <div
            className="absolute inset-0 opacity-40"
            style={{ filter: "url(#realistic-brushed-metal)" }}
          />

          {/* Ceiling Light Edge Highlight */}
          <div
            className="absolute top-0 left-0 w-full h-[3%]"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
            }}
          />

          {/* Metal Wall Panels (Right Side - The Door) */}
          <div
            className="absolute right-0 top-0 w-[35%] h-full border-l border-black/80 bg-[#020502]"
            style={{ perspective: "1200px" }}
          >
            {/* Tunnel Background (Visible when door opens) */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ opacity: isDoorOpen ? 1 : 0, transition: "opacity 0.5s delay 0.5s" }}
            >
              {/* Tunnel Walls (Trapezoids using borders) */}
              <div className="absolute inset-0 border-[40px] border-t-[#050a05] border-b-[#050a05] border-l-[#0a150a] border-r-[#0a150a] box-border" />
              <div className="absolute inset-[40px] border-[30px] border-t-[#030803] border-b-[#030803] border-l-[#081008] border-r-[#081008] box-border" />
              <div className="absolute inset-[70px] border-[20px] border-t-[#020502] border-b-[#020502] border-l-[#050a05] border-r-[#050a05] box-border" />

              {/* Server Lights on Walls */}
              <div className="absolute left-[20px] top-[20%] w-[4px] h-[10%] bg-[#4ade80] shadow-[0_0_15px_#4ade80]" />
              <div className="absolute left-[50px] top-[40%] w-[2px] h-[8%] bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />
              <div className="absolute right-[20px] top-[60%] w-[4px] h-[10%] bg-[#4ade80] shadow-[0_0_15px_#4ade80]" />
              <div className="absolute right-[50px] top-[30%] w-[2px] h-[8%] bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />

              {/* Far Core */}
              <div className="absolute w-[60px] h-[100px] bg-[#0a150a] border border-[#1a3520] flex items-center justify-center shadow-[0_0_40px_rgba(74,222,128,0.15)]">
                <div className="w-[20px] h-[20px] rounded-full bg-[#4ade80] blur-[4px] animate-pulse" />
              </div>
            </div>

            {/* The Actual Door (Redesigned as a Heavy Vault/Bunker Door) */}
            <motion.div
              className="w-full h-full origin-right relative"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: isDoorOpen ? 105 : 0 }}
              transition={{
                type: "spring",
                stiffness: 15,
                damping: 20,
                duration: 3,
                delay: isDoorOpen ? 0.5 : 0,
              }}
            >
              {/* Door Thickness (3D Edge) */}
              <div
                className="absolute top-0 left-0 w-[60px] h-full bg-[#0a0c0e] border-r border-[#222] flex flex-col justify-center gap-20 items-center"
                style={{ transformOrigin: "left", transform: "rotateY(-90deg)" }}
              >
                {/* Lock bolts (Retract when opening) */}
                <div
                  className="w-[40px] h-[30px] bg-[#222] rounded-r-md shadow-lg border border-[#444] transition-transform duration-500"
                  style={{ transform: isDoorOpen ? "translateX(-30px)" : "translateX(0)" }}
                />
                <div
                  className="w-[40px] h-[30px] bg-[#222] rounded-r-md shadow-lg border border-[#444] transition-transform duration-500"
                  style={{ transform: isDoorOpen ? "translateX(-30px)" : "translateX(0)" }}
                />
                <div
                  className="w-[40px] h-[30px] bg-[#222] rounded-r-md shadow-lg border border-[#444] transition-transform duration-500"
                  style={{ transform: isDoorOpen ? "translateX(-30px)" : "translateX(0)" }}
                />
              </div>

              {/* Front Face of Door (Sleek Industrial Lab Door) */}
              <div
                className="absolute inset-0 bg-[#22272b] shadow-[-10px_0_20px_rgba(0,0,0,0.8)] overflow-hidden border-r-2 border-[#111]"
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* Base Textures */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ filter: "url(#realistic-brushed-metal)" }}
                />

                {/* Panel Seams */}
                <div className="absolute top-0 bottom-0 left-[25%] w-[2px] bg-black/50 shadow-[1px_0_0_rgba(255,255,255,0.1)]" />
                <div className="absolute top-0 bottom-0 right-[25%] w-[2px] bg-black/50 shadow-[1px_0_0_rgba(255,255,255,0.1)]" />

                {/* Reinforced Window */}
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[140px] h-[350px] bg-[#050708] border-[8px] border-[#1a1c1e] rounded-sm shadow-[inset_0_10px_30px_rgba(0,0,0,1),0_5px_15px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center">
                  {/* Wire mesh pattern */}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                      backgroundSize: "6px 6px",
                      backgroundPosition: "0 0, 3px 3px",
                    }}
                  />
                  {/* Inner glow / depth */}
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,1)]" />
                  {/* Glass reflection */}
                  <div className="absolute top-[-20%] left-[-50%] w-[200%] h-[150%] bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-45" />
                </div>

                {/* Electronic Lock / Keypad */}
                <div className="absolute top-[45%] right-[8%] w-[70px] h-[160px] bg-[#111] border-2 border-[#222] rounded-md shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.1)] flex flex-col items-center py-4 gap-3 z-10">
                  {/* Status LED Indicator */}
                  <div
                    className={`w-10 h-3 rounded-sm shadow-[0_0_15px_currentColor] transition-colors duration-700 ${isDoorOpen ? "bg-[#4ade80] text-[#4ade80]" : "bg-[#ef4444] text-[#ef4444]"}`}
                  />
                  {/* Keypad mock */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 bg-[#2a2d32] rounded-sm shadow-[inset_0_-1px_2px_rgba(0,0,0,0.8)]"
                      />
                    ))}
                  </div>
                  <div className="w-8 h-3 bg-[#2a2d32] rounded-sm shadow-[inset_0_-1px_2px_rgba(0,0,0,0.8)] mt-1" />
                </div>

                {/* Sleek Handle */}
                <div className="absolute top-[40%] left-[8%] w-[25px] h-[250px] bg-gradient-to-r from-[#444] via-[#555] to-[#222] rounded-sm shadow-[5px_5px_15px_rgba(0,0,0,0.9),inset_1px_1px_0_rgba(255,255,255,0.2)] border border-[#111] flex justify-center items-center">
                  <div className="w-[8px] h-[200px] bg-[#111] rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]" />
                </div>

                {/* Warning Decal */}
                <div
                  className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-center opacity-60 font-sans font-bold tracking-widest text-[#0a0c0e] text-xs"
                  style={{ textShadow: "0 1px 0 rgba(255,255,255,0.1)" }}
                >
                  SECURE ACCESS ONLY
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Metal Frame (Above Screen) */}
          <div className="absolute top-[4%] left-[5%] right-[35%] h-[10%] bg-[#2a3036] border-b border-black/80 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <div
              className="absolute inset-0 opacity-60"
              style={{ filter: "url(#realistic-brushed-metal)" }}
            />
            {/* Frame Highlight */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />
            {/* Frame Light Reflection */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-full"
              style={{
                background:
                  "radial-gradient(ellipse at top, rgba(255,255,255,0.4) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Concrete Frame Seam Lines (Left Side) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[5%] top-0 w-[1px] h-full bg-[rgba(0,0,0,0.6)]" />
          </div>

          {/* Green Glossy Door Panel (Screen) */}
          <div
            className="absolute left-[5%] right-[35%] top-[14%] bottom-[16%] rounded-sm overflow-hidden border border-[#1a3520] flex flex-col p-8"
            style={{
              background:
                "linear-gradient(135deg, #0e2412 0%, #112c15 30%, #0a1a0d 70%, #061008 100%)",
              boxShadow:
                "inset 0 0 60px rgba(0,0,0,0.7), inset 0 0 20px rgba(0,20,5,0.5), 0 0 0 2px rgba(0,0,0,0.9)",
            }}
          >
            {/* Screen Reflection of Fluorescent Light */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[45%] h-[6px] bg-white/10 blur-[3px]" />
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[35%] h-[2px] bg-white/30 blur-[1px]" />

            {/* Gloss Sheen */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 20%, transparent 50%)",
              }}
            />

            {/* Reflected Light Bar 1 */}
            <div
              className="absolute top-[18%] left-[12%] w-[42%] h-[2%] blur-[3px] rounded-full animate-shimmer"
              style={{
                background:
                  "radial-gradient(ellipse 100% 100%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              }}
            />

            {/* Reflected Light Bar 2 */}
            <div
              className="absolute top-[17%] right-[14%] w-[12%] h-[2%] blur-[2.5px] animate-shimmer"
              style={{
                background: "radial-gradient(ellipse, rgba(255,255,255,0.65) 0%, transparent 100%)",
                animationDelay: "1s",
              }}
            />

            {/* Dynamic Screen Content */}
            <div
              className="relative z-30 font-mono text-xl md:text-2xl lg:text-3xl leading-relaxed font-bold tracking-wide"
              style={{ textShadow: "0 0 10px currentColor" }}
            >
              <AnimatePresence mode="wait">
                {loginStatus === "waiting" && (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[#4ade80]"
                  >
                    SISTEMA DE CONTROL
                    <br />
                    DE ACCESO
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      _
                    </motion.span>
                  </motion.div>
                )}
                {loginStatus === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[#4ade80]"
                  >
                    AUTENTICANDO...
                    <br />
                    VERIFICANDO ENCRIPTACIÓN
                    <br />
                    <motion.div
                      className="h-4 bg-[#4ade80] mt-4 shadow-[0_0_15px_#4ade80]"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, ease: "linear" }}
                    />
                  </motion.div>
                )}
                {loginStatus === "granted" && (
                  <motion.div
                    key="granted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[#4ade80]"
                  >
                    ACCESO AUTORIZADO
                    <br />
                    BIENVENIDO, ADMIN.
                    <br />
                    <br />
                    ABRIENDO PUERTA PRINCIPAL...
                  </motion.div>
                )}
                {loginStatus === "denied" && (
                  <motion.div
                    key="denied"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500"
                    style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.8)" }}
                  >
                    ACCESO DENEGADO
                    <br />
                    CREDENCIALES INVÁLIDAS.
                    <br />
                    <br />
                    INTENTO REGISTRADO.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Metal Frame (Below Screen) */}
          <div className="absolute bottom-[10%] left-[5%] right-[35%] h-[6%] bg-[#2a3036] border-t border-black/80 shadow-[0_-4px_15px_rgba(0,0,0,0.5)] z-10">
            <div
              className="absolute inset-0 opacity-60"
              style={{ filter: "url(#realistic-brushed-metal)" }}
            />
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/40" />
          </div>

          {/* Diamond Plate Floor */}
          <div className="absolute bottom-0 left-0 w-full h-[10%] bg-[#050607] overflow-hidden z-0">
            <div className="absolute inset-0" style={{ perspective: "800px" }}>
              <svg
                className="absolute inset-0 w-full h-[300%]"
                style={{
                  transform: "rotateX(70deg) translateY(-20%)",
                  transformOrigin: "top center",
                }}
              >
                <rect width="100%" height="100%" fill="url(#diamond-plate)" />
              </svg>
            </div>
            {/* Floor Shadow/Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 50%, rgba(0,0,0,0.9) 100%)",
              }}
            />
          </div>
        </motion.div>

        {/* FULL-SCREEN VIGNETTE */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background:
              "radial-gradient(ellipse 130% 110% at 50% 50%, transparent 35%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        {/* SLOTS */}
        <div
          id="login-panel-slot"
          style={{
            position: "absolute",
            left: "27%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 40,
          }}
        ></div>
        <div
          id="terminal-slot"
          style={{
            position: "absolute",
            left: "72%",
            top: "46%",
            transform: "translate(-50%, -50%)",
            zIndex: 40,
          }}
        ></div>
      </div>
    </div>
  )
}
