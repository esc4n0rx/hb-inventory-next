"use client"

import type React from "react"

import { useState } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { AlertCircle, FileUp, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ativos } from "@/data/ativos"
import { setoresCD } from "@/data/setores"

interface ParsedRow {
  setor: string
  ativo: string
  quantidade: number
  isValid: boolean
  error?: string
}

export default function UploadPage() {
  const { inventarioAtual, adicionarContagem } = useInventarioStore()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [responsavel, setResponsavel] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = text.split("\n")
      const parsedRows: ParsedRow[] = []

      // Skip header row if exists
      const startRow = rows[0].toLowerCase().includes("setor") ? 1 : 0

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i].trim()
        if (!row) continue

        const columns = row.split(",").map((col) => col.trim())
        if (columns.length < 3) continue

        const setor = columns[0]
        const ativo = columns[1]
        const quantidade = Number.parseInt(columns[2], 10)

        const isValidSetor = setoresCD.includes(setor)
        const isValidAtivo = ativos.includes(ativo)
        const isValidQuantidade = !isNaN(quantidade) && quantidade > 0

        parsedRows.push({
          setor,
          ativo,
          quantidade,
          isValid: isValidSetor && isValidAtivo && isValidQuantidade,
          error: !isValidSetor
            ? "Setor inválido"
            : !isValidAtivo
              ? "Ativo inválido"
              : !isValidQuantidade
                ? "Quantidade inválida"
                : undefined,
        })
      }

      setParsedData(parsedRows)
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!inventarioAtual || inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens")
      return
    }

    if (!responsavel.trim()) {
      toast.error("O nome do responsável é obrigatório")
      return
    }

    const validRows = parsedData.filter((row) => row.isValid)
    if (validRows.length === 0) {
      toast.error("Não há dados válidos para importar")
      return
    }

    setIsUploading(true)

    try {
      // Simular um atraso para mostrar o estado de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Adicionar cada contagem
      for (const row of validRows) {
        adicionarContagem({
          inventarioId: inventarioAtual.id,
          tipo: "setor",
          origem: row.setor,
          ativo: row.ativo,
          quantidade: row.quantidade,
          responsavel,
        })
      }

      toast.success(`${validRows.length} contagens importadas com sucesso!`)
      setFile(null)
      setParsedData([])
      setResponsavel("")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao processar contagens")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const validRowsCount = parsedData.filter((row) => row.isValid).length
  const invalidRowsCount = parsedData.length - validRowsCount

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Upload de Contagem</h1>
            <p className="text-muted-foreground">Importe contagens por setor do CD via arquivo CSV</p>
          </div>
        </div>

        {!inventarioAtual || inventarioAtual.status !== "ativo" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Não há inventário ativo no momento. Inicie um novo inventário para importar contagens.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Instruções</CardTitle>
                <CardDescription>Como preparar seu arquivo CSV para upload</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O arquivo CSV deve conter as seguintes colunas na ordem especificada:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>
                    <strong>Setor</strong> - Nome do setor do CD (deve ser um dos setores cadastrados)
                  </li>
                  <li>
                    <strong>Ativo</strong> - Tipo de ativo (deve ser um dos ativos cadastrados)
                  </li>
                  <li>
                    <strong>Quantidade</strong> - Quantidade contada (número inteiro positivo)
                  </li>
                </ol>

                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-mono">Exemplo:</p>
                  <p className="text-xs font-mono">Recebimento,CAIXA HB 623,15</p>
                  <p className="text-xs font-mono">Expedição,CAIXA HNT G,8</p>
                  <p className="text-xs font-mono">Separação,CAIXA BIN,22</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Setores válidos:</p>
                  <div className="flex flex-wrap gap-1">
                    {setoresCD.map((setor) => (
                      <span key={setor} className="text-xs bg-secondary px-2 py-1 rounded-md">
                        {setor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Ativos válidos:</p>
                  <div className="flex flex-wrap gap-1">
                    {ativos.map((ativo) => (
                      <span key={ativo} className="text-xs bg-secondary px-2 py-1 rounded-md">
                        {ativo}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload de Arquivo</CardTitle>
                <CardDescription>Selecione o arquivo CSV com as contagens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <label
                    htmlFor="csv-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para selecionar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-muted-foreground">CSV (valores separados por vírgula)</p>
                    </div>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {file && (
                  <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm font-medium">Arquivo selecionado:</p>
                    <p className="text-sm text-muted-foreground">{file.name}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="responsavel" className="text-sm font-medium">
                    Responsável pela importação:
                  </label>
                  <Input
                    id="responsavel"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Digite o nome do responsável"
                    disabled={isUploading}
                  />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleUpload}
                    className="w-full"
                    disabled={
                      !file || parsedData.length === 0 || validRowsCount === 0 || !responsavel.trim() || isUploading
                    }
                  >
                    {isUploading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar Contagens
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        )}

        {parsedData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Prévia dos Dados</CardTitle>
                <CardDescription>
                  {validRowsCount} linhas válidas, {invalidRowsCount} linhas com erro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Setor</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, index) => (
                        <TableRow key={index} className={row.isValid ? "" : "bg-destructive/10"}>
                          <TableCell>{row.setor}</TableCell>
                          <TableCell>{row.ativo}</TableCell>
                          <TableCell>{row.quantidade}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <span className="text-green-500">Válido</span>
                            ) : (
                              <span className="text-destructive">{row.error}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
