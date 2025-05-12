// app/configuracoes/integrador/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Power, PowerOff, AlertCircle, ExternalLink, RefreshCcw, Database, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function IntegradorPage() {
  const { inventarioAtual, adicionarContagem } = useInventarioStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [notifyOnCapture, setNotifyOnCapture] = useState(true)
  const [totalCaptured, setTotalCaptured] = useState(0)
  const [syncProgress, setSyncProgress] = useState(0)
  const [showSyncAnimation, setShowSyncAnimation] = useState(false)

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

    // Simular sincronização visual periódica
    const syncIntervalId = setInterval(() => {
      setShowSyncAnimation(true)
      setSyncProgress(0)
      
      // Animar a barra de progresso
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setTimeout(() => setShowSyncAnimation(false), 500)
            return 100
          }
          return prev + 5
        })
      }, 50)
      
      // Buscar dados reais
      fetch('/api/integrador/status')
        .then(response => response.json())
        .then(data => {
          setTotalCaptured(data.totalCaptured || 0)
          setLastSync(data.lastSync)
        })
        .catch(error => console.error("Erro ao atualizar estatísticas:", error))
        
      return () => clearInterval(progressInterval)
    }, 15000) // Atualiza a cada 15 segundos

    return () => clearInterval(syncIntervalId)
  }, [isActive])

  const handleToggleIntegrador = async () => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens")
      return
    }

    setIsLoading(true)
    
    // Simular animação de transição
    if (!isActive) {
      setSyncProgress(0)
      setShowSyncAnimation(true)
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 2
        })
      }, 30)
    }

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
      
      // Efeito visual ao ativar/desativar
      if (data.ativo) {
        toast.success("Integrador ativado com sucesso!")
        setLastSync(new Date().toISOString())
      } else {
        toast.info("Integrador desativado")
        setShowSyncAnimation(false)
      }
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : String(error)}`)
      setShowSyncAnimation(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular tempo desde a última sincronização
  const getTimeSinceLastSync = () => {
    if (!lastSync) return "Nunca sincronizado";
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - lastSyncDate.getTime();
    
    // Menos de um minuto
    if (diffMs < 60000) {
      return "Agora mesmo";
    }
    
    // Menos de uma hora
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
    }
    
    // Menos de um dia
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
    }
    
    // Mais de um dia
    return lastSyncDate.toLocaleString();
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold">Integrador</h1>
            <p className="text-muted-foreground">Monitoramento automático de contagens do sistema de lojas</p>
          </div>

          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Badge variant="default" className="px-3 py-1 flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Ativo
                </Badge>
              </motion.div>
            ) : (
              <motion.div 
                key="inactive"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Badge variant="outline" className="px-3 py-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Inativo
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!inventarioAtual || inventarioAtual.status !== "ativo" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                É necessário ter um inventário ativo para utilizar o integrador.
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-accent" />
                  Integrador de Contagens
                </CardTitle>
                <CardDescription>
                  Monitoramento automático da tabela de contagens das lojas no banco de dados
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <AnimatePresence>
                  {showSyncAnimation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <div className="bg-accent/10 rounded-md p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium flex items-center gap-1">
                            <RefreshCcw className="h-3 w-3 animate-spin" />
                            Sincronizando...
                          </span>
                          <span className="text-xs">{syncProgress}%</span>
                        </div>
                        <Progress value={syncProgress} className="h-1.5" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div 
                  className="rounded-lg border bg-card overflow-hidden"
                  whileHover={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-muted px-4 py-3 border-b">
                    <h3 className="text-sm font-medium">Como funciona?</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Quando ativado, o integrador monitora automaticamente a tabela de contagens do sistema de lojas
                      e importa os novos registros para o inventário atual.
                    </p>
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                      <ul className="space-y-1 list-disc pl-4">
                        <li>As contagens são importadas automaticamente em segundo plano</li>
                        <li>Você pode continuar navegando no sistema normalmente</li>
                        <li>É possível ativar notificações para cada importação</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <motion.div 
                    className="bg-card border rounded-lg p-4 relative overflow-hidden"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-accent to-accent/50"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/10 p-2 rounded-full">
                        <Activity className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Contagens capturadas</h3>
                        <motion.p 
                          className="text-3xl font-bold mt-1"
                          key={totalCaptured}
                          initial={{ scale: 1.2, color: "var(--accent)" }}
                          animate={{ scale: 1, color: "var(--foreground)" }}
                          transition={{ duration: 0.3 }}
                        >
                          {totalCaptured}
                        </motion.p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isActive ? 'Monitoramento ativo' : 'Monitoramento inativo'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-card border rounded-lg p-4 relative overflow-hidden"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-accent/50 to-accent"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/10 p-2 rounded-full">
                        <RefreshCcw className={`h-5 w-5 text-accent ${isActive ? 'animate-spin' : ''}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Última sincronização</h3>
                        <motion.p 
                          className="text-lg font-medium mt-1"
                          key={lastSync}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {getTimeSinceLastSync()}
                        </motion.p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lastSync ? new Date(lastSync).toLocaleString() : "Nunca sincronizado"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between space-x-2 bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-capture"
                      checked={notifyOnCapture}
                      onCheckedChange={setNotifyOnCapture}
                      disabled={isActive || isLoading}
                    />
                    <Label htmlFor="notify-capture" className="font-medium">Notificar ao capturar novas contagens</Label>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {notifyOnCapture ? 'Ativado' : 'Desativado'}
                  </div>
                </div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="bg-accent/10 border-accent/20">
                        <div className="flex gap-2">
                          <div className="shrink-0 mt-1">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                            </span>
                          </div>
                          <div>
                            <AlertTitle className="text-accent">Integrador ativo</AlertTitle>
                            <AlertDescription className="text-accent/80">
                              O integrador está monitorando a tabela de contagens e importando dados automaticamente.
                              Você pode navegar pelo sistema normalmente, o monitoramento continuará em segundo plano.
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              
              <CardFooter>
                <AnimatePresence mode="wait">
                  {isActive ? (
                    <motion.div 
                      className="w-full"
                      key="desativar"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleToggleIntegrador}
                          className="w-full"
                          variant="destructive"
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
                              Desativando...
                            </>
                          ) : (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desativar Integrador
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="w-full"
                      key="ativar"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleToggleIntegrador}
                          className="w-full"
                          variant="default"
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
                              Ativando...
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Ativar Integrador
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}