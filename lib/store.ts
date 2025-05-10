import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Inventario, Contagem, DadosTransito } from "./types"
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"

interface InventarioStore {
  inventarioAtual: Inventario | null
  inventarios: Inventario[]
  contagens: Contagem[]
  dadosTransito: DadosTransito[]

  // Ações de inventário
  iniciarInventario: (responsavel: string) => void
  finalizarInventario: () => void
  carregarInventario: (id: string) => void

  // Ações de contagem
  adicionarContagem: (contagem: Omit<Contagem, "id" | "dataContagem">) => void
  editarContagem: (id: string, dados: Partial<Contagem>) => void
  removerContagem: (id: string) => void

  // Ações de trânsito
  adicionarTransito: (dados: Omit<DadosTransito, "id" | "dataEnvio">) => void
  atualizarStatusTransito: (id: string, status: DadosTransito["status"]) => void

  // Estatísticas
  getEstatisticas: () => {
    totalLojasContadas: number
    totalSetoresContados: number
    lojasPendentes: Record<string, string[]>
    progresso: {
      lojas: number
      setores: number
      fornecedores: number
    }
  }
}

export const useInventarioStore = create<InventarioStore>()(
  persist(
    (set, get) => ({
      inventarioAtual: null,
      inventarios: [],
      contagens: [],
      dadosTransito: [],

      iniciarInventario: (responsavel: string) => {
        const { inventarioAtual } = get()

        if (inventarioAtual && inventarioAtual.status === "ativo") {
          throw new Error("Já existe um inventário em andamento")
        }

        const dataAtual = new Date()
        const mes = dataAtual.toLocaleString("pt-BR", { month: "short" }).toUpperCase()
        const ano = dataAtual.getFullYear()

        const novoInventario: Inventario = {
          id: crypto.randomUUID(),
          codigo: `INV-${mes}-${ano}`,
          dataInicio: dataAtual.toISOString(),
          dataFim: null,
          responsavel,
          status: "ativo",
          progresso: {
            lojas: 0,
            setores: 0,
            fornecedores: 0,
          },
        }

        set((state) => ({
          inventarioAtual: novoInventario,
          inventarios: [...state.inventarios, novoInventario],
        }))
      },

      finalizarInventario: () => {
        const { inventarioAtual } = get()

        if (!inventarioAtual) {
          throw new Error("Não há inventário ativo para finalizar")
        }

        const inventarioFinalizado: Inventario = {
          ...inventarioAtual,
          dataFim: new Date().toISOString(),
          status: "finalizado",
        }

        set((state) => ({
          inventarioAtual: null,
          inventarios: state.inventarios.map((inv) => (inv.id === inventarioAtual.id ? inventarioFinalizado : inv)),
        }))
      },

      carregarInventario: (id: string) => {
        const { inventarios, inventarioAtual } = get()

        if (inventarioAtual && inventarioAtual.status === "ativo") {
          throw new Error("Finalize o inventário atual antes de carregar outro")
        }

        const inventario = inventarios.find((inv) => inv.id === id)

        if (!inventario) {
          throw new Error("Inventário não encontrado")
        }

        set({ inventarioAtual: inventario })
      },

      adicionarContagem: (dados) => {
        const { inventarioAtual } = get()

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para adicionar contagem")
        }

        const novaContagem: Contagem = {
          id: crypto.randomUUID(),
          inventarioId: inventarioAtual.id,
          dataContagem: new Date().toISOString(),
          ...dados,
        }

        set((state) => ({
          contagens: [...state.contagens, novaContagem],
        }))

        // Atualizar progresso
        const estatisticas = get().getEstatisticas()
        set((state) => ({
          inventarioAtual: state.inventarioAtual
            ? {
                ...state.inventarioAtual,
                progresso: estatisticas.progresso,
              }
            : null,
          inventarios: state.inventarios.map((inv) =>
            inv.id === inventarioAtual.id
              ? {
                  ...inv,
                  progresso: estatisticas.progresso,
                }
              : inv,
          ),
        }))
      },

      editarContagem: (id, dados) => {
        const { inventarioAtual } = get()

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para editar contagem")
        }

        set((state) => ({
          contagens: state.contagens.map((contagem) => (contagem.id === id ? { ...contagem, ...dados } : contagem)),
        }))

        // Atualizar progresso
        const estatisticas = get().getEstatisticas()
        set((state) => ({
          inventarioAtual: state.inventarioAtual
            ? {
                ...state.inventarioAtual,
                progresso: estatisticas.progresso,
              }
            : null,
          inventarios: state.inventarios.map((inv) =>
            inv.id === inventarioAtual.id
              ? {
                  ...inv,
                  progresso: estatisticas.progresso,
                }
              : inv,
          ),
        }))
      },

      removerContagem: (id) => {
        const { inventarioAtual } = get()

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para remover contagem")
        }

        set((state) => ({
          contagens: state.contagens.filter((contagem) => contagem.id !== id),
        }))

        // Atualizar progresso
        const estatisticas = get().getEstatisticas()
        set((state) => ({
          inventarioAtual: state.inventarioAtual
            ? {
                ...state.inventarioAtual,
                progresso: estatisticas.progresso,
              }
            : null,
          inventarios: state.inventarios.map((inv) =>
            inv.id === inventarioAtual.id
              ? {
                  ...inv,
                  progresso: estatisticas.progresso,
                }
              : inv,
          ),
        }))
      },

      adicionarTransito: (dados) => {
        const { inventarioAtual } = get()

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para adicionar dados de trânsito")
        }

        const novoTransito: DadosTransito = {
          id: crypto.randomUUID(),
          inventarioId: inventarioAtual.id,
          dataEnvio: new Date().toISOString(),
          status: "enviado",
          ...dados,
        }

        set((state) => ({
          dadosTransito: [...state.dadosTransito, novoTransito],
        }))
      },

      atualizarStatusTransito: (id, status) => {
        set((state) => ({
          dadosTransito: state.dadosTransito.map((transito) =>
            transito.id === id
              ? {
                  ...transito,
                  status,
                  dataRecebimento: status === "recebido" ? new Date().toISOString() : transito.dataRecebimento,
                }
              : transito,
          ),
        }))
      },

      getEstatisticas: () => {
        const { inventarioAtual, contagens } = get()

        if (!inventarioAtual) {
          return {
            totalLojasContadas: 0,
            totalSetoresContados: 0,
            lojasPendentes: {},
            progresso: { lojas: 0, setores: 0, fornecedores: 0 },
          }
        }

        const contagensInventario = contagens.filter((contagem) => contagem.inventarioId === inventarioAtual.id)

        // Lojas contadas
        const lojasContadas = new Set()
        contagensInventario
          .filter((contagem) => contagem.tipo === "loja")
          .forEach((contagem) => lojasContadas.add(contagem.origem))

        // Setores contados
        const setoresContados = new Set()
        contagensInventario
          .filter((contagem) => contagem.tipo === "setor")
          .forEach((contagem) => setoresContados.add(contagem.origem))

        // Fornecedores contados
        const fornecedoresContados = new Set()
        contagensInventario
          .filter((contagem) => contagem.tipo === "fornecedor")
          .forEach((contagem) => fornecedoresContados.add(contagem.origem))

        // Lojas pendentes
        const lojasPendentes: Record<string, string[]> = {}
        Object.entries(lojas).forEach(([regional, lojasRegional]) => {
          const pendentes = lojasRegional.filter((loja) => !lojasContadas.has(loja))
          if (pendentes.length > 0) {
            lojasPendentes[regional] = pendentes
          }
        })

        // Calcular progresso
        const totalLojas = Object.values(lojas).flat().length
        const totalSetores = setoresCD.length
        const totalFornecedores = 3 // ES, SP, RIO

        const progresso = {
          lojas: Math.round((lojasContadas.size / totalLojas) * 100),
          setores: Math.round((setoresContados.size / totalSetores) * 100),
          fornecedores: Math.round((fornecedoresContados.size / totalFornecedores) * 100),
        }

        return {
          totalLojasContadas: lojasContadas.size,
          totalSetoresContados: setoresContados.size,
          lojasPendentes,
          progresso,
        }
      },
    }),
    {
      name: "hb-inventory-storage",
    },
  ),
)
