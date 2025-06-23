// components/finalizar-inventario-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Download, FileText, AlertCircle, X, FileCheck } from "lucide-react"
import { generatePDF } from "@/lib/pdf-generator";

interface FinalizarInventarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventarioId: string
}

export function FinalizarInventarioDialog({ 
  open, 
  onOpenChange, 
  inventarioId 
}: FinalizarInventarioDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("validacoes")
  const [relatorio, setRelatorio] = useState<any>(null)
  const [aprovador, setAprovador] = useState("")
  const [relatorioGerado, setRelatorioGerado] = useState(false)
  
  const { finalizarInventario } = useInventarioStore()

  useEffect(() => {
    const gerarRelatorio = async () => {
      if (!open || !inventarioId) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/inventarios/${inventarioId}/relatorio`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error('Falha ao gerar relatório')
        }
        
        const data = await response.json()
        console.log('Dados do relatório recebidos:', data);
      
        // Usar os dados completos diretamente, aproveitando todas as estruturas possíveis
        const relatorioNormalizado = {
          ...data,
          // Usar dados do relatório completo se disponível, ou manter compatibilidade com estrutura antiga
          id: data.relatorioId || data.id,
          resumoLojas: data.relatorioCompleto?.resumo_lojas || data.resumo_lojas || {},
          resumoCds: data.relatorioCompleto?.resumo_cds || data.resumo_cds || {},
          resumoAtivos: data.relatorioCompleto?.resumo_ativos || data.resumoAtivos || data.resumo_ativos || {},
          // Valores booleanos de validação
          todasLojasTemContagem: data.validacao?.todasLojasTemContagem ?? 
                                (Object.keys(data.relatorioCompleto?.lojas_sem_contagem || {}).length === 0) ?? 
                                false,
          temFornecedor: data.validacao?.temFornecedor ?? 
                         data.relatorioCompleto?.tem_fornecedor ?? 
                         data.relatorioCompleto?.resumo_fornecedores?.tem_contagem ?? 
                         true,
          temTransito: data.validacao?.temTransito ?? 
                       data.relatorioCompleto?.tem_transito ?? 
                       data.relatorioCompleto?.resumo_transito?.tem_registros ?? 
                       false,
          lojasPendentes: data.validacao?.lojasPendentes || 
                          data.relatorioCompleto?.lojas_sem_contagem || 
                          data.lojas_sem_contagem || 
                          {}
        }
        
        console.log('Relatório normalizado:', relatorioNormalizado);

        setRelatorio(relatorioNormalizado)
        setRelatorioGerado(true)
      } catch (error) {
        toast.error('Erro ao gerar relatório de finalização')
        console.error(error)
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    gerarRelatorio()
  }, [open, inventarioId, onOpenChange])

  const handleFinalizarInventario = async () => {
    if (!relatorio || !aprovador.trim()) {
      toast.error('Informe o nome do aprovador para finalizar o inventário')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/inventarios/${inventarioId}/finalizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          relatorioId: relatorio.id,
          aprovadoPor: aprovador
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao finalizar inventário')
      }
      
      toast.success('Inventário finalizado com sucesso!')
      await finalizarInventario()
      onOpenChange(false)
    } catch (error) {
      toast.error(`Erro ao finalizar inventário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!relatorio || !relatorio.id) {
      toast.error('Relatório não disponível para download');
      return;
    }
    
    try {
      setIsLoading(true);
      // Garantir que relatorio.id existe antes de fazer a chamada
      const response = await fetch(`/api/inventarios/${inventarioId}/relatorio/pdf?relatorioId=${relatorio.id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados para o PDF');
      }
      
      const data = await response.json();
      
      // Gerar o PDF com os dados obtidos
      generatePDF(data.inventario, data.relatorio);
      toast.success('PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const getValidacaoStatus = () => {
    if (!relatorio) return { valid: false, message: 'Aguardando análise' }
    
    const { todasLojasTemContagem, temFornecedor, temTransito } = relatorio
    
    if (!todasLojasTemContagem) {
      return { 
        valid: false, 
        message: 'Existem lojas sem registro de contagem',
        lojasPendentes: relatorio.lojasPendentes
      }
    }
    
    if (!temFornecedor) {
      return { 
        valid: false, 
        message: 'Não foram encontrados registros de fornecedores',
        lojasPendentes: {}
      }
    }
    
    if (!temTransito) {
      return { 
        valid: false, 
        message: 'Não foram encontrados registros de trânsito',
        lojasPendentes: {}
      }
    }
    
    return { 
      valid: true, 
      message: 'Todas as validações foram aprovadas',
      lojasPendentes: {}
    }
  }

  const validacaoStatus = getValidacaoStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-accent" />
            Finalização de Inventário
          </DialogTitle>
          <DialogDescription>
            Relatório de finalização do inventário. Valide as informações antes de prosseguir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[calc(85vh-10rem)] overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden px-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="validacoes">Validações</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="lojas">Lojas</TabsTrigger>
              <TabsTrigger value="cds">CDs</TabsTrigger>
            </TabsList>

            <TabsContent value="validacoes" className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <Alert variant={validacaoStatus.valid ? "default" : "destructive"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Status das Validações</AlertTitle>
                      <AlertDescription>{validacaoStatus.message}</AlertDescription>
                    </Alert>

                    {validacaoStatus.lojasPendentes && Object.keys(validacaoStatus.lojasPendentes).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            Lojas sem Contagem
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {Object.entries(validacaoStatus.lojasPendentes).map(([loja, ativos]) => (
                            <div key={loja} className="p-3 border rounded-lg">
                              <div className="font-medium text-sm mb-2">{loja}</div>
                              <div className="flex flex-wrap gap-1">
                                {(ativos as string[]).map((ativo, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {ativo}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Lojas com Contagem</span>
                            <div className="flex items-center gap-2">
                              {relatorio?.todasLojasTemContagem ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <Badge variant={relatorio?.todasLojasTemContagem ? "default" : "destructive"}>
                                {relatorio?.todasLojasTemContagem ? "Completo" : "Pendente"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Registros de Fornecedor</span>
                            <div className="flex items-center gap-2">
                              {relatorio?.temFornecedor ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <Badge variant={relatorio?.temFornecedor ? "default" : "destructive"}>
                                {relatorio?.temFornecedor ? "Presente" : "Ausente"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Registros de Trânsito</span>
                            <div className="flex items-center gap-2">
                              {relatorio?.temTransito ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <Badge variant={relatorio?.temTransito ? "default" : "destructive"}>
                                {relatorio?.temTransito ? "Presente" : "Ausente"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="resumo" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {relatorio?.resumoAtivos && Object.keys(relatorio.resumoAtivos).length > 0 ? (
                    Object.entries(relatorio.resumoAtivos).map(([ativo, dados]: [string, any]) => (
                      <Card key={ativo}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{ativo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Lojas:</span>
                              <span className="ml-2 font-medium">{dados.total_lojas || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total CDs:</span>
                              <span className="ml-2 font-medium">{dados.total_cds || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fornecedor:</span>
                              <span className="ml-2 font-medium">{dados.fornecedor || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Trânsito:</span>
                              <span className="ml-2 font-medium">{dados.transito || 0}</span>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Geral:</span>
                            <span className="text-lg font-bold text-accent">
                              {(dados.total_lojas || 0) + (dados.total_cds || 0) + (dados.fornecedor || 0) + (dados.transito || 0)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum resumo disponível</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="lojas" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {relatorio?.resumoLojas && Object.keys(relatorio.resumoLojas).length > 0 ? (
                    Object.entries(relatorio.resumoLojas).map(([loja, dados]: [string, any]) => (
                      <Card key={loja}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{loja}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(dados).map(([ativo, quantidade]: [string, any]) => (
                              <div key={ativo} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{ativo}</span>
                                <span className="font-medium">{quantidade}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum dado de lojas disponível</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cds" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                  {/* Estoque */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">CD ES</h3>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Estoque</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between text-sm">
                          <span>CAIXA BIN</span>
                          <span className="font-medium">40</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CAIXA HNT G</span>
                          <span className="font-medium">37</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CAIXA HNT P</span>
                          <span className="font-medium">62</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CAIXA HB 415</span>
                          <span className="font-medium">41</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CAIXA HB 618</span>
                          <span className="font-medium">35</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CAIXA HB 623</span>
                          <span className="font-medium">20</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CAIXA BASCULHANTE</span>
                          <span className="font-medium">40</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Fornecedor</h4>
                      <div className="flex justify-between text-sm">
                        <span>CAIXA HB 623</span>
                        <span className="font-medium">50</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-3 flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="aprovador" className="text-sm font-medium">
              Nome do aprovador
            </Label>
            <Input
              id="aprovador"
              placeholder="Digite o nome do responsável pela aprovação"
              value={aprovador}
              onChange={(e) => setAprovador(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isLoading || !relatorio}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleFinalizarInventario}
              disabled={isLoading || !validacaoStatus.valid || !aprovador.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Finalizar Inventário
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}