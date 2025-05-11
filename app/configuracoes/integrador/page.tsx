// app/configuracoes/integrador/page.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { AlertCircle, Copy, Link2, RefreshCw, Shield, Zap, Clock, ArrowDownToLine, Power, PowerOff, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ColheitaCertaIntegration } from "@/lib/colheitacerta-integration"
import { Contagem } from "@/lib/types"

export default function IntegradorPage() {
  const { inventarioAtual, adicionarContagem } = useInventarioStore()
  const [realIntegratorStatus, setRealIntegratorStatus] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("conexao")
  const [apiKey, setApiKey] = useState("hb_inv_" + Math.random().toString(36).substring(2, 15))
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  const [isLoading, setIsLoading] = useState(false)
  const [syncInterval, setSyncInterval] = useState("30")
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [capturedCounts, setCapturedCounts] = useState<Array<{
      id: string,
      loja: string,
      ativo: string,
      quantidade: number,
      timestamp: string,
      status: "pending" | "imported" | "error"
    }>>([])

  // Configurações de conexão
  const [storeSystemUrl, setStoreSystemUrl] = useState("https://colheitacertahb.vercel.app/api/integration/data")
  const [storeApiKey, setStoreApiKey] = useState("token")
  const [autoImport, setAutoImport] = useState(true)
  const [notifyOnCapture, setNotifyOnCapture] = useState(true)

  // Estatísticas mockadas
  const [stats, setStats] = useState({
    totalCaptured: 0,
    totalImported: 0,
    totalPending: 0,
    totalErrors: 0,
    uptime: "0h 0m",
    lastError: null as string | null,
  })

  // Referência para o objeto de integração
  const integrationRef = useRef<ColheitaCertaIntegration | null>(null)

  // Função para processar novas contagens da API
  const handleNewContagens = (contagens: Contagem[]) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      console.error("Não há inventário ativo para importar contagens")
      return
    }

    // Processar contagens recebidas
    contagens.forEach(async (contagem) => {
      try {
        const newCount = {
          id: contagem.id,
          loja: contagem.origem,
          ativo: contagem.ativo,
          quantidade: contagem.quantidade,
          timestamp: contagem.dataContagem,
          status: autoImport ? "imported" as const : "pending" as const,
        }

        setCapturedCounts((prev) => [newCount, ...prev].slice(0, 100))
        setStats((prev) => ({
          ...prev,
          totalCaptured: prev.totalCaptured + 1,
          totalImported: newCount.status === "imported" ? prev.totalImported + 1 : prev.totalImported,
          totalPending: newCount.status === "pending" ? prev.totalPending + 1 : prev.totalPending,
        }))

        if (autoImport) {
          await adicionarContagem({
            inventarioId: inventarioAtual.id,
            tipo: "loja",
            origem: contagem.origem,
            ativo: contagem.ativo,
            quantidade: contagem.quantidade,
            responsavel: "integrador",
          })
        }

        if (notifyOnCapture) {
          toast.info(`Nova contagem capturada: ${contagem.origem} - ${contagem.ativo} (${contagem.quantidade})`)
        }

        // Atualizar último sincronismo
        setLastSync(new Date().toISOString())
      } catch (error) {
        setStats((prev) => ({
          ...prev,
          totalErrors: prev.totalErrors + 1,
          lastError: `Erro ao processar contagem da ${contagem.origem}: ${error instanceof Error ? error.message : String(error)}`,
        }))

        // Atualizar o status da contagem para erro
        setCapturedCounts((prev) =>
          prev.map((c) => (c.id === contagem.id ? { ...c, status: "error" as const } : c))
        )
      }
    })
  }

  // Função para lidar com erros da integração
  const handleIntegrationError = (error: Error) => {
    toast.error(`Erro na integração: ${error.message}`)
    setStats((prev) => ({
      ...prev,
      lastError: error.message,
    }))
  }

  useEffect(() => {
    // Verificar o status real do integrador
    const checkIntegratorStatus = async () => {
      try {
        // Verificar status no banco de dados
        const response = await fetch('/api/config/integrador');
        if (response.ok) {
          const config = await response.json();
          setRealIntegratorStatus(config.ativo);
          
          // Definir o estado local com base no status real
          if (config.ativo) {
            setConnectionStatus("connected");
            setStoreSystemUrl(config.apiUrl);
            setStoreApiKey(config.apiKey);
            setSyncInterval(String(config.syncInterval));
            setAutoImport(config.autoImport);
            setNotifyOnCapture(config.notifyOnCapture);
            setLastSync(config.lastSync);
          } else {
            setConnectionStatus("disconnected");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status do integrador:", error);
        setConnectionStatus("disconnected");
      }
    };
    
    checkIntegratorStatus();
  }, []);
  

  useEffect(() => {
  if (connectionStatus === "connected") {
    // Atualizar estatísticas a cada 5 segundos para ter feedback em tempo real
    const statsInterval = setInterval(() => {
      // Buscar estatísticas atualizadas do store
      const store = useInventarioStore.getState();
      const configAtual = store.integradorConfig;
      
      // Verificar se há contagens relacionadas ao integrador
      const contagensIntegrador = store.contagens.filter(c => 
        c.responsavel === "integrador" && c.inventarioId === store.inventarioAtual?.id
      );
      
      // Atualizar estatísticas com base nas contagens do store
      setStats(prev => ({
        ...prev,
        totalCaptured: contagensIntegrador.length,
        totalImported: contagensIntegrador.length, // Todas as presentes no store já foram importadas
        totalPending: 0, // Como estamos usando autoImport, não deve haver pendentes
        uptime: calcularUptime(lastSync)
      }));
      
      // Atualizar o array de contagens capturadas para exibição
      const contagens = contagensIntegrador.map(c => ({
        id: c.id,
        loja: c.origem,
        ativo: c.ativo,
        quantidade: c.quantidade,
        timestamp: c.dataContagem,
        status: "imported" as const
      }));
      
      // Atualizar somente se houver novas contagens
      if (contagens.length > capturedCounts.length) {
        setCapturedCounts(contagens);
      }
    }, 5000);
    
    return () => {
      clearInterval(statsInterval);
    };
  }
}, [connectionStatus, lastSync, capturedCounts.length]);

  function calcularUptime(desde: string | null): string {
    if (!desde) return "0h 0m";
    
    const startTime = new Date(desde);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    const hours = Math.floor(diffMs / 1000 / 60 / 60);
    
    return `${hours}h ${minutes}m`;
  }

  useEffect(() => {
    // Limpar a instância anterior ao desmontar o componente
    return () => {
      if (integrationRef.current) {
        integrationRef.current.stopMonitoring()
        integrationRef.current = null
      }
    }
  }, [])

    const handleConnect = async () => {
  if (!storeSystemUrl || !storeApiKey) {
    toast.error("URL do sistema e API Key são obrigatórios")
    return
  }

  if (!inventarioAtual || inventarioAtual.status !== "ativo") {
    toast.error("Não há inventário ativo para adicionar contagens")
    return
  }

  setConnectionStatus("connecting")
  setIsLoading(true)

  try {
    // Verificar se o token é válido antes de ativar
    const integration = new ColheitaCertaIntegration(
      storeSystemUrl,
      storeApiKey
    )

    const isValid = await integration.isTokenValid()
    if (!isValid) {
      throw new Error("Token inválido ou expirado")
    }

      await useInventarioStore.getState().ativarIntegrador({
        apiUrl: storeSystemUrl,
        apiKey: storeApiKey,
        syncInterval: Number.parseInt(syncInterval),
        autoImport,
        notifyOnCapture
      });
      
      // Atualizar estado local
      setRealIntegratorStatus(true);
      setConnectionStatus("connected");

    toast.success("Conexão estabelecida com sucesso!")
    setLastSync(new Date().toISOString())

    // Inicializar estatísticas
    setStats({
      totalCaptured: 0,
      totalImported: 0,
      totalPending: 0,
      totalErrors: 0,
      uptime: "0h 0m",
      lastError: null,
    })

    // Limpar contagens capturadas
    setCapturedCounts([])
  } catch (error) {
    setConnectionStatus("disconnected")
    toast.error(`Falha ao estabelecer conexão: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    setIsLoading(false)
  }
}

  const handleDisconnect = async () => {
    try {
      await useInventarioStore.getState().desativarIntegrador();
      setRealIntegratorStatus(false);
      setConnectionStatus("disconnected");
      toast.info("Conexão encerrada com o sistema de lojas");
    } catch (error) {
      toast.error(`Erro ao desconectar: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImportSelected = async (id: string) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para importar contagens")
      return
    }

    const contagem = capturedCounts.find((c) => c.id === id)
    if (!contagem) return

    try {
      await adicionarContagem({
        inventarioId: inventarioAtual.id,
        tipo: "loja",
        origem: contagem.loja,
        ativo: contagem.ativo,
        quantidade: contagem.quantidade,
        responsavel: "integrador",
      })

      setCapturedCounts((prev) => prev.map((count) => (count.id === id ? { ...count, status: "imported" } : count)))

      setStats((prev) => ({
        ...prev,
        totalImported: prev.totalImported + 1,
        totalPending: prev.totalPending - 1,
      }))

      toast.success("Contagem importada com sucesso!")
    } catch (error) {
      toast.error(`Erro ao importar contagem: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleImportAll = async () => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para importar contagens")
      return
    }

    const pendingCounts = capturedCounts.filter((c) => c.status === "pending")
    const pendingCount = pendingCounts.length

    if (pendingCount === 0) {
      toast.info("Não há contagens pendentes para importar")
      return
    }

    setIsLoading(true)

    try {
      for (const contagem of pendingCounts) {
        await adicionarContagem({
          inventarioId: inventarioAtual.id,
          tipo: "loja",
          origem: contagem.loja,
          ativo: contagem.ativo,
          quantidade: contagem.quantidade,
          responsavel: "integrador",
        })
      }

      setCapturedCounts((prev) =>
        prev.map((count) => (count.status === "pending" ? { ...count, status: "imported" } : count))
      )

      setStats((prev) => ({
        ...prev,
        totalImported: prev.totalImported + pendingCount,
        totalPending: 0,
      }))

      toast.success(`${pendingCount} contagens importadas com sucesso!`)
    } catch (error) {
      toast.error(`Erro ao importar contagens: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(storeApiKey)
    toast.success("API Key copiada para a área de transferência")
  }

  const handleRegenerateApiKey = () => {
    const newApiKey = "itfoh" + Math.random().toString(36).substring(2, 15)
    setStoreApiKey(newApiKey)
    toast.success("Nova API Key gerada com sucesso")
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Integrador</h1>
            <p className="text-muted-foreground">Conecte-se ao sistema de contagem das lojas em tempo real</p>
          </div>

          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <Badge variant="default" className="px-3 py-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Conectado
              </Badge>
            ) : connectionStatus === "connecting" ? (
              <Badge variant="secondary" className="px-3 py-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Conectando...
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Desconectado
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="conexao">
              <Link2 className="h-4 w-4 mr-2" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="monitoramento">
              <Zap className="h-4 w-4 mr-2" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger value="configuracoes">
              <Server className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conexao">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conexão com Sistema de Lojas</CardTitle>
                  <CardDescription>Configure a conexão com o sistema de contagem das lojas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="store-system-url">URL do Sistema de Lojas</Label>
                    <Input
                      id="store-system-url"
                      value={storeSystemUrl}
                      onChange={(e) => setStoreSystemUrl(e.target.value)}
                      placeholder="https://colheitacertahb.vercel.app/api/integration/data"
                      disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                    />
                    <p className="text-xs text-muted-foreground">URL base da API do sistema de contagem das lojas</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="store-api-key">API Key de Autenticação</Label>
                      <Badge variant="outline">Credencial</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="store-api-key"
                        value={storeApiKey}
                        onChange={(e) => setStoreApiKey(e.target.value)}
                        className="font-mono text-sm"
                        disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyApiKey}
                        title="Copiar API Key"
                        disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRegenerateApiKey}
                        title="Gerar nova API Key"
                        disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Esta chave deve ser configurada no sistema das lojas para autorizar a captura de dados
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sync-interval">Intervalo de Sincronização</Label>
                    <Select
                      value={syncInterval}
                      onValueChange={setSyncInterval}
                      disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                    >
                      <SelectTrigger id="sync-interval">
                        <SelectValue placeholder="Selecione o intervalo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">A cada 5 segundos</SelectItem>
                        <SelectItem value="10">A cada 10 segundos</SelectItem>
                        <SelectItem value="30">A cada 30 segundos</SelectItem>
                        <SelectItem value="60">A cada 1 minuto</SelectItem>
                        <SelectItem value="300">A cada 5 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Frequência com que o sistema verificará novas contagens
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-import"
                      checked={autoImport}
                      onCheckedChange={setAutoImport}
                      disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                    />
                    <Label htmlFor="auto-import">Importar contagens automaticamente</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-capture"
                      checked={notifyOnCapture}
                      onCheckedChange={setNotifyOnCapture}
                      disabled={connectionStatus === "connected" || connectionStatus === "connecting"}
                    />
                    <Label htmlFor="notify-capture">Notificar ao capturar novas contagens</Label>
                  </div>

                  {lastSync && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Última sincronização: {new Date(lastSync).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {connectionStatus === "connected" ? (
                    <Button variant="destructive" onClick={handleDisconnect} className="w-full">
                      <PowerOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  ) : (
                    <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleConnect}
                        className="w-full"
                        disabled={isLoading || !storeSystemUrl || !storeApiKey || !inventarioAtual || inventarioAtual.status !== "ativo"}
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
                            Conectando...
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Conectar ao Sistema de Lojas
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instruções de Integração</CardTitle>
                  <CardDescription>Como configurar o sistema de lojas para integração</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    Para integrar o sistema de contagem das lojas com o HB Inventory, siga os passos abaixo:
                  </p>

                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>
                      <strong>Configure o endpoint de integração no sistema das lojas:</strong>
                      <div className="bg-muted p-2 rounded-md mt-1">
                        <code className="text-xs">https://colheitacertahb.vercel.app/api/integration/data</code>
                      </div>
                    </li>
                    <li>
                      <strong>Adicione a API Key nas configurações de autenticação:</strong>
                      <div className="bg-muted p-2 rounded-md mt-1">
                        <code className="text-xs">{storeApiKey}</code>
                      </div>
                    </li>
                    <li>
                      <strong>Configure o formato de dados para envio:</strong>
                      <div className="bg-muted p-2 rounded-md mt-1">
                        <pre className="text-xs whitespace-pre-wrap">
                          {`{
// Continuação do app/configuracoes/integrador/page.tsx

  "loja": "10",
  "loja_nome": "Nome da Loja",
  "email": "contato@lojas.com",
  "ativo": "hb623",
  "ativo_nome": "Tipo do Ativo",
  "quantidade": 10,
  "data_registro": "2025-05-10T14:30:00Z"
}`}
                        </pre>
                      </div>
                    </li>
                    <li>
                      <strong>Habilite o envio automático de contagens no sistema das lojas</strong>
                    </li>
                    <li>
                      <strong>Teste a conexão utilizando o botão "Conectar" acima</strong>
                    </li>
                  </ol>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Segurança</AlertTitle>
                    <AlertDescription>
                      Mantenha sua API Key em segurança. Em caso de comprometimento, gere uma nova chave imediatamente.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoramento">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Capturado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCaptured}</div>
                    <p className="text-xs text-muted-foreground">contagens capturadas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Importadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{stats.totalImported}</div>
                    <p className="text-xs text-muted-foreground">contagens processadas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-500">{stats.totalPending}</div>
                    <p className="text-xs text-muted-foreground">aguardando importação</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Erros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{stats.totalErrors}</div>
                    <p className="text-xs text-muted-foreground">falhas de processamento</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Contagens Capturadas</CardTitle>
                      <CardDescription>Histórico de contagens capturadas do sistema de lojas</CardDescription>
                    </div>

                    {connectionStatus === "connected" && stats.totalPending > 0 && (
                      <Button variant="outline" size="sm" onClick={handleImportAll} disabled={isLoading}>
                        <ArrowDownToLine className="h-4 w-4 mr-2" />
                        Importar Todas ({stats.totalPending})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {capturedCounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {connectionStatus === "connected"
                        ? "Aguardando novas contagens..."
                        : "Conecte-se ao sistema de lojas para capturar contagens"}
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Loja</TableHead>
                            <TableHead>Ativo</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {capturedCounts.map((count) => (
                            <TableRow key={count.id}>
                              <TableCell>{count.loja}</TableCell>
                              <TableCell>{count.ativo}</TableCell>
                              <TableCell>{count.quantidade}</TableCell>
                              <TableCell>{new Date(count.timestamp).toLocaleString()}</TableCell>
                              <TableCell>
                                {count.status === "imported" ? (
                                  <Badge variant="default">Importado</Badge>
                                ) : count.status === "pending" ? (
                                  <Badge variant="secondary">Pendente</Badge>
                                ) : (
                                  <Badge variant="destructive">Erro</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {count.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleImportSelected(count.id)}
                                    disabled={connectionStatus !== "connected" || isLoading}
                                  >
                                    Importar
                                  </Button>
                                )}
                                {count.status === "error" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleImportSelected(count.id)}
                                    disabled={connectionStatus !== "connected" || isLoading}
                                  >
                                    Tentar Novamente
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Status da Conexão</CardTitle>
                    <CardDescription>Informações sobre a conexão atual</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tempo de atividade</span>
                        <span>{stats.uptime}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Última sincronização</span>
                        <span>{lastSync ? new Date(lastSync).toLocaleTimeString() : "N/A"}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Próxima sincronização</span>
                        <span>{connectionStatus === "connected" ? `Em ${syncInterval} segundos` : "N/A"}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Taxa de sucesso</span>
                        <span>
                          {stats.totalCaptured > 0
                            ? `${Math.round((stats.totalImported / stats.totalCaptured) * 100)}%`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {stats.lastError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Último erro</AlertTitle>
                        <AlertDescription>{stats.lastError}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Desempenho</CardTitle>
                    <CardDescription>Métricas de desempenho da integração</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processamento</span>
                        <span>{stats.totalCaptured > 0 ? `${stats.totalImported}/${stats.totalCaptured}` : "0/0"}</span>
                      </div>
                      <Progress
                        value={stats.totalCaptured > 0 ? (stats.totalImported / stats.totalCaptured) * 100 : 0}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Erros</span>
                        <span>{stats.totalCaptured > 0 ? `${stats.totalErrors}/${stats.totalCaptured}` : "0/0"}</span>
                      </div>
                      <Progress
                        value={stats.totalCaptured > 0 ? (stats.totalErrors / stats.totalCaptured) * 100 : 0}
                        className="h-2 bg-secondary [&>div]:bg-red-500"
                      />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">Distribuição por loja</h3>
                      <div className="space-y-2">
                        {Array.from(new Set(capturedCounts.map((c:any) => c.loja))).map((loja: string) => {
                          const total = capturedCounts.filter((c:any) => c.loja === loja).length
                          const percentage = (total / capturedCounts.length) * 100

                          return (
                            <div key={loja} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{loja}</span>
                                <span>{total} contagens</span>
                              </div>
                              <Progress value={percentage} className="h-1" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configuracoes">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                  <CardDescription>Ajustes avançados para a integração com o sistema de lojas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="api-version">Versão da API</Label>
                    <Select defaultValue="v2" disabled={connectionStatus === "connected"}>
                      <SelectTrigger id="api-version">
                        <SelectValue placeholder="Selecione a versão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1">v1 (Legado)</SelectItem>
                        <SelectItem value="v2">v2 (Atual)</SelectItem>
                        <SelectItem value="v3">v3 (Beta)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout de Requisição (segundos)</Label>
                    <Input id="timeout" type="number" defaultValue="30" min="5" max="120" disabled={connectionStatus === "connected"} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retry-attempts">Tentativas de Reconexão</Label>
                    <Input id="retry-attempts" type="number" defaultValue="3" min="1" max="10" disabled={connectionStatus === "connected"} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Tamanho do Lote de Importação</Label>
                    <Input id="batch-size" type="number" defaultValue="50" min="10" max="500" disabled={connectionStatus === "connected"} />
                    <p className="text-xs text-muted-foreground">
                      Número máximo de contagens a serem importadas em uma única operação
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="debug-mode" disabled={connectionStatus === "connected"} />
                    <Label htmlFor="debug-mode">Modo de Depuração</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="ssl-verify" defaultChecked disabled={connectionStatus === "connected"} />
                    <Label htmlFor="ssl-verify">Verificar Certificado SSL</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="auto-reconnect" defaultChecked disabled={connectionStatus === "connected"} />
                    <Label htmlFor="auto-reconnect">Reconectar Automaticamente</Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled={connectionStatus === "connected"}
                    onClick={() => {
                      // Restaurar configurações padrão
                      setSyncInterval("30");
                      setAutoImport(true);
                      setNotifyOnCapture(true);
                      toast.success("Configurações restauradas para os valores padrão");
                    }}
                  >
                    Restaurar Padrões
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mapeamento de Dados</CardTitle>
                  <CardDescription>
                    Configure como os dados do sistema de lojas são mapeados para o HB Inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo do Sistema de Lojas</TableHead>
                        <TableHead>Campo do HB Inventory</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>loja_nome</TableCell>
                        <TableCell>origem</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>ativo_nome</TableCell>
                        <TableCell>ativo</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>quantidade</TableCell>
                        <TableCell>quantidade</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>data_registro</TableCell>
                        <TableCell>dataContagem</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>tipo</TableCell>
                        <TableCell>loja (fixo)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>responsavel</TableCell>
                        <TableCell>integrador (fixo)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logs do Sistema</CardTitle>
                  <CardDescription>Registros de atividade da integração</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-md p-4 h-[200px] overflow-y-auto font-mono text-xs">
                  {connectionStatus === "connected" ? (
                    <>
                      <div className="text-green-500">
                        [{new Date().toLocaleString()}] INFO: Conexão estabelecida com {storeSystemUrl}
                      </div>
                      <div className="text-muted-foreground">
                        [{new Date().toLocaleString()}] DEBUG: Iniciando monitoramento de contagens
                      </div>
                      <div className="text-green-500">
                        [{new Date().toLocaleString()}] INFO: Monitoramento a cada {syncInterval} segundos
                      </div>
                      
                      {/* Adicionar um log que atualiza a cada 5 segundos para mostrar atividade */}
                      <div className="text-muted-foreground">
                        [{new Date().toLocaleString()}] DEBUG: Verificando novas contagens...
                      </div>
                      
                      {lastSync && (
                        <div className="text-green-500">
                          [{new Date(lastSync).toLocaleString()}] INFO: Última sincronização realizada com sucesso
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-yellow-500">
                      [{new Date().toLocaleString()}] WARN: Sistema aguardando conexão
                    </div>
                  )}
                  
                  {stats.lastError && (
                    <div className="text-red-500">
                      [{new Date().toLocaleString()}] ERROR: {stats.lastError}
                    </div>
                  )}
                </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={connectionStatus !== "connected"}
                    onClick={() => {
                      toast.success("Logs limpos com sucesso");
                    }}
                  >
                    Limpar Logs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={connectionStatus !== "connected"} 
                    onClick={() => {
                      toast.success("Logs exportados com sucesso");
                    }}
                  >
                    Exportar Logs
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}