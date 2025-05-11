// app/page.tsx (modificado para atualização dinâmica)

"use client"

import { useState, useEffect, useCallback } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Download, FileText, History, MoreHorizontal, Plus, Settings, X } from "lucide-react"
import { AnimatedCard } from "@/components/animated-card"
import { ProgressRing } from "@/components/progress-ring"
import { NovoInventarioDialog } from "@/components/novo-inventario-dialog"
import { CarregarInventarioDialog } from "@/components/carregar-inventario-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Home() {
  const { 
    inventarioAtual, 
    finalizarInventario, 
    carregarInventarioAtivo,
    carregarInventarios,
    getEstatisticas,
    carregarContagens,
    carregarDadosTransito,
    inventarios,
    isLoading,
    addContagemChangeListener,
    removeContagemChangeListener 
  } = useInventarioStore()
  
  const [novoInventarioDialogOpen, setNovoInventarioDialogOpen] = useState(false)
  const [carregarInventarioDialogOpen, setCarregarInventarioDialogOpen] = useState(false)
  // Estado local para estatísticas e atualização dinâmica
  const [estatisticasLocais, setEstatisticasLocais] = useState(getEstatisticas())
  // Estado para forçar re-renderização
  const [updateCounter, setUpdateCounter] = useState(0)

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      await carregarInventarioAtivo();
      await carregarInventarios();
      
      if (inventarioAtual) {
        await Promise.all([
          carregarContagens(inventarioAtual.id),
          carregarDadosTransito(inventarioAtual.id)
        ]);
      }
      
      // Atualizar estatísticas locais após carregar os dados
      setEstatisticasLocais(getEstatisticas());
    };
    
    carregarDados();
  }, [carregarInventarioAtivo, carregarInventarios, carregarContagens, carregarDadosTransito, inventarioAtual]);

  // Callback para lidar com mudanças nas contagens
  const handleContagemChange = useCallback(() => {
    // Atualizar estatísticas locais
    setEstatisticasLocais(getEstatisticas());
    // Incrementar contador para forçar re-renderização
    setUpdateCounter(c => c + 1);
  }, [getEstatisticas]);

  // Registrar e limpar o listener para mudanças de contagens
  useEffect(() => {
    // Registrar o listener
    addContagemChangeListener(handleContagemChange);
    
    // Limpar o listener ao desmontar
    return () => {
      removeContagemChangeListener(handleContagemChange);
    };
  }, [addContagemChangeListener, removeContagemChangeListener, handleContagemChange]);

  // Atualizar periodicamente as estatísticas (como backup para garantir a atualização)
  useEffect(() => {
    // Atualizar a cada 5 segundos como fallback
    const intervalId = setInterval(() => {
      setEstatisticasLocais(getEstatisticas());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [getEstatisticas]);

  const handleFinalizarInventario = async () => {
    if (!inventarioAtual) {
      toast.error("Não há inventário ativo para finalizar")
      return
    }

    if (window.confirm("Tem certeza que deseja finalizar o inventário atual? Esta ação não pode ser desfeita.")) {
      try {
        await finalizarInventario()
        toast.success("Inventário finalizado com sucesso!")
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error("Erro ao finalizar inventário")
        }
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {inventarioAtual ? (
              <p className="text-muted-foreground">
                Inventário ativo: <span className="font-medium">{inventarioAtual.codigo}</span> | Responsável:{" "}
                <span className="font-medium">{inventarioAtual.responsavel}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Nenhum inventário ativo no momento</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {inventarioAtual ? (
              <Button variant="destructive" onClick={handleFinalizarInventario} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Finalizar Inventário
              </Button>
            ) : (
              <Button onClick={() => setNovoInventarioDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Inventário
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setCarregarInventarioDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Carregar Inventário
            </Button>

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
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          key={`stats-${updateCounter}`} // Forçar re-renderização quando os dados mudarem
        >
          <AnimatedCard title="Total de Lojas que já Contaram" delay={0.1}>
            <div className="flex items-center justify-center h-full">
              <ProgressRing progress={estatisticasLocais.progresso.lojas}>
                <div className="text-center">
                  <span className="text-3xl font-bold">{estatisticasLocais.totalLojasContadas}</span>
                  <p className="text-xs text-muted-foreground">de {Object.values(lojas).flat().length}</p>
                </div>
              </ProgressRing>
            </div>
          </AnimatedCard>

          <AnimatedCard title="Total de Setores do CD que já Contaram" delay={0.2}>
            <div className="flex items-center justify-center h-full">
              <ProgressRing progress={estatisticasLocais.progresso.setores}>
                <div className="text-center">
                  <span className="text-3xl font-bold">{estatisticasLocais.totalSetoresContados}</span>
                  <p className="text-xs text-muted-foreground">de {setoresCD.length}</p>
                </div>
              </ProgressRing>
            </div>
          </AnimatedCard>

          <AnimatedCard title="Lojas Pendentes" delay={0.3} className="lg:col-span-1">
            <ScrollArea className="h-[180px] pr-4">
              {Object.keys(estatisticasLocais.lojasPendentes).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Todas as lojas já realizaram a contagem!</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(estatisticasLocais.lojasPendentes).map(([regional, lojas]) => (
                    <div key={regional}>
                      <h3 className="font-medium mb-2">{regional}:</h3>
                      <ul className="space-y-1 pl-4">
                        {lojas.map((loja) => (
                          <li key={loja} className="text-sm text-muted-foreground">
                            {loja}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </AnimatedCard>
        </motion.div>

        <AnimatedCard title="Comparativo de Contagens" delay={0.4}>
          <Tabs defaultValue="setor">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="setor">Por Setor</TabsTrigger>
              <TabsTrigger value="loja">Por Loja</TabsTrigger>
              <TabsTrigger value="fornecedor">Por Fornecedor</TabsTrigger>
              <TabsTrigger value="cd">Por CD</TabsTrigger>
            </TabsList>

            <TabsContent value="setor" className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico comparativo de contagens por setor será exibido aqui</p>
            </TabsContent>

            <TabsContent value="loja" className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico comparativo de contagens por loja será exibido aqui</p>
            </TabsContent>

            <TabsContent value="fornecedor" className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico comparativo de contagens por fornecedor será exibido aqui</p>
            </TabsContent>

            <TabsContent value="cd" className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico comparativo de contagens por CD será exibido aqui</p>
            </TabsContent>
          </Tabs>
        </AnimatedCard>
      </div>

      <NovoInventarioDialog open={novoInventarioDialogOpen} onOpenChange={setNovoInventarioDialogOpen} />

      <CarregarInventarioDialog open={carregarInventarioDialogOpen} onOpenChange={setCarregarInventarioDialogOpen} />
    </div>
  )
}

// Importações locais para o componente
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"