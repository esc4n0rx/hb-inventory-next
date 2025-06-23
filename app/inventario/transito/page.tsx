// app/inventario/transito/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Edit, Plus, Search, Trash2, MoreHorizontal, Package } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TransitEditDialog } from "@/components/transit-edit-dialog"
import { TransitMultiDialog } from "@/components/transit-multi-dialog"
import { TransitStatusIndicator } from "@/components/transit-status-indicator"
import { ativos } from "@/data/ativos"
import type { DadosTransito } from "@/lib/types"

const centrosDistribuicao = [
  "CD São Paulo",
  "CD Espírito Santo", 
  "CD Rio de Janeiro",
]

export default function TransitoPage() {
  const { 
    inventarioAtual, 
    dadosTransito, 
    adicionarTransito,
    adicionarTransitoBulk,
    editarTransito,
    removerTransito,
    atualizarStatusTransito,
    carregarDadosTransito,
    isLoading 
  } = useInventarioStore()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [multiDialogOpen, setMultiDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTransit, setSelectedTransit] = useState<DadosTransito | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")

  // Carregar dados de trânsito ao montar o componente
  useEffect(() => {
    if (inventarioAtual) {
      carregarDadosTransito(inventarioAtual.id);
    }
  }, [inventarioAtual, carregarDadosTransito]);

  const [formData, setFormData] = useState({
    origem: "",
    destino: "",
    ativo: "",
    quantidade: 1,
    status: "enviado" as DadosTransito["status"],
  })

  const resetForm = () => {
    setFormData({
      origem: "",
      destino: "",
      ativo: "",
      quantidade: 1,
      status: "enviado",
    })
  }

  const handleOpenDialog = () => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar dados de trânsito")
      return
    }

    resetForm()
    setDialogOpen(true)
  }

  const handleOpenMultiDialog = () => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar dados de trânsito")
      return
    }

    setMultiDialogOpen(true)
  }

  const handleOpenEditDialog = (transito: DadosTransito) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para editar dados de trânsito")
      return
    }

    setSelectedTransit(transito)
    setEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (transito: DadosTransito) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para remover dados de trânsito")
      return
    }

    setSelectedTransit(transito)
    setDeleteDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inventarioAtual) {
      toast.error("Não há inventário ativo")
      return
    }

    if (formData.origem === formData.destino) {
      toast.error("A origem e o destino não podem ser iguais")
      return
    }

    try {
      await adicionarTransito({
        inventarioId: inventarioAtual.id,
        ...formData,
      })
      toast.success("Dados de trânsito adicionados com sucesso!")
      handleCloseDialog()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao processar dados de trânsito")
      }
    }
  }

  const handleMultiSubmit = async (dados: {
    origem: string
    destino: string
    itens: { ativo: string; quantidade: number }[]
  }) => {
    try {
      await adicionarTransitoBulk(dados)
      toast.success(`${dados.itens.length} ${dados.itens.length === 1 ? 'item adicionado' : 'itens adicionados'} ao trânsito com sucesso!`)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao processar dados de trânsito")
      }
      throw error
    }
  }

  const handleEditSubmit = async (id: string, dados: Partial<DadosTransito>) => {
    try {
      await editarTransito(id, dados)
      toast.success("Dados de trânsito atualizados com sucesso!")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao atualizar dados de trânsito")
      }
      throw error
    }
  }

  const handleDelete = async () => {
    if (!selectedTransit) return

    try {
      await removerTransito(selectedTransit.id)
      toast.success("Dados de trânsito removidos com sucesso!")
      setDeleteDialogOpen(false)
      setSelectedTransit(null)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao remover dados de trânsito")
      }
    }
  }

  const handleUpdateStatus = async (id: string, status: DadosTransito["status"]) => {
    try {
      await atualizarStatusTransito(id, status)
      toast.success("Status atualizado com sucesso!")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao atualizar status")
      }
    }
  }

  const filteredTransito = dadosTransito
    .filter(
      (transito) =>
        inventarioAtual &&
        transito.inventarioId === inventarioAtual.id &&
        (filterStatus === "todos" || transito.status === filterStatus) &&
        (transito.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transito.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transito.ativo.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime())

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dados do Trânsito</h1>
            <p className="text-muted-foreground">Gerencie os ativos em trânsito entre centros de distribuição</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleOpenDialog}
              disabled={!inventarioAtual || inventarioAtual.status !== "ativo" || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Item Único
            </Button>

            <Button
              onClick={handleOpenMultiDialog}
              disabled={!inventarioAtual || inventarioAtual.status !== "ativo" || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              Múltiplos Itens
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por origem, destino ou ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!inventarioAtual ? (
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">
              Não há inventário ativo no momento. Inicie um novo inventário para gerenciar dados de trânsito.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-40">
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status & Rota</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransito.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhum dado de trânsito encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransito.map((transito) => (
                    <TableRow key={transito.id}>
                      <TableCell className="min-w-[300px]">
                        <TransitStatusIndicator
                          status={transito.status}
                          origem={transito.origem}
                          destino={transito.destino}
                          dataEnvio={transito.dataEnvio}
                          dataRecebimento={transito.dataRecebimento}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{transito.ativo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{transito.quantidade}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transito.dataEnvio).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={!inventarioAtual || inventarioAtual.status !== "ativo"}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditDialog(transito)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(transito.id, "enviado")}
                              disabled={transito.status === "enviado"}
                            >
                              Marcar como Enviado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(transito.id, "recebido")}
                              disabled={transito.status === "recebido"}
                            >
                              Marcar como Recebido
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(transito.id, "pendente")}
                              disabled={transito.status === "pendente"}
                            >
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteDialog(transito)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog para item único */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Trânsito</DialogTitle>
            <DialogDescription>Adicione dados de ativos em trânsito entre centros de distribuição.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="origem" className="text-right">
                  Origem
                </Label>
                <Select 
                  value={formData.origem} 
                  onValueChange={(value) => setFormData({ ...formData, origem: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="origem" className="col-span-3">
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destino" className="text-right">
                  Destino
                </Label>
                <Select
                  value={formData.destino}
                  onValueChange={(value) => setFormData({ ...formData, destino: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="destino" className="col-span-3">
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ativo" className="text-right">
                  Ativo
                </Label>
                <Select
                  value={formData.ativo}
                  onValueChange={(value) => setFormData({ ...formData, ativo: value })}
                  disabled={isLoading}
                >
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
                  onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) || 1 })}
                  disabled={isLoading}
                  className="col-span-3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isLoading}>
                Cancelar
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : null}
                  Adicionar Trânsito
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para múltiplos itens */}
      <TransitMultiDialog
        open={multiDialogOpen}
        onOpenChange={setMultiDialogOpen}
        onSubmit={handleMultiSubmit}
        isLoading={isLoading}
      />

      {/* Dialog para edição */}
      <TransitEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        transitData={selectedTransit}
        onSubmit={handleEditSubmit}
        isLoading={isLoading}
      />

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de trânsito? Esta ação não pode ser desfeita.
              {selectedTransit && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Ativo:</strong> {selectedTransit.ativo}<br />
                  <strong>Rota:</strong> {selectedTransit.origem} → {selectedTransit.destino}<br />
                  <strong>Quantidade:</strong> {selectedTransit.quantidade}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}