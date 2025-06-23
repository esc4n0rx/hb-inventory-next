"use client"

import { useState, useEffect } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Edit, Plus, Search, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MultiContagemDialog } from "@/components/multi-contagem-dialog"
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"
import { fornecedores } from "@/data/fornecedores"
import type { Contagem } from "@/lib/types"

export default function ContagensPage() {
  const { 
    inventarioAtual, 
    contagens, 
    adicionarContagem, 
    adicionarContagemBulk,
    editarContagem, 
    removerContagem,
    carregarContagens,
    isLoading
  } = useInventarioStore()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContagem, setEditingContagem] = useState<Contagem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("todos")

  // Carregar contagens ao montar o componente
  useEffect(() => {
    if (inventarioAtual) {
      carregarContagens(inventarioAtual.id);
    }
  }, [inventarioAtual, carregarContagens]);

  const handleOpenDialog = (contagem?: Contagem) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens")
      return
    }

    if (contagem) {
      setEditingContagem(contagem)
    } else {
      setEditingContagem(null)
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingContagem(null)
  }

  const handleSubmit = async (dados: {
    tipo: "loja" | "setor" | "fornecedor"
    origem: string
    destino?: string
    responsavel: string
    itens: { ativo: string; quantidade: number }[]
  }) => {
    try {
      if (editingContagem) {
        // Modo de edição (single item)
        const item = dados.itens[0]
        await editarContagem(editingContagem.id, {
          tipo: dados.tipo,
          origem: dados.origem,
          destino: dados.destino,
          ativo: item.ativo,
          quantidade: item.quantidade,
          responsavel: dados.responsavel,
        })
        toast.success("Contagem atualizada com sucesso!")
      } else {
        // Modo de criação
        if (dados.itens.length === 1) {
          // Single item - usar API normal
          const item = dados.itens[0]
          await adicionarContagem({
            inventarioId: inventarioAtual!.id,
            tipo: dados.tipo,
            origem: dados.origem,
            destino: dados.destino,
            ativo: item.ativo,
            quantidade: item.quantidade,
            responsavel: dados.responsavel,
          })
          toast.success("Contagem adicionada com sucesso!")
        } else {
          // Multiple items - usar API bulk
          await adicionarContagemBulk({
            inventarioId: inventarioAtual!.id,
            tipo: dados.tipo,
            origem: dados.origem,
            destino: dados.destino,
            responsavel: dados.responsavel,
            itens: dados.itens,
          })
          toast.success(`${dados.itens.length} contagens adicionadas com sucesso!`)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao processar contagem")
      }
      throw error // Re-throw para o modal não fechar
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta contagem?")) {
      try {
        await removerContagem(id)
        toast.success("Contagem removida com sucesso!")
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error("Erro ao remover contagem")
        }
      }
    }
  }

  const getOrigensOptions = () => {
    const allOrigens = [
      ...Object.values(lojas).flat(),
      ...setoresCD,
      ...fornecedores.map((f) => f.nome)
    ]
    return [...new Set(allOrigens)]
  }

  const filteredContagens = contagens
    .filter(
      (contagem) =>
        inventarioAtual &&
        contagem.inventarioId === inventarioAtual.id &&
        (filterTipo === "todos" || contagem.tipo === filterTipo) &&
        (contagem.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contagem.ativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contagem.responsavel.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => new Date(b.dataContagem).getTime() - new Date(a.dataContagem).getTime())

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "loja": return "Loja"
      case "setor": return "Setor"
      case "fornecedor": return "Fornecedor"
      default: return tipo
    }
  }

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "loja": return "default"
      case "setor": return "secondary"
      case "fornecedor": return "outline"
      default: return "default"
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Contagens</h1>
            <p className="text-muted-foreground">Gerencie as contagens do inventário atual</p>
          </div>

          <Button
            onClick={() => handleOpenDialog()}
            disabled={!inventarioAtual || inventarioAtual.status !== "ativo" || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Nova Contagem
          </Button>
        </div>

        {!inventarioAtual ? (
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">
              Não há inventário ativo no momento. Inicie um novo inventário para gerenciar contagens.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por origem, ativo ou responsável..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="loja">Lojas</SelectItem>
                  <SelectItem value="setor">Setores</SelectItem>
                  <SelectItem value="fornecedor">Fornecedores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContagens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterTipo !== "todos"
                          ? "Nenhuma contagem encontrada com os filtros aplicados."
                          : "Nenhuma contagem registrada ainda."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContagens.map((contagem) => (
                      <motion.tr
                        key={contagem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b"
                      >
                        <TableCell>
                          <Badge variant={getTipoBadgeVariant(contagem.tipo)}>
                            {getTipoLabel(contagem.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{contagem.origem}</TableCell>
                        <TableCell>{contagem.ativo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {contagem.quantidade}
                          </Badge>
                        </TableCell>
                        <TableCell>{contagem.responsavel}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contagem.dataContagem).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(contagem)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(contagem.id)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredContagens.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredContagens.length} contagem{filteredContagens.length !== 1 ? 's' : ''} 
                {filterTipo !== "todos" && ` do tipo ${getTipoLabel(filterTipo)}`}
              </div>
            )}
          </>
        )}
      </div>

      <MultiContagemDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        editingData={editingContagem ? {
          tipo: editingContagem.tipo,
          origem: editingContagem.origem,
          destino: editingContagem.destino,
          ativo: editingContagem.ativo,
          quantidade: editingContagem.quantidade,
          responsavel: editingContagem.responsavel,
        } : null}
      />
    </div>
  )
}