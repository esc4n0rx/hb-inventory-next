"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { AlertTriangle, Plus, Loader2, TestTube, Building, Package } from "lucide-react"
import { useInventarioStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"
import { ativos } from "@/data/ativos"

export function TestesTab() {
  const { 
    inventarioAtual, 
    contagens, 
    carregarContagens,
    getEstatisticas
  } = useInventarioStore()

  const [isLoading, setIsLoading] = useState(false)
  const [tipoGeracao, setTipoGeracao] = useState<"loja" | "setor">("loja")
  const [selecionarTodos, setSelecionarTodos] = useState(true)
  const [lojaSelecionada, setLojaSelecionada] = useState("")
  const [setorSelecionado, setSetorSelecionado] = useState("")
  const [quantidadeAtivos, setQuantidadeAtivos] = useState(5)
  const [responsavel, setResponsavel] = useState("Sistema Teste")

  // Estados para exibir estatísticas
  const [lojasContadas, setLojasContadas] = useState<Set<string>>(new Set())
  const [setoresContados, setSetoresContados] = useState<Set<string>>(new Set())
  const [lojasPendentes, setLojasPendentes] = useState<string[]>([])
  const [setoresPendentes, setSetoresPendentes] = useState<string[]>([])

  // Atualizar estatísticas quando contagens mudarem
  useEffect(() => {
    if (!inventarioAtual) return

    const contagensInventario = contagens.filter(c => c.inventarioId === inventarioAtual.id)
    
    // Lojas contadas
    const lojasSet = new Set(
      contagensInventario
        .filter(c => c.tipo === "loja")
        .map(c => c.origem)
    )
    setLojasContadas(lojasSet)

    // Setores contados
    const setoresSet = new Set(
      contagensInventario
        .filter(c => c.tipo === "setor")
        .map(c => c.origem)
    )
    setSetoresContados(setoresSet)

    // Lojas pendentes
    const todasLojas = Object.values(lojas).flat()
    const lojasNaoContadas = todasLojas.filter(loja => !lojasSet.has(loja))
    setLojasPendentes(lojasNaoContadas)

    // Setores pendentes
    const setoresNaoContados = setoresCD.filter(setor => !setoresSet.has(setor))
    setSetoresPendentes(setoresNaoContados)
  }, [contagens, inventarioAtual])

  const handleGerarContagens = async () => {
    if (!inventarioAtual) {
      toast.error("Nenhum inventário ativo encontrado")
      return
    }

    setIsLoading(true)
    
    try {
      let origensParaGerar: string[] = []
      
      if (tipoGeracao === "loja") {
        if (selecionarTodos) {
          origensParaGerar = lojasPendentes
        } else if (lojaSelecionada) {
          origensParaGerar = [lojaSelecionada]
        }
      } else {
        if (selecionarTodos) {
          origensParaGerar = setoresPendentes
        } else if (setorSelecionado) {
          origensParaGerar = [setorSelecionado]
        }
      }

      if (origensParaGerar.length === 0) {
        toast.error("Nenhuma origem selecionada para gerar contagens")
        return
      }

      const response = await fetch("/api/contagens/bulk-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventarioId: inventarioAtual.id,
          tipo: tipoGeracao,
          origens: origensParaGerar,
          quantidadeAtivos,
          responsavel,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao gerar contagens")
      }

      const result = await response.json()
      
      toast.success(
        `${result.contagensGeradas} contagens de teste geradas com sucesso!`
      )

      // Recarregar contagens para atualizar a interface
      await carregarContagens(inventarioAtual.id, true)
      
    } catch (error) {
      console.error("Erro ao gerar contagens:", error)
      toast.error(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  if (!inventarioAtual) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum inventário ativo encontrado.</p>
            <p className="text-sm">Inicie um inventário para usar as funcionalidades de teste.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Aviso */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ ATENÇÃO - Funcionalidade de Teste</AlertTitle>
        <AlertDescription>
          Esta funcionalidade gera contagens fictícias que <strong>influenciam diretamente no inventário ativo</strong>. 
          Use apenas para testes em ambientes de desenvolvimento. As contagens geradas serão consideradas nos relatórios 
          e estatísticas do inventário.
        </AlertDescription>
      </Alert>

      {/* Informações do Inventário Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Inventário Ativo: {inventarioAtual.codigo}
          </CardTitle>
          <CardDescription>
            Responsável: {inventarioAtual.responsavel} | Status: {inventarioAtual.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Lojas</p>
              <p className="text-2xl font-bold text-blue-600">{lojasContadas.size}</p>
              <p className="text-xs text-muted-foreground">
                {lojasPendentes.length} pendentes
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Setores</p>
              <p className="text-2xl font-bold text-green-600">{setoresContados.size}</p>
              <p className="text-xs text-muted-foreground">
                {setoresPendentes.length} pendentes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerador de Contagens */}
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Contagens de Teste</CardTitle>
          <CardDescription>
            Gere contagens fictícias para lojas e setores que ainda não possuem contagem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tipoGeracao} onValueChange={(value) => setTipoGeracao(value as "loja" | "setor")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="loja" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Lojas ({lojasPendentes.length} pendentes)
              </TabsTrigger>
              <TabsTrigger value="setor" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Setores ({setoresPendentes.length} pendentes)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loja" className="space-y-4">
              <div className="space-y-2">
                <Label>Seleção de Lojas</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="todas-lojas"
                    name="selecao-loja"
                    checked={selecionarTodos}
                    onChange={() => setSelecionarTodos(true)}
                  />
                  <Label htmlFor="todas-lojas">
                    Todas as lojas pendentes ({lojasPendentes.length})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="loja-especifica"
                    name="selecao-loja"
                    checked={!selecionarTodos}
                    onChange={() => setSelecionarTodos(false)}
                  />
                  <Label htmlFor="loja-especifica">Loja específica</Label>
                </div>
                
                {!selecionarTodos && (
                  <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma loja pendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {lojasPendentes.map((loja) => (
                        <SelectItem key={loja} value={loja}>
                          {loja}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TabsContent>

            <TabsContent value="setor" className="space-y-4">
              <div className="space-y-2">
                <Label>Seleção de Setores</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="todos-setores"
                    name="selecao-setor"
                    checked={selecionarTodos}
                    onChange={() => setSelecionarTodos(true)}
                  />
                  <Label htmlFor="todos-setores">
                    Todos os setores pendentes ({setoresPendentes.length})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="setor-especifico"
                    name="selecao-setor"
                    checked={!selecionarTodos}
                    onChange={() => setSelecionarTodos(false)}
                  />
                  <Label htmlFor="setor-especifico">Setor específico</Label>
                </div>
                
                {!selecionarTodos && (
                  <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor pendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {setoresPendentes.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade de Ativos por Origem</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                max="20"
                value={quantidadeAtivos}
                onChange={(e) => setQuantidadeAtivos(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Número de ativos diferentes a gerar para cada origem
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={
                  isLoading || 
                  (tipoGeracao === "loja" && lojasPendentes.length === 0) ||
                  (tipoGeracao === "setor" && setoresPendentes.length === 0) ||
                  (!selecionarTodos && tipoGeracao === "loja" && !lojaSelecionada) ||
                  (!selecionarTodos && tipoGeracao === "setor" && !setorSelecionado)
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando Contagens...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Contagens de Teste
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Geração de Contagens</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a gerar contagens fictícias para{" "}
                  <strong>
                    {selecionarTodos 
                      ? `${tipoGeracao === "loja" ? lojasPendentes.length : setoresPendentes.length} ${tipoGeracao === "loja" ? "lojas" : "setores"}`
                      : `1 ${tipoGeracao}`
                    }
                  </strong>{" "}
                  com <strong>{quantidadeAtivos} ativos cada</strong>.
                  <br /><br />
                  ⚠️ Esta ação irá <strong>influenciar no inventário ativo</strong> e não pode ser desfeita facilmente.
                  Confirma a operação?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleGerarContagens}>
                  Confirmar Geração
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Lista de Pendentes */}
      {(lojasPendentes.length > 0 || setoresPendentes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Origens Pendentes</CardTitle>
            <CardDescription>
              Locais que ainda não possuem contagens no inventário atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lojas-pendentes">
              <TabsList>
                <TabsTrigger value="lojas-pendentes">
                  Lojas ({lojasPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="setores-pendentes">
                  Setores ({setoresPendentes.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="lojas-pendentes">
                <div className="flex flex-wrap gap-2">
                  {lojasPendentes.map((loja) => (
                    <Badge key={loja} variant="secondary">
                      {loja}
                    </Badge>
                  ))}
                  {lojasPendentes.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Todas as lojas já possuem contagem.
                    </p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="setores-pendentes">
                <div className="flex flex-wrap gap-2">
                  {setoresPendentes.map((setor) => (
                    <Badge key={setor} variant="secondary">
                      {setor}
                    </Badge>
                  ))}
                  {setoresPendentes.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Todos os setores já possuem contagem.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}