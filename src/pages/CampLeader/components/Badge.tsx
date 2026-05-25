// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from "react"

export interface AchievementDetails {
  name: string
  icon: string
  description: string
  bgColor: string
  borderColor: string
  textColor: string
}

export const ACHIEVEMENTS_DICT: Record<string, AchievementDetails> = {
  VETERANO_PARAMO: {
    name: "Veterano del Paramo",
    icon: "\uD83C\uDF96\uFE0F",
    description:
      "Sobreviviente de alto rango curtido en la exploracion de zonas contaminadas y escombros radiactivos.",
    bgColor: "rgba(156, 39, 32, 0.25)",
    borderColor: "var(--accent-critical)",
    textColor: "#ef4444",
  },
  SOBREVIVIENTE_ELITE: {
    name: "Sobreviviente Elite",
    icon: "\uD83C\uDFC6",
    description:
      "Capitan experto de bunker con mas de 10 expediciones de combate exitosas reportadas.",
    bgColor: "rgba(194, 124, 47, 0.25)",
    borderColor: "var(--accent-warning)",
    textColor: "#fca311",
  },
  PRIMEROS_AUXILIOS_AVANZADOS: {
    name: "Primeros Auxilios Avanzados",
    icon: "\uD83D\uDC89",
    description:
      "Medico de campo calificado para neutralizacion inmediata de toxinas mutantes y suturas rapidas.",
    bgColor: "rgba(76, 99, 81, 0.25)",
    borderColor: "var(--accent-approved)",
    textColor: "#10b981",
  },
}

interface BadgeProps {
  key?: React.Key | string | number
  code: string
  showText?: boolean
}

export default function Badge({ code, showText = false }: BadgeProps) {
  const achievement = ACHIEVEMENTS_DICT[code]

  if (!achievement) {
    return null
  }

  return (
    <div
      title={`${achievement.name} - ${achievement.description}`}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono select-none hover:-translate-y-0.5 transition-all duration-150 cursor-help"
      style={{
        backgroundColor: achievement.bgColor,
        borderColor: achievement.borderColor,
        color: achievement.textColor,
        boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.95)",
      }}
    >
      <span className="text-[13px] leading-none shrink-0">{achievement.icon}</span>
      {showText && (
        <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#e5e5e5] select-text">
          {achievement.name}
        </span>
      )}
    </div>
  )
}
