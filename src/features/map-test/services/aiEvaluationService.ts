import type { Camp } from "../types/camp"

const resourcePriority = (camp: Camp): string => {
  const lowest = [...camp.resources].sort((a, b) => a.amount - b.amount)[0]
  if (!lowest) return "suministros estables"
  if (lowest.amount < 25) return `critico en ${lowest.type}`
  if (lowest.amount < 45) return `riesgo logistica en ${lowest.type}`
  return "logistica en rango operativo"
}

export const aiEvaluationService = {
  analyzeCampSituation: async (camp: Camp): Promise<string> => {
    const priority = resourcePriority(camp)
    if (camp.hasAlert) {
      return `PROTOCOLO ROJO: ${camp.name} bajo alerta. Priorizar refuerzos y asegurar perimetro. Estado: ${priority}.`
    }

    if (camp.dangerLevel === "high" || camp.dangerLevel === "critical") {
      return `PROTOCOLO AMBAR: elevar patrullas en ${camp.name}. Mantener vigilancia activa. Estado: ${priority}.`
    }

    return `SECTOR ESTABLE: ${camp.name} operativo. Mantener rotacion de exploracion y control de ${priority}.`
  },
}
