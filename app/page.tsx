"use client"

import { useState, useEffect, useCallback, useMemo, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Download, 
  FileText, 
  History, 
  MoreHorizontal, 
  Plus, 
  Settings, 
  X, 
  TrendingUp,
  Package,
  Building,
  Truck
} from "lucide-react"
import { AnimatedCard } from "@/components/animated-card"
import { ProgressRing } from "@/components/progress-ring"
import { NovoInventarioDialog } from "@/components/novo-inventario-dialog"
import { CarregarInventarioDialog } from "@/components/carregar-inventario-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"
import { ativos } from "@/data/ativos"
import { LojasPendentesCard } from "@/components/lojas-pendentes-card"
import { FinalizarInventarioDialog } from "@/components/finalizar-inventario-dialog"

export default function Home() {
  const { 
    inventarioAtual, 
    finalizarInventario, 
    carregarInventarioAtivo,
    carregarInventarios,
    getEstatisticas,
    carregarContagens,
    carregarDadosTransito,
    contagens,
    dadosTransito,
    inventarios,
    isLoading,
    addContagemChangeListener,
    removeContagemChangeListener 
  } = useInventarioStore()
  
  const [novoInventarioDialogOpen, setNovoInventarioDialogOpen] = useState(false)
  const [carregarInventarioDialogOpen, setCarregarInventarioDialogOpen] = useState(false)
  const [estatisticasLocais, setEstatisticasLocais] = useState(getEstatisticas())
  const [updateCounter, setUpdateCounter] = useState(0)
  const [comparativoTab, setComparativoTab] = useState('setor')
  const [initialLoading, setInitialLoading] = useState(true)
  const [finalizarInventarioDialogOpen, setFinalizarInventarioDialogOpen] = useState(false)

  useEffect(() => {
  const carregarDados = async () => {
    if (initialLoading === false) return;
    
    setInitialLoading(true);
    try {
      await carregarInventarioAtivo();
      await carregarInventarios();
      
      if (inventarioAtual) {
        await Promise.all([
          carregarContagens(inventarioAtual.id),
          carregarDadosTransito(inventarioAtual.id)
        ]);
      }
      setEstatisticasLocais(getEstatisticas());
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast.error("Não foi possível carregar todos os dados. Tente novamente mais tarde.");
    } finally {
      setInitialLoading(false);
    }
  };
    
    carregarDados();
  }, [carregarInventarioAtivo, carregarInventarios, carregarContagens, carregarDadosTransito, inventarioAtual, getEstatisticas]);

  const handleContagemChange = useCallback(() => {
    setEstatisticasLocais(getEstatisticas());
    setUpdateCounter(c => c + 1);
  }, [getEstatisticas]);

  useEffect(() => {
    addContagemChangeListener(handleContagemChange);
    
    return () => {
      removeContagemChangeListener(handleContagemChange);
    };
  }, [addContagemChangeListener, removeContagemChangeListener, handleContagemChange]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setEstatisticasLocais(getEstatisticas());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [getEstatisticas]);

  const handleFinalizarInventario = () => {
  setFinalizarInventarioDialogOpen(true)
  }

  const calcularDadosComparativos = useMemo(() => {
    if (!inventarioAtual || !contagens.length) {
      return {
        setores: [],
        lojas: [],
        fornecedores: [],
        cd: []
      };
    }

    const contagensInventario = contagens.filter(c => c.inventarioId === inventarioAtual.id);
    const dadosPorSetor: { [key: string]: number } = {};
    contagensInventario
      .filter(c => c.tipo === 'setor')
      .forEach(c => {
        if (!dadosPorSetor[c.origem]) {
          dadosPorSetor[c.origem] = 0;
        }
        dadosPorSetor[c.origem] += c.quantidade;
      });
    
    const setores = Object.entries(dadosPorSetor)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10); 
    
    const dadosPorLoja: { [key: string]: number } = {};
    contagensInventario
      .filter(c => c.tipo === 'loja')
      .forEach(c => {
        if (!dadosPorLoja[c.origem]) {
          dadosPorLoja[c.origem] = 0;
        }
        dadosPorLoja[c.origem] += c.quantidade;
      });
    
    const lojas = Object.entries(dadosPorLoja)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10); 
    
    const dadosPorFornecedor: { [key: string]: number } = {};
    contagensInventario
      .filter(c => c.tipo === 'fornecedor')
      .forEach(c => {
        if (!dadosPorFornecedor[c.origem]) {
          dadosPorFornecedor[c.origem] = 0;
        }
        dadosPorFornecedor[c.origem] += c.quantidade;
      });
    
    const fornecedores = Object.entries(dadosPorFornecedor)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const dadosPorCD: { [key: string]: number } = {};
    contagensInventario.forEach(c => {
      if (!dadosPorCD[c.ativo]) {
        dadosPorCD[c.ativo] = 0;
      }
      dadosPorCD[c.ativo] += c.quantidade;
    });
    
    const cd = Object.entries(dadosPorCD)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    return { setores, lojas, fornecedores, cd };
  }, [inventarioAtual, contagens]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const getStatusInventario = () => {
    if (!inventarioAtual) return { 
      color: "text-muted-foreground", 
      bgColor: "bg-muted", 
      message: "Nenhum inventário ativo" 
    };
    
    const { progresso } = estatisticasLocais;
    const media = (progresso.lojas + progresso.setores + progresso.fornecedores) / 3;
    
    if (media < 33) {
      return { 
        color: "text-amber-500", 
        bgColor: "bg-amber-500/10", 
        message: "Em andamento (Inicial)" 
      };
    } else if (media < 66) {
      return { 
        color: "text-blue-500", 
        bgColor: "bg-blue-500/10", 
        message: "Em andamento (Intermediário)" 
      };
    } else {
      return { 
        color: "text-green-500", 
        bgColor: "bg-green-500/10", 
        message: "Em andamento (Avançado)" 
      };
    }
  };

  const statusInventario = getStatusInventario();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {initialLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="w-full">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  Dashboard
                  {inventarioAtual && (
                    <Badge className={`ml-2 ${statusInventario.color} ${statusInventario.bgColor}`}>
                      {statusInventario.message}
                    </Badge>
                  )}
                </h1>
                {inventarioAtual ? (
                  <p className="text-muted-foreground">
                    Inventário ativo: <span className="font-medium">{inventarioAtual.codigo}</span> | Responsável:{" "}
                    <span className="font-medium">{inventarioAtual.responsavel}</span> |{" "}
                    <span className="text-muted-foreground">
                      Iniciado em {inventarioAtual.dataInicio ? new Date(inventarioAtual.dataInicio).toLocaleDateString("pt-BR") : ''}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Nenhum inventário ativo no momento</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {inventarioAtual ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={handleFinalizarInventario} className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Finalizar Inventário
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setNovoInventarioDialogOpen(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Inventário
                    </Button>
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => setCarregarInventarioDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Carregar Inventário
                  </Button>
                </motion.div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Exportar PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      <span>Ver histórico</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Configurações rápidas</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!inventarioAtual && !initialLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert variant="default" className="bg-accent/10 border-accent/20">
              <TrendingUp className="h-4 w-4 text-accent" />
              <AlertTitle>Nenhum inventário ativo</AlertTitle>
              <AlertDescription>
                Inicie um novo inventário ou carregue um inventário finalizado para visualizar os dados.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {initialLoading ? (
            <motion.div
              key="loading-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
            </motion.div>
          ) : (
            <motion.div
              key={`stats-${updateCounter}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatedCard title="Lojas" className="relative overflow-hidden" delay={0.1}>
                <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500/20"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <Building className="h-5 w-5 text-blue-500" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {estatisticasLocais.progresso.lojas}% concluído
                  </Badge>
                </div>
                <div className="flex items-center justify-center h-full">
                  <ProgressRing progress={estatisticasLocais.progresso.lojas} color="hsl(var(--blue-500))">
                    <div className="text-center">
                      <span className="text-3xl font-bold">{estatisticasLocais.totalLojasContadas}</span>
                      <p className="text-xs text-muted-foreground">de {Object.values(lojas).flat().length}</p>
                    </div>
                  </ProgressRing>
                </div>
              </AnimatedCard>

              <AnimatedCard title="Setores do CD" className="relative overflow-hidden" delay={0.2}>
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500/20"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-amber-500/10 p-2 rounded-full">
                    <Package className="h-5 w-5 text-amber-500" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {estatisticasLocais.progresso.setores}% concluído
                  </Badge>
                </div>
                <div className="flex items-center justify-center h-full">
                  <ProgressRing progress={estatisticasLocais.progresso.setores} color="hsl(var(--amber-500))">
                    <div className="text-center">
                      <span className="text-3xl font-bold">{estatisticasLocais.totalSetoresContados}</span>
                      <p className="text-xs text-muted-foreground">de {setoresCD.length}</p>
                    </div>
                  </ProgressRing>
                </div>
              </AnimatedCard>

              <motion.div
                variants={itemVariants}
                className="lg:col-span-1"
              >
                <LojasPendentesCard 
                  lojasPendentes={estatisticasLocais.lojasPendentes} 
                  className="h-full"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {initialLoading ? (
            <motion.div
              key="loading-chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Skeleton className="h-[350px] w-full rounded-lg" />
            </motion.div>
          ) : (
            <motion.div
              key="loaded-chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <AnimatedCard title="Comparativo de Contagens" delay={0.4}>
                <Tabs value={comparativoTab} onValueChange={setComparativoTab}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="setor">Por Setor</TabsTrigger>
                    <TabsTrigger value="loja">Por Loja</TabsTrigger>
                    <TabsTrigger value="fornecedor">Por Fornecedor</TabsTrigger>
                    <TabsTrigger value="cd">Por Tipo de Ativo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="setor">
                    {!inventarioAtual ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Inicie um inventário para visualizar o gráfico</p>
                      </div>
                    ) : calcularDadosComparativos.setores.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Nenhuma contagem por setor registrada ainda</p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ComparativoChart 
                          data={calcularDadosComparativos.setores} 
                          title="Contagens por Setor"
                          xField="nome"
                          yField="quantidade"
                          color="#f59e0b"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="loja">
                    {!inventarioAtual ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Inicie um inventário para visualizar o gráfico</p>
                      </div>
                    ) : calcularDadosComparativos.lojas.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Nenhuma contagem por loja registrada ainda</p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ComparativoChart 
                          data={calcularDadosComparativos.lojas} 
                          title="Contagens por Loja"
                          xField="nome"
                          yField="quantidade"
                          color="#3b82f6"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="fornecedor">
                    {!inventarioAtual ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Inicie um inventário para visualizar o gráfico</p>
                      </div>
                    ) : calcularDadosComparativos.fornecedores.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Nenhuma contagem por fornecedor registrada ainda</p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ComparativoChart 
                          data={calcularDadosComparativos.fornecedores} 
                          title="Contagens por Fornecedor"
                          xField="nome"
                          yField="quantidade"
                          color="#10b981"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="cd">
                    {!inventarioAtual ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Inicie um inventário para visualizar o gráfico</p>
                      </div>
                    ) : calcularDadosComparativos.cd.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Nenhuma contagem registrada ainda</p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ComparativoChart 
                          data={calcularDadosComparativos.cd} 
                          title="Contagens por Tipo de Ativo"
                          xField="nome"
                          yField="quantidade"
                          color="#8b5cf6"
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>

        {!initialLoading && inventarioAtual && dadosTransito.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <AnimatedCard title="Trânsito de Ativos" delay={0.6}>
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1 bg-cyan-500/20"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-cyan-500/10 p-2 rounded-full">
                    <Truck className="h-5 w-5 text-cyan-500" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dadosTransito.filter(t => t.inventarioId === inventarioAtual.id).length} itens
                  </Badge>
                </div>
                
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {dadosTransito
                      .filter(t => t.inventarioId === inventarioAtual.id)
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{item.ativo}</p>
                            <p className="text-xs text-muted-foreground">
                              De {item.origem} para {item.destino}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantidade} unidades</p>
                            <Badge 
                              variant={item.status === "recebido" ? "default" : "outline"}
                              className="text-xs"
                            >
                              {item.status === "recebido" ? "Recebido" : "Em trânsito"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </div>
      {inventarioAtual && (
          <FinalizarInventarioDialog 
            open={finalizarInventarioDialogOpen} 
            onOpenChange={setFinalizarInventarioDialogOpen}
            inventarioId={inventarioAtual.id}
          />
        )}
      <NovoInventarioDialog open={novoInventarioDialogOpen} onOpenChange={setNovoInventarioDialogOpen} />
      <CarregarInventarioDialog open={carregarInventarioDialogOpen} onOpenChange={setCarregarInventarioDialogOpen} />
    </div>
  )
}

interface ComparativoChartData {
  [key: string]: string | number;
}

function ComparativoChart({ 
  data, 
  title, 
  xField, 
  yField, 
  color 
}: { 
  data: ComparativoChartData[];
  title: string;
  xField: string;
  yField: string;
  color: string;
}) {
  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="flex-1 relative">
        <BarChart data={data} xField={xField} yField={yField} color={color} />
      </div>
    </div>
  )
}

function BarChart({ data, xField, yField, color }: { 
  data: ComparativoChartData[];
  xField: string;
  yField: string;
  color: string;
}) {
  const maxValue = Math.max(...data.map((item: { [x: string]: any }) => item[yField]));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end">
        {data.map((item: { [x: string]: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined }, index: Key | null | undefined) => {
          const value = typeof item[yField] === 'number' ? item[yField] as number : 0;
          const percentage = (value / maxValue) * 100;
          return (
            <div key={index} className="group flex flex-1 flex-col items-center justify-end px-1">
              <div className="w-full flex items-center justify-center mb-1">
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {item[yField]}
                </span>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index ? Number(index) * 0.05 : 0 }}
                className="w-full rounded-t-md" 
                style={{ 
                  backgroundColor: color,
                  minHeight: '4px',
                  opacity: 0.7
                }}
              />
              <div className="w-full mt-1 truncate text-center">
                <span className="text-xs text-muted-foreground truncate block" style={{ fontSize: '9px' }}>
                  {String(item[xField] || '').length > 8 ? `${String(item[xField]).substring(0, 8)}...` : item[xField]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}