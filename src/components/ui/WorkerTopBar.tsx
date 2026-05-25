interface WorkerTopBarProps {
  campName?: string
  sectorId?: string
  userName?: string
}

export default function WorkerTopBar({
  sectorId = "04-GAMMA",
  userName = "WORKER",
}: WorkerTopBarProps) {
  return (
    <header className="sticky top-0 h-[70px] bg-bunker-bg border-b-2 border-ink-black flex items-center justify-between px-10 z-40">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="typewriter text-text-light text-sm tracking-[0.2em] whitespace-nowrap">
            <span className="opacity-70">CONFIDENTIAL //</span> CAMP ARCHIVE
          </p>
        </div>

        <div className="h-4 w-px bg-paper-dark/40" />

        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-mono text-paper-base uppercase whitespace-nowrap">
            SECTOR: {sectorId} | STATUS: OPERATIONAL
          </span>
        </div>
      </div>

      <div className="bg-ink-black border border-paper-dark px-4 py-2 flex items-center gap-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
        <p className="text-[10px] font-mono text-white tracking-[0.1em] uppercase font-bold whitespace-nowrap">
          USR{" "}
          <span className="text-accent-orange drop-shadow-[0_0_8px_rgba(194,124,47,0.3)]">
            [{userName}]
          </span>
        </p>
      </div>
    </header>
  )
}
