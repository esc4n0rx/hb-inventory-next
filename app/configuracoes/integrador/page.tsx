// app/configuracoes/integrador/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Power, PowerOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function IntegradorPage() {
  const { inventarioAtual, adicionarContagem } = useInventarioStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [notifyOnCapture, setNotifyOnCapture] = useState(true)
  const [totalCaptured, setTotalCaptured] = useState(0)

  // Verifica o status atual do integrador ao carregar a página
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const response = await fetch('/api/integrador/status')
        if (response.ok) {
          const data = await response.json()
          setIsActive(data.ativo)
          setLastSync(data.lastSync)
          setNotifyOnCapture(data.notifyOnCapture)
          setTotalCaptured(data.totalCaptured || 0)
        }
      } catch (error) {
        console.error("Erro ao verificar status do integrador:", error)
      }
    }

    verificarStatus()
  }, [])

  // Atualiza periodicamente o total de contagens capturadas quando ativo
  useEffect(() => {
    if (!isActive) return

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/integrador/status')
        if (response.ok) {
          const data = await response.json()
          setTotalCaptured(data.totalCaptured || 0)
          setLastSync(data.lastSync)
        }
      } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error)
      }
    }, 10000) // Atualiza a cada 10 segundos

    return () => clearInterval(intervalId)
  }, [isActive])

  const handleToggleIntegrador = async () => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/integrador/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ativo: !isActive,
          notifyOnCapture,
          inventarioId: inventarioAtual.id
        })
      })

      if (!response.ok) {
        throw new Error("Falha ao alterar status do integrador")
      }

      const data = await response.json()
      setIsActive(data.ativo)
      
      if (data.ativo) {
        toast.success("Integrador ativado com sucesso!")
        setLastSync(new Date().toISOString())
      } else {
        toast.info("Integrador desativado")
      }
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Integrador</h1>
            <p className="text-muted-foreground">Monitoramento automático de contagens do sistema de lojas</p>
          </div>

          <div className="flex items-center gap-2">
            {isActive ? (
              <Badge variant="default" className="px-3 py-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Inativo
              </Badge>
            )}
          </div>
        </div>

        {!inventarioAtual || inventarioAtual.status !== "ativo" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              É necessário ter um inventário ativo para utilizar o integrador.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Integrador de Contagens</CardTitle>
              <CardDescription>
                Monitoramento automático da tabela de contagens das lojas no banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 p-4 border rounded-md bg-muted/50">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Como funciona?</h3>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, o integrador monitora automaticamente a tabela de contagens do sistema de lojas
                    e importa os novos registros para o inventário atual.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                    <div>
                      <p className="text-sm font-medium">Contagens capturadas</p>
                      <p className="text-2xl font-bold">{totalCaptured}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                    <div>
                      <p className="text-sm font-medium">Última sincronização</p>
                      <p className="text-sm">{lastSync ? new Date(lastSync).toLocaleString() : "Nenhuma"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notify-capture"
                  checked={notifyOnCapture}
                  onCheckedChange={setNotifyOnCapture}
                  disabled={isActive || isLoading}
                />
                <Label htmlFor="notify-capture">Notificar ao capturar novas contagens</Label>
              </div>

              {isActive && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Integrador ativo</AlertTitle>
                  <AlertDescription>
                    O integrador está monitorando a tabela de contagens e importando dados automaticamente.
                    Você pode navegar pelo sistema normalmente, o monitoramento continuará em segundo plano.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleToggleIntegrador}
                  className="w-full"
                  variant={isActive ? "destructive" : "default"}
                  disabled={isLoading || !inventarioAtual || inventarioAtual.status !== "ativo"}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isActive ? "Desativando..." : "Ativando..."}
                    </>
                  ) : isActive ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Desativar Integrador
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Ativar Integrador
                    </>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}