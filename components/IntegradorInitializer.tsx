"use client"

import { useEffect } from "react"
import { integradorService } from "@/lib/integrador-service"

export function IntegradorInitializer() {
  useEffect(() => {
    integradorService
      .initialize()
      .then(() => console.log("Integrador inicializado"))
      .catch(error => console.error("Erro ao inicializar integrador:", error))
  }, [])

  return null
}
