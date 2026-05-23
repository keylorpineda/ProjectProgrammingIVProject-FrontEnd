// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Radio, Heart, Cpu } from 'lucide-react';

export default function Footer() {
  const [signal, setSignal] = useState(94.2);

  // Fluctuating radio signal simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSignal(prev => {
        const drift = (Math.random() - 0.5) * 0.4;
        return Number(Math.min(100, Math.max(85, prev + drift)).toFixed(2));
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer 
      id="system-footer"
      className="bg-[#111111] border-t border-[#3b4d3e] text-[#ab9e8b] font-mono text-[10px] py-3 px-6 flex flex-col md:flex-row items-center justify-between gap-2 z-10"
    >
      <div className="flex items-center gap-4">
        <span className="text-[#c27c2f] font-bold">DOOMSDAY-SYS v2.48</span>
        <span className="hidden md:inline text-zinc-700">|</span>
        <span className="hidden md:inline">LATENCIA API: <span className="text-[#3b4d3e] font-bold">22MS OK</span></span>
      </div>

      <div className="flex items-center gap-2 animate-pulse text-[#c27c2f]">
        <Radio className="w-3.5 h-3.5" />
        <span className="uppercase text-[9px] tracking-widest">
          FRECUENCIA DE EMERGENCIA BÚNKER: {signal} MHZ
        </span>
      </div>

      <div className="flex items-center gap-2 text-zinc-500">
        <Cpu className="w-3.5 h-3.5 text-zinc-600" />
        <span>SECURE BUNK-LOG CONSOLE ACTIVE</span>
      </div>
    </footer>
  );
}
