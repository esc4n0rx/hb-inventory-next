"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Plus, Trash2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"
import { ativos } from "@/data/ativos"
import { fornecedores } from "@/data/fornecedores"

interface ItemContagem {
  id: string
  ativo: string
  quantidade: number
}

interface MultiContagemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dados: {
    tipo: "loja" | "setor" | "fornecedor"
    origem: string
    destino?: string
    responsavel: string
    itens: { ativo: string; quantidade: number }[]
  }) => Promise<void>
  isLoading?: boolean
  editingData?: {
    tipo: "loja" | "setor" | "fornecedor"
    origem: string
    destino?: string
    ativo: string
    quantidade: number
    responsavel: string
  } | null
}

export function MultiContagemDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false,
  editingData = null 
}: MultiContagemDialogProps) {
  const [formData, setFormData] = useState<{
    tipo: "loja" | "setor" | "fornecedor"
    origem: string
    destino: string
    responsavel: string
  }>({
    tipo: "loja",
    origem: "",
    destino: "",
    responsavel: "",
  })

  const [itens, setItens] = useState<ItemContagem[]>([])
  const [novoItem, setNovoItem] = useState({
    ativo: "",
    quantidade: 1
  })

  // Reset form quando o modal abrir/fechar
  useEffect(() => {
    if (open && !editingData) {
      setFormData({
        tipo: "loja",
        origem: "",
        destino: "",
        responsavel: "",
      })
      setItens([])
      setNovoItem({ ativo: "", quantidade: 1 })
    } else if (open && editingData) {
      // Preencher com dados de edição (modo single item para manter compatibilidade)
      setFormData({
        tipo: editingData.tipo,
        origem: editingData.origem,
        destino: editingData.destino || "",
        responsavel: editingData.responsavel,
      })
      setItens([{
        id: Date.now().toString(),
        ativo: editingData.ativo,
        quantidade: editingData.quantidade
      }])
    }
  }, [open, editingData])

  const getOrigensOptions = () => {
    switch (formData.tipo) {
      case "loja":
        return Object.values(lojas).flat()
      case "setor":
        return setoresCD
      case "fornecedor":
        return fornecedores.map((f) => f.nome)
      default:
        return []
    }
  }

  const getAtivosDisponiveis = () => {
    const ativosJaAdicionados = itens.map(item => item.ativo)
    return ativos.filter(ativo => !ativosJaAdicionados.includes(ativo))
  }

  const adicionarItem = () => {
    if (!novoItem.ativo) {
      toast.error("Selecione um ativo")
      return
    }

    if (novoItem.quantidade <= 0) {
      toast.error("A quantidade deve ser maior que zero")
      return
    }

    const novoItemComId: ItemContagem = {
      id: Date.now().toString(),
      ativo: novoItem.ativo,
      quantidade: novoItem.quantidade
    }

    setItens([...itens, novoItemComId])
    setNovoItem({ ativo: "", quantidade: 1 })
  }

  const removerItem = (id: string) => {
    setItens(itens.filter(item => item.id !== id))
  }

  const atualizarQuantidade = (id: string, quantidade: number) => {
    if (quantidade <= 0) return
    
    setItens(itens.map(item => 
      item.id === id ? { ...item, quantidade } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.responsavel.trim()) {
      toast.error("O nome do responsável é obrigatório")
      return
    }

    if (!formData.origem) {
      toast.error("Selecione uma origem")
      return
    }

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item")
      return
    }

    try {
      await onSubmit({
        ...formData,
        itens: itens.map(({ id, ...item }) => item)
      })
      
      onOpenChange(false)
    } catch (error) {
      // Error é tratado pelo componente pai
    }
  }

  const ativosDisponiveis = getAtivosDisponiveis()
  const podeAdicionarMais = ativosDisponiveis.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {editingData ? "Editar Contagem" : "Nova Contagem"}
          </DialogTitle>
          <DialogDescription>
            {editingData 
              ? "Edite as informações da contagem selecionada."
              : "Adicione uma ou mais contagens ao inventário atual com seleção múltipla de ativos."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Configurações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value: "loja" | "setor" | "fornecedor") => 
                    setFormData({ ...formData, tipo: value, origem: "" })
                  }
                  disabled={isLoading || editingData !== null}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="setor">Setor</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="origem">
                  {formData.tipo === "loja" ? "Loja" : formData.tipo === "setor" ? "Setor" : "Fornecedor"}
                </Label>
                <Select 
                  value={formData.origem} 
                  onValueChange={(value) => setFormData({ ...formData, origem: value })}
                  disabled={isLoading || editingData !== null}
                >
                  <SelectTrigger id="origem">
                    <SelectValue
                      placeholder={`Selecione ${formData.tipo === "loja" ? "a loja" : formData.tipo === "setor" ? "o setor" : "o fornecedor"}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getOrigensOptions().map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Seção de Adição de Itens */}
            {!editingData && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Adicionar Itens</h4>
                  <Badge variant="secondary">
                    {itens.length} item{itens.length !== 1 ? 'ns' : ''} adicionado{itens.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="novoAtivo">Ativo</Label>
                    <Select 
                      value={novoItem.ativo} 
                      onValueChange={(value) => setNovoItem({ ...novoItem, ativo: value })}
                      disabled={isLoading || !podeAdicionarMais}
                    >
                      <SelectTrigger id="novoAtivo">
                        <SelectValue placeholder="Selecione o ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ativosDisponiveis.map((ativo) => (
                          <SelectItem key={ativo} value={ativo}>
                            {ativo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="novaQuantidade">Quantidade</Label>
                    <Input
                      id="novaQuantidade"
                      type="number"
                      min="1"
                      value={novoItem.quantidade}
                      onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) || 1 })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      type="button" 
                      onClick={adicionarItem}
                      disabled={isLoading || !novoItem.ativo || !podeAdicionarMais}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {!podeAdicionarMais && itens.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Todos os ativos disponíveis foram adicionados.
                  </p>
                )}
              </div>
            )}

            {/* Lista de Itens */}
            {itens.length > 0 && (
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="text-sm font-medium">Itens da Contagem</h4>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ativo</TableHead>
                      <TableHead className="w-32">Quantidade</TableHead>
                      {!editingData && (
                        <TableHead className="w-16">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {itens.map((item) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{item.ativo}</TableCell>
                          <TableCell>
                            {editingData ? (
                              <Input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => atualizarQuantidade(item.id, Number(e.target.value) || 1)}
                                disabled={isLoading}
                                className="w-20"
                              />
                            ) : (
                              <Input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => atualizarQuantidade(item.id, Number(e.target.value) || 1)}
                                disabled={isLoading}
                                className="w-20"
                              />
                            )}
                          </TableCell>
                          {!editingData && (
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerItem(item.id)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                type="submit" 
                disabled={isLoading || itens.length === 0}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : null}
                {editingData ? "Atualizar" : `Adicionar ${itens.length} contagem${itens.length !== 1 ? 's' : ''}`}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}