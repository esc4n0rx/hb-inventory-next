"use client"

import { useState } from "react"
import { useInventarioStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Download, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"
import { ativos } from "@/data/ativos"

export default function RelatorioAtualPage() {
  const { inventarioAtual, contagens, getEstatisticas } = useInventarioStore()
  const [activeTab, setActiveTab] = useState("geral")
  const estatisticas = getEstatisticas()

  // Função para gerar dados de contagem por tipo de ativo
  const getContagensPorAtivo = () => {
    if (!inventarioAtual) return []

    const contagensInventario = contagens.filter((contagem) => contagem.inventarioId === inventarioAtual.id)
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

    return Object.entries(contagensPorAtivo)
      .map(([ativo, dados]) => ({ ativo, ...dados }))
      .sort((a, b) => b.total - a.total)
  }

  // Função para gerar dados de contagem por regional/loja
  const getContagensPorRegional = () => {
    if (!inventarioAtual) return []

    const contagensInventario = contagens.filter(
      (contagem) => contagem.inventarioId === inventarioAtual.id && contagem.tipo === "loja",
    )
    const contagensPorRegional: Record<string, { lojas: Record<string, number>; total: number }> = {}

    Object.entries(lojas).forEach(([regional, lojasRegional]) => {
      contagensPorRegional[regional] = { lojas: {}, total: 0 }
      lojasRegional.forEach((loja) => {
        contagensPorRegional[regional].lojas[loja] = 0
      })
    })

    contagensInventario.forEach((contagem) => {
      for (const [regional, { lojas }] of Object.entries(contagensPorRegional)) {
        if (Object.keys(lojas).includes(contagem.origem)) {
          contagensPorRegional[regional].lojas[contagem.origem] += contagem.quantidade
          contagensPorRegional[regional].total += contagem.quantidade
          break
        }
      }
    })

    return Object.entries(contagensPorRegional).map(([regional, dados]) => ({
      regional,
      ...dados,
      lojasList: Object.entries(dados.lojas).map(([loja, quantidade]) => ({ loja, quantidade })),
    }))
  }

  // Função para gerar dados de contagem por setor
  const getContagensPorSetor = () => {
    if (!inventarioAtual) return []

    const contagensInventario = contagens.filter(
      (contagem) => contagem.inventarioId === inventarioAtual.id && contagem.tipo === "setor",
    )
    const contagensPorSetor: Record<string, number> = {}

    setoresCD.forEach((setor) => {
      contagensPorSetor[setor] = 0
    })

    contagensInventario.forEach((contagem) => {
      if (contagensPorSetor[contagem.origem] !== undefined) {
        contagensPorSetor[contagem.origem] += contagem.quantidade
      }
    })

    return Object.entries(contagensPorSetor)
      .map(([setor, quantidade]) => ({ setor, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
  }

  const contagensPorAtivo = getContagensPorAtivo()
  const contagensPorRegional = getContagensPorRegional()
  const contagensPorSetor = getContagensPorSetor()

  const totalAtivos = contagensPorAtivo.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatório Comparativo Atual</h1>
            {inventarioAtual ? (
              <p className="text-muted-foreground">
                Inventário: <span className="font-medium">{inventarioAtual.codigo}</span> | Responsável:{" "}
                <span className="font-medium">{inventarioAtual.responsavel}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Nenhum inventário ativo ou carregado no momento</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {!inventarioAtual ? (
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">
              Não há inventário ativo ou carregado no momento. Inicie um novo inventário ou carregue um existente para
              visualizar o relatório.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Progresso do Inventário</CardTitle>
                    <CardDescription>Percentual de conclusão por área</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Lojas</span>
                        <span>{estatisticas.progresso.lojas}%</span>
                      </div>
                      <Progress value={estatisticas.progresso.lojas} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Setores do CD</span>
                        <span>{estatisticas.progresso.setores}%</span>
                      </div>
                      <Progress value={estatisticas.progresso.setores} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fornecedores</span>
                        <span>{estatisticas.progresso.fornecedores}%</span>
                      </div>
                      <Progress value={estatisticas.progresso.fornecedores} className="h-2" />
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
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total de Ativos</CardTitle>
                    <CardDescription>Distribuição por origem</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col justify-center h-full">
                      <div className="text-center mb-4">
                        <span className="text-4xl font-bold">{totalAtivos}</span>
                        <p className="text-sm text-muted-foreground">ativos contabilizados</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-secondary p-2 rounded-md">
                          <p className="text-xl font-bold">
                            {contagensPorAtivo.reduce((sum, item) => sum + item.lojas, 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Lojas</p>
                        </div>
                        <div className="bg-secondary p-2 rounded-md">
                          <p className="text-xl font-bold">
                            {contagensPorAtivo.reduce((sum, item) => sum + item.setores, 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Setores</p>
                        </div>
                        <div className="bg-secondary p-2 rounded-md">
                          <p className="text-xl font-bold">
                            {contagensPorAtivo.reduce((sum, item) => sum + item.fornecedores, 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Fornecedores</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Resumo por Tipo de Ativo</CardTitle>
                    <CardDescription>Top 5 ativos mais contabilizados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contagensPorAtivo.slice(0, 5).map((item, index) => (
                        <div key={item.ativo} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.ativo}</span>
                            <span className="font-medium">{item.total}</span>
                          </div>
                          <Progress value={(item.total / (contagensPorAtivo[0]?.total || 1)) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento do Inventário</CardTitle>
                  <CardDescription>Visualize os dados detalhados por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="geral">Visão Geral</TabsTrigger>
                      <TabsTrigger value="regional">Por Regional/Loja</TabsTrigger>
                      <TabsTrigger value="setor">Por Setor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="geral">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo de Ativo</TableHead>
                            <TableHead className="text-right">Lojas</TableHead>
                            <TableHead className="text-right">Setores</TableHead>
                            <TableHead className="text-right">Fornecedores</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contagensPorAtivo.map((item) => (
                            <TableRow key={item.ativo}>
                              <TableCell>{item.ativo}</TableCell>
                              <TableCell className="text-right">{item.lojas}</TableCell>
                              <TableCell className="text-right">{item.setores}</TableCell>
                              <TableCell className="text-right">{item.fornecedores}</TableCell>
                              <TableCell className="text-right font-bold">{item.total}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">
                              {contagensPorAtivo.reduce((sum, item) => sum + item.lojas, 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {contagensPorAtivo.reduce((sum, item) => sum + item.setores, 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {contagensPorAtivo.reduce((sum, item) => sum + item.fornecedores, 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {contagensPorAtivo.reduce((sum, item) => sum + item.total, 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="regional">
                      <div className="space-y-6">
                        {contagensPorRegional.map((regional) => (
                          <div key={regional.regional} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium">{regional.regional}</h3>
                              <span className="text-sm text-muted-foreground">
                                Total: <span className="font-medium">{regional.total}</span>
                              </span>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Loja</TableHead>
                                  <TableHead className="text-right">Quantidade</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {regional.lojasList.map((loja) => (
                                  <TableRow key={loja.loja}>
                                    <TableCell>{loja.loja}</TableCell>
                                    <TableCell className="text-right">{loja.quantidade}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="setor">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Setor</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">% do Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contagensPorSetor.map((setor) => {
                            const totalSetores = contagensPorSetor.reduce((sum, s) => sum + s.quantidade, 0)
                            const percentual = totalSetores
                              ? ((setor.quantidade / totalSetores) * 100).toFixed(1)
                              : "0.0"

                            return (
                              <TableRow key={setor.setor}>
                                <TableCell>{setor.setor}</TableCell>
                                <TableCell className="text-right">{setor.quantidade}</TableCell>
                                <TableCell className="text-right">{percentual}%</TableCell>
                              </TableRow>
                            )
                          })}
                          <TableRow>
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">
                              {contagensPorSetor.reduce((sum, setor) => sum + setor.quantidade, 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold">100%</TableCell>
                          </TableRow>
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
