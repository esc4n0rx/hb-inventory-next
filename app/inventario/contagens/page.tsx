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

  const [formData, setFormData] = useState<{
    tipo: "loja" | "setor" | "fornecedor";
    origem: string;
    destino: string;
    ativo: string;
    quantidade: number;
    responsavel: string;
    transito_ativo?: string;
    transito_quantidade?: number;
    transito_responsavel?: string;
  }>({
    tipo: "loja",
    origem: "",
    destino: "",
    ativo: "",
    quantidade: 1,
    responsavel: "",
    transito_ativo: "",
    transito_quantidade: 1,
    transito_responsavel: "",
  })

  // Carregar contagens ao montar o componente
  useEffect(() => {
    if (inventarioAtual) {
      carregarContagens(inventarioAtual.id);
    }
  }, [inventarioAtual, carregarContagens]);

  const resetForm = () => {
    setFormData({
      tipo: "loja",
      origem: "",
      destino: "",
      ativo: "",
      quantidade: 1,
      responsavel: "",
      transito_ativo: "",
      transito_quantidade: 1,
      transito_responsavel: "",
    })
    setEditingId(null)
  }

  const handleOpenDialog = (contagem?: Contagem) => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens")
      return
    }

    if (contagem) {
      setFormData({
        tipo: contagem.tipo,
        origem: contagem.origem,
        destino: contagem.destino || "",
        ativo: contagem.ativo,
        quantidade: contagem.quantidade,
        responsavel: contagem.responsavel,
        transito_ativo: contagem.transito_ativo || "",
        transito_quantidade: contagem.transito_quantidade || 1,
        transito_responsavel: contagem.transito_responsavel || "",
      })
      setEditingId(contagem.id)
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
      const {
        transito_ativo,
        transito_quantidade,
        transito_responsavel,
        ...regularFormData
      } = formData;

      let dataToSubmit: any = { ...regularFormData };

      if (
        formData.tipo === "loja" &&
        (formData.origem === "CD SP" || formData.origem === "CD ES") &&
        transito_ativo && transito_ativo.trim() !== "" // Ensure transito_ativo has a value
      ) {
        dataToSubmit = {
          ...dataToSubmit,
          transito_ativo,
          transito_quantidade,
          transito_responsavel,
        };
      } else {
        // Ensure these fields are not sent if condition is not met or transito_ativo is empty
        delete dataToSubmit.transito_ativo;
        delete dataToSubmit.transito_quantidade;
        delete dataToSubmit.transito_responsavel;
      }

      if (editingId) {
        await editarContagem(editingId, dataToSubmit);
        toast.success("Contagem atualizada com sucesso!");
      } else {
        await adicionarContagem({
          inventarioId: inventarioAtual.id,
          ...dataToSubmit,
        });
        toast.success("Contagem adicionada com sucesso!");
      }

      handleCloseDialog();
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

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Contagem" : "Nova Contagem"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Edite os detalhes da contagem selecionada."
                : "Adicione uma nova contagem ao inventário atual."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as any, origem: "" })}
                  disabled={!!editingId || isLoading}
                >
                  <SelectTrigger id="tipo" className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="setor">Setor do CD</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="origem" className="text-right">
                  {formData.tipo === "loja" ? "Loja" : formData.tipo === "setor" ? "Setor" : "Fornecedor"}
                </Label>
                <Select 
                  value={formData.origem} 
                  onValueChange={(value) => setFormData({ ...formData, origem: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="origem" className="col-span-3">
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
                <Label htmlFor="responsavel" className="text-right">
                  Responsável
                </Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do responsável pela contagem"
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>

              {formData.tipo === "loja" && (formData.origem === "CD SP" || formData.origem === "CD ES") && (
                <>
                  <div className="col-span-4 my-4 border-t pt-4">
                    <p className="text-center font-semibold text-muted-foreground">Contagem em Trânsito</p>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="transito_ativo" className="text-right">
                      Ativo Trânsito
                    </Label>
                    <Select
                      value={formData.transito_ativo}
                      onValueChange={(value) => setFormData({ ...formData, transito_ativo: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="transito_ativo" className="col-span-3">
                        <SelectValue placeholder="Selecione o ativo em trânsito" />
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
                    <Label htmlFor="transito_quantidade" className="text-right">
                      Qtd. Trânsito
                    </Label>
                    <Input
                      id="transito_quantidade"
                      type="number"
                      min="1"
                      value={formData.transito_quantidade}
                      onChange={(e) => setFormData({ ...formData, transito_quantidade: Number.parseInt(e.target.value) || 1 })}
                      className="col-span-3"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="transito_responsavel" className="text-right">
                      Resp. Trânsito
                    </Label>
                    <Input
                      id="transito_responsavel"
                      value={formData.transito_responsavel}
                      onChange={(e) => setFormData({ ...formData, transito_responsavel: e.target.value })}
                      placeholder="Responsável pelo trânsito"
                      className="col-span-3"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
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
                      {editingId ? "Salvando..." : "Adicionando..."}
                    </>
                  ) : (
                    editingId ? "Salvar Alterações" : "Adicionar Contagem"
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