import { Trophy } from "lucide-react"
import { useState } from "react"

import ManagerRanking from "@/features/camp-manager/components/ManagerRanking"

interface RankingViewProps {
  campId: number
}

export default function RankingView({ campId }: RankingViewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#c27c2f] pb-5">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider flex items-center gap-3">
            <Trophy className="w-7 h-7 shrink-0" />
            TABLA DE HONOR DEL CAMPAMENTO
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
            PRODUCTIVIDAD DIARIA · ORDEN DE MÉRITO
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshTrigger((n) => n + 1)}
          className="bg-[#c27c2f] text-black font-typewriter text-sm font-bold uppercase py-3 px-6 border-2 border-black shadow-[3px_3px_0_#000] hover:bg-[#df8120] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          ↺ ACTUALIZAR
        </button>
      </div>

      {/* RANKING */}
      <ManagerRanking campId={String(campId)} refreshTrigger={refreshTrigger} />
    </div>
  )
}
