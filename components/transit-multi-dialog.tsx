// components/transit-multi-dialog.tsx
"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Plus, Trash2, X, Truck } from "lucide-react"
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
import { ativos } from "@/data/ativos"

const centrosDistribuicao = [
  "CD São Paulo",
  "CD Espírito Santo", 
  "CD Rio de Janeiro",
]

interface ItemTransito {
  id: string
  ativo: string
  quantidade: number
}

interface TransitMultiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dados: {
    origem: string
    destino: string
    itens: { ativo: string; quantidade: number }[]
  }) => Promise<void>
  isLoading?: boolean
}

export function TransitMultiDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false 
}: TransitMultiDialogProps) {
  const [formData, setFormData] = useState({
    origem: "",
    destino: "",
  })

  const [itens, setItens] = useState<ItemTransito[]>([])
  const [novoItem, setNovoItem] = useState({
    ativo: "",
    quantidade: 1
  })

  // Reset form quando o modal abrir/fechar
  useEffect(() => {
    if (open) {
      setFormData({
        origem: "",
        destino: "",
      })
      setItens([])
      setNovoItem({ ativo: "", quantidade: 1 })
    }
  }, [open])

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

    const novoItemComId: ItemTransito = {
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

    if (!formData.origem) {
      toast.error("Selecione uma origem")
      return
    }

    if (!formData.destino) {
      toast.error("Selecione um destino")
      return
    }

    if (formData.origem === formData.destino) {
      toast.error("A origem e o destino não podem ser iguais")
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
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Novo Trânsito (Múltiplos Ativos)
          </DialogTitle>
          <DialogDescription>
            Adicione múltiplos ativos em trânsito entre centros de distribuição de uma só vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Configurações de Rota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="origem">Centro de Origem</Label>
                <Select 
                  value={formData.origem} 
                  onValueChange={(value) => setFormData({ ...formData, origem: value, destino: "" })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="origem">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDistribuicao.map((cd) => (
                      <SelectItem key={cd} value={cd}>
                        {cd}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino">Centro de Destino</Label>
                <Select
                  value={formData.destino}
                  onValueChange={(value) => setFormData({ ...formData, destino: value })}
                  disabled={isLoading || !formData.origem}
                >
                  <SelectTrigger id="destino">
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDistribuicao
                      .filter((cd) => cd !== formData.origem)
                      .map((cd) => (
                        <SelectItem key={cd} value={cd}>
                          {cd}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adicionar Novo Item */}
            {podeAdicionarMais && (
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-medium">Adicionar Ativo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="novo-ativo">Ativo</Label>
                    <Select
                      value={novoItem.ativo}
                      onValueChange={(value) => setNovoItem({ ...novoItem, ativo: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="novo-ativo">
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
                    <Label htmlFor="nova-quantidade">Quantidade</Label>
                    <Input
                      id="nova-quantidade"
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
                      disabled={isLoading || !novoItem.ativo}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Itens */}
            {itens.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Ativos Adicionados</h3>
                  <Badge variant="secondary">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
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
                            className="group"
                          >
                            <TableCell className="font-medium">{item.ativo}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => atualizarQuantidade(item.id, Number(e.target.value) || 1)}
                                disabled={isLoading}
                                className="w-20"
                              />
                            </TableCell>
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
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {!podeAdicionarMais && itens.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Todos os ativos disponíveis foram adicionados.
                </p>
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
                Adicionar {itens.length} {itens.length === 1 ? 'item' : 'itens'}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}