// components/transit-status-indicator.tsx
"use client"

import React from "react"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Clock, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { DadosTransito } from "@/lib/types"

interface TransitStatusIndicatorProps {
  status: DadosTransito["status"]
  origem: string
  destino: string
  dataEnvio: string
  dataRecebimento?: string
  className?: string
}

export function TransitStatusIndicator({ 
  status, 
  origem, 
  destino, 
  dataEnvio, 
  dataRecebimento,
  className = "" 
}: TransitStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "enviado":
        return {
          color: "bg-blue-500",
          textColor: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950",
          borderColor: "border-blue-200 dark:border-blue-800",
          icon: <Truck className="h-4 w-4" />,
          label: "Em Trânsito",
          description: "Enviado em " + new Date(dataEnvio).toLocaleDateString("pt-BR")
        }
      case "recebido":
        return {
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950",
          borderColor: "border-green-200 dark:border-green-800",
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Recebido",
          description: dataRecebimento ? 
            "Recebido em " + new Date(dataRecebimento).toLocaleDateString("pt-BR") :
            "Confirmado como recebido"
        }
      case "pendente":
        return {
          color: "bg-yellow-500",
          textColor: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          icon: <Clock className="h-4 w-4" />,
          label: "Pendente",
          description: "Aguardando confirmação"
        }
      default:
        return {
          color: "bg-gray-500",
          textColor: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-950",
          borderColor: "border-gray-200 dark:border-gray-800",
          icon: <Clock className="h-4 w-4" />,
          label: "Desconhecido",
          description: ""
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status Badge */}
      <Badge 
        variant="outline" 
        className={`${config.bgColor} ${config.borderColor} ${config.textColor}`}
      >
        <span className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </span>
      </Badge>

      {/* Rota Visual */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span className="font-medium">{origem.replace("CD ", "")}</span>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="h-4 w-4" />
        </motion.div>
        <span className="font-medium">{destino.replace("CD ", "")}</span>
      </div>

      {/* Pulse indicator para status enviado */}
      {status === "enviado" && (
        <motion.div
          className={`h-2 w-2 rounded-full ${config.color}`}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  )
}