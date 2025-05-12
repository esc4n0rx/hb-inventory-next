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
        setRelatorio(data)
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
    if (!relatorio) return
    
    const url = `/api/inventarios/${inventarioId}/relatorio/pdf?relatorioId=${relatorio.id}`
    window.open(url, '_blank')
  }

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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-accent" />
            Finalização de Inventário
          </DialogTitle>
          <DialogDescription>
            Relatório de finalização do inventário. Valide as informações antes de prosseguir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[calc(90vh-12rem)] overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden px-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="validacoes">Validações</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="lojas">Lojas</TabsTrigger>
              <TabsTrigger value="cds">CDs</TabsTrigger>
            </TabsList>

            <TabsContent value="validacoes" className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <svg
                    className="animate-spin h-8 w-8 text-accent"
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
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  {relatorioGerado && (
                    <>
                      <Alert variant={validacaoStatus.valid ? "default" : "destructive"} className="mb-4">
                        {validacaoStatus.valid ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{validacaoStatus.valid ? "Pronto para finalizar" : "Atenção"}</AlertTitle>
                        <AlertDescription>{validacaoStatus.message}</AlertDescription>
                      </Alert>

                      <div className="space-y-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Verificação de lojas</CardTitle>
                              {relatorio?.todasLojasTemContagem ? (
                                <Badge className="bg-green-500">Aprovado</Badge>
                              ) : (
                                <Badge variant="destructive">Pendente</Badge>
                              )}
                            </div>
                            <CardDescription>Verificando se todas as lojas têm registro de contagem</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {!relatorio?.todasLojasTemContagem && (
                              <div className="border rounded-md p-4 space-y-4">
                                <h4 className="font-medium">Lojas sem contagem:</h4>
                                <ScrollArea className="h-32">
                                <div className="space-y-3">
                                    {Object.entries(relatorio?.lojasPendentes || {}).map(([regional, lojas]) => {
                                    const lojasArray = Array.isArray(lojas) ? lojas : [];
                                    
                                    return (
                                        <div key={regional}>
                                        <h5 className="font-medium text-sm">{regional}:</h5>
                                        <ul className="text-sm pl-4 pt-1 space-y-1">
                                            {lojasArray.map((loja: string) => (
                                            <li key={loja} className="text-muted-foreground flex items-center gap-2">
                                                <X className="h-3 w-3 text-destructive" />
                                                {loja}
                                            </li>
                                            ))}
                                        </ul>
                                        </div>
                                    );
                                    })}
                                </div>
                                </ScrollArea>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Verificação de fornecedores</CardTitle>
                              {relatorio?.temFornecedor ? (
                                <Badge className="bg-green-500">Aprovado</Badge>
                              ) : (
                                <Badge variant="destructive">Pendente</Badge>
                              )}
                            </div>
                            <CardDescription>Verificando se existem registros de fornecedores</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {!relatorio?.temFornecedor && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Fornecedores não registrados</AlertTitle>
                                <AlertDescription>
                                  Não foram encontrados registros de contagem para fornecedores. Adicione pelo menos um
                                  registro antes de finalizar o inventário.
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Verificação de trânsito</CardTitle>
                              {relatorio?.temTransito ? (
                                <Badge className="bg-green-500">Aprovado</Badge>
                              ) : (
                                <Badge variant="destructive">Pendente</Badge>
                              )}
                            </div>
                            <CardDescription>Verificando se existem registros de trânsito</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {!relatorio?.temTransito && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Trânsito não registrado</AlertTitle>
                                <AlertDescription>
                                  Não foram encontrados registros de trânsito. Adicione pelo menos um registro antes de
                                  finalizar o inventário.
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="resumo" className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  {relatorioGerado && relatorio?.resumoAtivos && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle>Resumo por Conjunto de Ativos</CardTitle>
                          <CardDescription>Totalização de ativos por categoria</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {Object.entries(relatorio.resumoAtivos).map(([conjunto, dados]: [string, any]) => (
                              <div key={conjunto} className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium">{conjunto}</h3>
                                  <Badge variant="outline">{dados.total} unidades</Badge>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Lojas</span>
                                    <span>{dados.lojas}</span>
                                  </div>
                                  <Progress value={(dados.lojas / dados.total) * 100} className="h-2" />

                                  <div className="flex justify-between text-sm">
                                    <span>CDs</span>
                                    <span>{dados.cds}</span>
                                  </div>
                                  <Progress value={(dados.cds / dados.total) * 100} className="h-2" />

                                  <div className="flex justify-between text-sm">
                                    <span>Fornecedores</span>
                                    <span>{dados.fornecedores}</span>
                                  </div>
                                  <Progress value={(dados.fornecedores / dados.total) * 100} className="h-2" />

                                  <div className="flex justify-between text-sm">
                                    <span>Em Trânsito</span>
                                    <span>{dados.transito}</span>
                                  </div>
                                  <Progress value={(dados.transito / dados.total) * 100} className="h-2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="lojas" className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  {relatorioGerado && relatorio?.resumo_lojas && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(relatorio.resumo_lojas).map(([loja, ativos]: [string, any]) => (
                          <Card key={loja} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">{loja}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {Object.entries(ativos).map(([ativo, quantidade]: [string, any]) => (
                                  <div key={ativo} className="flex justify-between text-sm py-1 border-b">
                                    <span className="text-muted-foreground">{ativo}</span>
                                    <span className="font-medium">{quantidade}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="cds" className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  {relatorioGerado && relatorio?.resumo_cds && (
                    <div className="space-y-6">
                      {Object.entries(relatorio.resumo_cds).map(([cd, dados]: [string, any]) => (
                        <Card key={cd}>
                          <CardHeader className="pb-3">
                            <CardTitle>{cd}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Estoque */}
                            {dados.estoque && Object.keys(dados.estoque).length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Estoque</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(dados.estoque).map(([ativo, quantidade]: [string, any]) => (
                                    <div key={ativo} className="flex justify-between text-sm py-1 border-b">
                                      <span className="text-muted-foreground">{ativo}</span>
                                      <span className="font-medium">{quantidade}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Fornecedor */}
                            {dados.fornecedor && Object.keys(dados.fornecedor).length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Fornecedor</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(dados.fornecedor).map(([ativo, quantidade]: [string, any]) => (
                                    <div key={ativo} className="flex justify-between text-sm py-1 border-b">
                                      <span className="text-muted-foreground">{ativo}</span>
                                      <span className="font-medium">{quantidade}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Trânsito */}
                            {dados.transito && Object.keys(dados.transito).length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Em Trânsito</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(dados.transito).map(([ativo, quantidade]: [string, any]) => (
                                    <div key={ativo} className="flex justify-between text-sm py-1 border-b">
                                      <span className="text-muted-foreground">{ativo}</span>
                                      <span className="font-medium">{quantidade}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        <DialogFooter className="p-6 pt-4">
          <div className="flex flex-col-reverse sm:flex-row justify-between w-full gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isLoading || !relatorioGerado}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-end w-full sm:w-auto">
              <div className="space-y-2 w-full sm:w-auto">
                <Label htmlFor="aprovador">Nome do aprovador</Label>
                <Input
                  id="aprovador"
                  value={aprovador}
                  onChange={(e) => setAprovador(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full sm:w-64"
                  disabled={isLoading}
                />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleFinalizarInventario} 
                  className="gap-2 w-full sm:w-auto"
                  disabled={isLoading || !validacaoStatus.valid || !aprovador.trim() || !relatorioGerado}
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
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      Finalizar Inventário
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}