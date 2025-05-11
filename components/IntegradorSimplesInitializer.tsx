// components/IntegradorSimplesInitializer.tsx

"use client"

import { useEffect } from "react"
import { integradorSimples } from "@/lib/integrador-simples"

export function IntegradorSimplesInitializer() {
  useEffect(() => {
    // Verificar o status inicial
    integradorSimples.verificarStatus();
    
    // Verificar periodicamente se o status mudou
    const intervalId = setInterval(() => {
      integradorSimples.verificarStatus();
    }, 60000); // A cada minuto
    
    return () => clearInterval(intervalId);
  }, []);

  return null;
}