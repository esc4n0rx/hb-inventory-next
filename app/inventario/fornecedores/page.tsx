"use client"

import type React from "react"

import { useState } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ativos } from "@/data/ativos"
import { fornecedores } from "@/data/fornecedores"
import type { Contagem } from "@/lib/types"

export default function FornecedoresPage() {
  const { inventarioAtual, contagens, adicionarContagem } = useInventarioStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFornecedor, setSelectedFornecedor] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    origem: "",
    ativo: "",
    quantidade: 1,
    responsavel: "",
  })

  const resetForm = () => {
    setFormData({
      origem: "",
      ativo: "",
      quantidade: 1,
      responsavel: "",
    })
  }

  const handleOpenDialog = (fornecedorNome: string) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens de fornecedores")
      return
    }

    resetForm()
    setFormData((prev) => ({ ...prev, origem: fornecedorNome }))
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inventarioAtual) {
      toast.error("Não há inventário ativo")
      return
    }

    if (!formData.responsavel.trim()) {
      toast.error("O nome do responsável é obrigatório")
      return
    }

    try {
      adicionarContagem({
        inventarioId: inventarioAtual.id,
        tipo: "fornecedor",
        ...formData,
      })
      toast.success("Contagem de fornecedor adicionada com sucesso!")
      handleCloseDialog()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao processar contagem")
      }
    }
  }

  const getContagensFornecedor = (fornecedorNome: string): Contagem[] => {
    if (!inventarioAtual) return []

    return contagens
      .filter(
        (contagem) =>
          contagem.inventarioId === inventarioAtual.id &&
          contagem.tipo === "fornecedor" &&
          contagem.origem === fornecedorNome,
      )
      .sort((a, b) => new Date(b.dataContagem).getTime() - new Date(a.dataContagem).getTime())
  }

  const filteredFornecedores = fornecedores.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">Gerencie as contagens de ativos dos fornecedores</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar fornecedores..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!inventarioAtual ? (
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">
              Não há inventário ativo no momento. Inicie um novo inventário para gerenciar contagens de fornecedores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFornecedores.map((fornecedor) => {
              const contagensFornecedor = getContagensFornecedor(fornecedor.nome)
              const totalAtivos = contagensFornecedor.reduce((sum, contagem) => sum + contagem.quantidade, 0)

              return (
                <motion.div
                  key={fornecedor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{fornecedor.nome}</CardTitle>
                      <CardDescription>{fornecedor.localizacao}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Contato:</p>
                          <p className="font-medium">{fornecedor.contato}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total de ativos:</p>
                          <p className="text-xl font-bold">{totalAtivos}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Contagens recentes</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(fornecedor.nome)}
                            disabled={inventarioAtual.status !== "ativo"}
                            className="h-8"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>

                        {contagensFornecedor.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            Nenhuma contagem registrada para este fornecedor.
                          </p>
                        ) : (
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Ativo</TableHead>
                                  <TableHead>Qtd</TableHead>
                                  <TableHead>Data</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {contagensFornecedor.slice(0, 3).map((contagem) => (
                                  <TableRow key={contagem.id}>
                                    <TableCell className="py-2">{contagem.ativo}</TableCell>
                                    <TableCell className="py-2">{contagem.quantidade}</TableCell>
                                    <TableCell className="py-2">
                                      {new Date(contagem.dataContagem).toLocaleDateString("pt-BR")}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {contagensFornecedor.length > 3 && (
                          <p className="text-xs text-right text-muted-foreground">
                            +{contagensFornecedor.length - 3} contagens adicionais
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Contagem de Fornecedor</DialogTitle>
            <DialogDescription>
              Adicione uma nova contagem de ativos para o fornecedor {formData.origem}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ativo" className="text-right">
                  Ativo
                </Label>
                <Select value={formData.ativo} onValueChange={(value) => setFormData({ ...formData, ativo: value })}>
                  <SelectTrigger id="ativo" className="col-span-3">
                    <SelectValue placeholder="Selecione o ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ativos.map((ativo) => (
                      <SelectItem key={ativo} value={ativo}>
                        {ativo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantidade" className="text-right">
                  Quantidade
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: Number.parseInt(e.target.value) || 1 })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="responsavel" className="text-right">
                  Responsável
                </Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do responsável pela contagem"
                  className="col-span-3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type="submit">Adicionar Contagem</Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
