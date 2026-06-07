import { Cpu, Radio } from "lucide-react"
import { useEffect, useState } from "react"

export default function Footer() {
  const [signal, setSignal] = useState(94.2)

  useEffect(() => {
    const timer = setInterval(() => {
      setSignal((prev) => {
        const drift = (Math.random() - 0.5) * 0.4
        return Number(Math.min(100, Math.max(85, prev + drift)).toFixed(2))
      })
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer
      id="system-footer"
      className="bg-[#111111] border-t border-[#3b4d3e] text-[#ab9e8b] font-mono text-[10px] py-3 px-6 flex flex-col md:flex-row items-center justify-between gap-2 z-10"
    >
      <div className="flex items-center gap-4">
        <span className="text-[#c27c2f] font-semibold">DOOMSDAY-SYS v2.48</span>
        <span className="hidden md:inline text-zinc-700">|</span>
        <span className="hidden md:inline">
          LATENCIA API: <span className="text-[#3b4d3e] font-semibold">22ms OK</span>
        </span>
      </div>

      <div className="flex items-center gap-2 text-[#c27c2f]">
        <Radio className="w-3.5 h-3.5 animate-pulse" />
        <span className="uppercase text-[9px] tracking-widest tabular-nums">
          Freq. emergencia: {signal} MHz
        </span>
      </div>

      <div className="flex items-center gap-2 text-zinc-600">
        <Cpu className="w-3.5 h-3.5" />
        <span>Bunk-Log Console Active</span>
      </div>
    </footer>
  )
}
