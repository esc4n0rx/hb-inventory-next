"use client"

import { useState } from "react"
import { useInventarioStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Download, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ativos } from "@/data/ativos"

export default function RelatorioComparativoPage() {
  const { inventarios, contagens } = useInventarioStore()
  const [inventario1Id, setInventario1Id] = useState<string>("")
  const [inventario2Id, setInventario2Id] = useState<string>("")
  const [activeTab, setActiveTab] = useState("geral")

  const inventariosFinalizados = inventarios.filter((inv) => inv.status === "finalizado")
  const inventario1 = inventarios.find((inv) => inv.id === inventario1Id)
  const inventario2 = inventarios.find((inv) => inv.id === inventario2Id)

  // Função para obter contagens por inventário e tipo de ativo
  const getContagensPorInventarioEAtivo = (inventarioId: string) => {
    if (!inventarioId) return {}

    const contagensInventario = contagens.filter((contagem) => contagem.inventarioId === inventarioId)
    const contagensPorAtivo: Record<string, { total: number; lojas: number; setores: number; fornecedores: number }> =
      {}

    ativos.forEach((ativo) => {
      contagensPorAtivo[ativo] = { total: 0, lojas: 0, setores: 0, fornecedores: 0 }
    })

    contagensInventario.forEach((contagem) => {
      if (contagensPorAtivo[contagem.ativo]) {
        contagensPorAtivo[contagem.ativo].total += contagem.quantidade
        contagensPorAtivo[contagem.ativo][`${contagem.tipo}s` as keyof (typeof contagensPorAtivo)[string]] +=
          contagem.quantidade
      }
    })

    return contagensPorAtivo
  }

  // Obter dados para comparação
  const contagensInventario1 = getContagensPorInventarioEAtivo(inventario1Id)
  const contagensInventario2 = getContagensPorInventarioEAtivo(inventario2Id)

  // Calcular diferenças
  const diferencas = Object.keys({ ...contagensInventario1, ...contagensInventario2 }).map((ativo) => {
    const inv1 = contagensInventario1[ativo] || { total: 0, lojas: 0, setores: 0, fornecedores: 0 }
    const inv2 = contagensInventario2[ativo] || { total: 0, lojas: 0, setores: 0, fornecedores: 0 }

    return {
      ativo,
      inv1Total: inv1.total,
      inv2Total: inv2.total,
      diferenca: inv2.total - inv1.total,
      percentual: inv1.total ? ((inv2.total - inv1.total) / inv1.total) * 100 : inv2.total ? 100 : 0,
      lojasDif: inv2.lojas - inv1.lojas,
      setoresDif: inv2.setores - inv1.setores,
      fornecedoresDif: inv2.fornecedores - inv1.fornecedores,
    }
  })

  // Calcular totais
  const totais = {
    inv1: Object.values(contagensInventario1).reduce((sum, item) => sum + item.total, 0),
    inv2: Object.values(contagensInventario2).reduce((sum, item) => sum + item.total, 0),
    diferenca:
      Object.values(contagensInventario2).reduce((sum, item) => sum + item.total, 0) -
      Object.values(contagensInventario1).reduce((sum, item) => sum + item.total, 0),
  }

  const percentualTotal = totais.inv1
    ? ((totais.diferenca / totais.inv1) * 100).toFixed(1)
    : totais.inv2
      ? "100.0"
      : "0.0"

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Comparativo de Inventários</h1>
            <p className="text-muted-foreground">Compare dois inventários para analisar diferenças</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center gap-2" disabled={!inventario1Id || !inventario2Id}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" className="flex items-center gap-2" disabled={!inventario1Id || !inventario2Id}>
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2" disabled={!inventario1Id || !inventario2Id}>
              <FileText className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Inventário 1 (Base para comparação)</label>
            <Select value={inventario1Id} onValueChange={setInventario1Id}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um inventário" />
              </SelectTrigger>
              <SelectContent>
                {inventariosFinalizados.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum inventário finalizado disponível
                  </SelectItem>
                ) : (
                  inventariosFinalizados.map((inventario) => (
                    <SelectItem key={`inv1-${inventario.id}`} value={inventario.id}>
                      {inventario.codigo} - {new Date(inventario.dataInicio).toLocaleDateString("pt-BR")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Inventário 2 (Comparação)</label>
            <Select value={inventario2Id} onValueChange={setInventario2Id}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um inventário" />
              </SelectTrigger>
              <SelectContent>
                {inventariosFinalizados.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum inventário finalizado disponível
                  </SelectItem>
                ) : (
                  inventariosFinalizados
                    .filter((inv) => inv.id !== inventario1Id)
                    .map((inventario) => (
                      <SelectItem key={`inv2-${inventario.id}`} value={inventario.id}>
                        {inventario.codigo} - {new Date(inventario.dataInicio).toLocaleDateString("pt-BR")}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!inventario1Id || !inventario2Id ? (
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">
              Selecione dois inventários finalizados para visualizar o comparativo.
            </p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Comparativo</CardTitle>
                  <CardDescription>
                    Comparando {inventario1?.codigo} (
                    {new Date(inventario1?.dataInicio || "").toLocaleDateString("pt-BR")}) com {inventario2?.codigo} (
                    {new Date(inventario2?.dataInicio || "").toLocaleDateString("pt-BR")})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{inventario1?.codigo}</CardTitle>
                        <CardDescription>Inventário Base</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <span className="text-3xl font-bold">{totais.inv1}</span>
                          <p className="text-sm text-muted-foreground">ativos contabilizados</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{inventario2?.codigo}</CardTitle>
                        <CardDescription>Inventário Comparado</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <span className="text-3xl font-bold">{totais.inv2}</span>
                          <p className="text-sm text-muted-foreground">ativos contabilizados</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Diferença</CardTitle>
                        <CardDescription>Variação entre inventários</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <span
                            className={`text-3xl font-bold ${totais.diferenca > 0 ? "text-green-500" : totais.diferenca < 0 ? "text-red-500" : ""}`}
                          >
                            {totais.diferenca > 0 ? "+" : ""}
                            {totais.diferenca}
                          </span>
                          <p className="text-sm text-muted-foreground">{percentualTotal}% de variação</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento Comparativo</CardTitle>
                  <CardDescription>Análise detalhada por tipo de ativo</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="geral">Visão Geral</TabsTrigger>
                      <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="geral">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo de Ativo</TableHead>
                            <TableHead className="text-right">{inventario1?.codigo}</TableHead>
                            <TableHead className="text-right">{inventario2?.codigo}</TableHead>
                            <TableHead className="text-right">Diferença</TableHead>
                            <TableHead className="text-right">Variação %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {diferencas
                            .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca))
                            .map((item) => (
                              <TableRow key={item.ativo}>
                                <TableCell>{item.ativo}</TableCell>
                                <TableCell className="text-right">{item.inv1Total}</TableCell>
                                <TableCell className="text-right">{item.inv2Total}</TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      item.diferenca > 0 ? "text-green-500" : item.diferenca < 0 ? "text-red-500" : ""
                                    }
                                  >
                                    {item.diferenca > 0 ? "+" : ""}
                                    {item.diferenca}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      item.percentual > 0 ? "text-green-500" : item.percentual < 0 ? "text-red-500" : ""
                                    }
                                  >
                                    {item.percentual > 0 ? "+" : ""}
                                    {item.percentual.toFixed(1)}%
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          <TableRow>
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">{totais.inv1}</TableCell>
                            <TableCell className="text-right font-bold">{totais.inv2}</TableCell>
                            <TableCell className="text-right font-bold">
                              <span
                                className={
                                  totais.diferenca > 0 ? "text-green-500" : totais.diferenca < 0 ? "text-red-500" : ""
                                }
                              >
                                {totais.diferenca > 0 ? "+" : ""}
                                {totais.diferenca}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span
                                className={
                                  Number(percentualTotal) > 0
                                    ? "text-green-500"
                                    : Number(percentualTotal) < 0
                                      ? "text-red-500"
                                      : ""
                                }
                              >
                                {Number(percentualTotal) > 0 ? "+" : ""}
                                {percentualTotal}%
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="detalhado">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo de Ativo</TableHead>
                            <TableHead className="text-right">Lojas (Dif.)</TableHead>
                            <TableHead className="text-right">Setores (Dif.)</TableHead>
                            <TableHead className="text-right">Fornecedores (Dif.)</TableHead>
                            <TableHead className="text-right">Total (Dif.)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {diferencas
                            .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca))
                            .map((item) => (
                              <TableRow key={item.ativo}>
                                <TableCell>{item.ativo}</TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      item.lojasDif > 0 ? "text-green-500" : item.lojasDif < 0 ? "text-red-500" : ""
                                    }
                                  >
                                    {item.lojasDif > 0 ? "+" : ""}
                                    {item.lojasDif}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      item.setoresDif > 0 ? "text-green-500" : item.setoresDif < 0 ? "text-red-500" : ""
                                    }
                                  >
                                    {item.setoresDif > 0 ? "+" : ""}
                                    {item.setoresDif}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      item.fornecedoresDif > 0
                                        ? "text-green-500"
                                        : item.fornecedoresDif < 0
                                          ? "text-red-500"
                                          : ""
                                    }
                                  >
                                    {item.fornecedoresDif > 0 ? "+" : ""}
                                    {item.fornecedoresDif}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      item.diferenca > 0 ? "text-green-500" : item.diferenca < 0 ? "text-red-500" : ""
                                    }
                                  >
                                    {item.diferenca > 0 ? "+" : ""}
                                    {item.diferenca}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
