"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Edit, Plus, Search, Truck } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { ativos } from "@/data/ativos"
import type { DadosTransito } from "@/lib/types"

const centrosDistribuicao = [
  "CD Rio de Janeiro",
  "CD São Paulo",
  "CD Belo Horizonte",
  "CD Salvador",
  "CD Recife",
  "CD Brasília",
]

export default function TransitoPage() {
  const { 
    inventarioAtual, 
    dadosTransito, 
    adicionarTransito, 
    atualizarStatusTransito,
    carregarDadosTransito,
    isLoading 
  } = useInventarioStore()
  
  const [dialogOpen, setDialogOpen] = useState(false)
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
            <p className="text-muted-foreground">Gerencie os ativos em trânsito entre CDs</p>
          </div>

          <Button
            onClick={handleOpenDialog}
            disabled={!inventarioAtual || inventarioAtual.status !== "ativo" || isLoading}
            className="flex items-center gap-2"
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
                Carregando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Novo Trânsito
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar dados de trânsito..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
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
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransito.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Nenhum dado de trânsito encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransito.map((transito) => (
                    <TableRow key={transito.id}>
                      <TableCell>{transito.origem}</TableCell>
                      <TableCell>{transito.destino}</TableCell>
                      <TableCell>{transito.ativo}</TableCell>
                      <TableCell>{transito.quantidade}</TableCell>
                      <TableCell>{new Date(transito.dataEnvio).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transito.status === "recebido"
                              ? "default"
                              : transito.status === "enviado"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {transito.status === "recebido"
                            ? "Recebido"
                            : transito.status === "enviado"
                              ? "Enviado"
                              : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {transito.status !== "recebido" && inventarioAtual.status === "ativo" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(transito.id, "recebido")}
                              className="flex items-center gap-1"
                              disabled={isLoading}
                            >
                              <Truck className="h-3 w-3" />
                              <span>Marcar como Recebido</span>
                            </Button>
                          )}
                          {transito.status === "recebido" && inventarioAtual.status === "ativo" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(transito.id, "enviado")}
                              className="flex items-center gap-1"
                              disabled={isLoading}
                            >
                              <Edit className="h-3 w-3" />
                              <span>Marcar como Enviado</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Trânsito</DialogTitle>
            <DialogDescription>Adicione dados de ativos em trânsito entre CDs.</DialogDescription>
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
                    {centrosDistribuicao.map((cd) => (
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
                  onChange={(e) => setFormData({ ...formData, quantidade: Number.parseInt(e.target.value) || 1 })}
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as DadosTransito["status"] })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isLoading}>
                Cancelar
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type="submit" disabled={isLoading}>
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
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar Trânsito"
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
