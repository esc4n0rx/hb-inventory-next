import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Inventario, Contagem, DadosTransito } from "./types"


type ContagemChangeEvent = {
  tipo: "loja" | "setor" | "fornecedor";
  origem: string;
  ativo: string;
  quantidade: number;
}


interface InventarioStore {
  atualizarProgressoInventario: any
  inventarioAtual: Inventario | null
  inventarios: Inventario[]
  contagens: Contagem[]
  dadosTransito: DadosTransito[]
  isLoading: boolean
  error: string | null


  contagemChangeListeners: ((event: ContagemChangeEvent) => void)[]
  addContagemChangeListener: (listener: (event: ContagemChangeEvent) => void) => void
  removeContagemChangeListener: (listener: (event: ContagemChangeEvent) => void) => void

  // Carregar dados iniciais
  carregarInventarioAtivo: () => Promise<void>
  carregarInventarios: () => Promise<void>
  carregarContagens: (inventarioId?: string) => Promise<void>

  // Ações de inventário
  iniciarInventario: (responsavel: string) => Promise<void>
  finalizarInventario: () => Promise<void>
  carregarInventario: (id: string) => Promise<void>

  // Ações de contagem
  adicionarContagem: (contagem: Omit<Contagem, "id" | "dataContagem">) => Promise<void>
  editarContagem: (id: string, dados: Partial<Contagem>) => Promise<void>
  removerContagem: (id: string) => Promise<void>

  // Ações de trânsito
  adicionarTransito: (dados: Omit<DadosTransito, "id" | "dataEnvio">) => void
  atualizarStatusTransito: (id: string, status: DadosTransito["status"]) => void
  carregarDadosTransito: (inventarioId?: string) => Promise<void>

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
      isLoading: false,
      error: null,


      contagemChangeListeners: [],


      addContagemChangeListener: (listener) => {
        set((state) => ({
          contagemChangeListeners: [...state.contagemChangeListeners, listener]
        }));
      },
      
      removeContagemChangeListener: (listener) => {
        set((state) => ({
          contagemChangeListeners: state.contagemChangeListeners.filter(l => l !== listener)
        }));
      },

      carregarInventarioAtivo: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/inventarios/ativo');
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao carregar inventário ativo');
          }
          const data = await response.json();
          
          // Se não tiver inventário ativo, data será null
          set({ inventarioAtual: data });
          
          // Se houver um inventário ativo, carregar suas contagens
          if (data) {
            await get().carregarContagens(data.id);
          }
        } catch (error) {
          console.error('Erro ao carregar inventário ativo:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      atualizarProgressoInventario: async (inventarioId: string) => {
        try {
          const response = await fetch(`/api/inventarios/${inventarioId}/progresso`, {
            method: 'PATCH',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar progresso');
          }

          const inventarioAtualizado = await response.json();
          
          // Atualizar o estado local com o progresso atualizado
          set((state) => ({
            inventarioAtual: state.inventarioAtual?.id === inventarioId 
              ? { ...state.inventarioAtual, progresso: inventarioAtualizado.progresso }
              : state.inventarioAtual,
            inventarios: state.inventarios.map((inv) => 
              inv.id === inventarioId ? { ...inv, progresso: inventarioAtualizado.progresso } : inv
            ),
          }));
        } catch (error) {
          console.error('Erro ao atualizar progresso:', error);
        }
      },

      carregarInventarios: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/inventarios');
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao carregar inventários');
          }
          const data = await response.json();
          set({ inventarios: data });
        } catch (error) {
          console.error('Erro ao carregar inventários:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      carregarContagens: async (inventarioId) => {
        set({ isLoading: true, error: null });
        try {
          const idToUse = inventarioId || get().inventarioAtual?.id;
          
          if (!idToUse) {
            set({ contagens: [] });
            return;
          }
          
          const response = await fetch(`/api/contagens?inventarioId=${idToUse}`);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao carregar contagens');
          }
          const data = await response.json();
          set({ contagens: data });
        } catch (error) {
          console.error('Erro ao carregar contagens:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      iniciarInventario: async (responsavel: string) => {
        const { inventarioAtual } = get()

        if (inventarioAtual && inventarioAtual.status === "ativo") {
          throw new Error("Já existe um inventário em andamento")
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/inventarios', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ responsavel }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao iniciar inventário');
          }

          const novoInventario = await response.json();
          
          set((state) => ({
            inventarioAtual: novoInventario,
            inventarios: [...state.inventarios, novoInventario],
          }));
        } catch (error) {
          console.error('Erro ao iniciar inventário:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      finalizarInventario: async () => {
        const { inventarioAtual } = get()

        if (!inventarioAtual) {
          throw new Error("Não há inventário ativo para finalizar")
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/inventarios/${inventarioAtual.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'finalizado' }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao finalizar inventário');
          }

          const inventarioFinalizado = await response.json();
          
          set((state) => ({
            inventarioAtual: null,
            inventarios: state.inventarios.map((inv) => 
              inv.id === inventarioAtual.id ? inventarioFinalizado : inv
            ),
          }));
        } catch (error) {
          console.error('Erro ao finalizar inventário:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      carregarInventario: async (id: string) => {
        const { inventarioAtual } = get()

        if (inventarioAtual && inventarioAtual.status === "ativo") {
          throw new Error("Finalize o inventário atual antes de carregar outro")
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/inventarios/${id}`);
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao carregar inventário');
          }

          const inventario = await response.json();
          
          set({ inventarioAtual: inventario });
          
          // Carregar contagens deste inventário
          await get().carregarContagens(id);
        } catch (error) {
          console.error('Erro ao carregar inventário:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarContagem: async (dados) => {
        const { inventarioAtual } = get();

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para adicionar contagem");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/contagens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...dados,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar contagem');
          }

          const novaContagem = await response.json();
          
          set((state) => ({
            contagens: [...state.contagens, novaContagem],
          }));

          const event: ContagemChangeEvent = {
            tipo: dados.tipo,
            origem: dados.origem,
            ativo: dados.ativo,
            quantidade: dados.quantidade
          };

          get().contagemChangeListeners.forEach(listener => {
            try {
              listener(event);
            } catch (e) {
              console.error("Erro ao notificar listener:", e);
            }
          });
          
          if (inventarioAtual) {
              await get().atualizarProgressoInventario(inventarioAtual.id);
            }
          
        } catch (error) {
          console.error('Erro ao adicionar contagem:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      editarContagem: async (id, dados) => {
        const { inventarioAtual } = get();

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para editar contagem");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/contagens/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao editar contagem');
          }

          const contagemAtualizada = await response.json();
          
          set((state) => ({
            contagens: state.contagens.map((contagem) => 
              contagem.id === id ? contagemAtualizada : contagem
            ),
          }));
          
          if (inventarioAtual) {
              await get().atualizarProgressoInventario(inventarioAtual.id);
            }
          
        } catch (error) {
          console.error('Erro ao editar contagem:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removerContagem: async (id) => {
        const { inventarioAtual } = get();

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para remover contagem");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/contagens/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao remover contagem');
          }
          
          set((state) => ({
            contagens: state.contagens.filter((contagem) => contagem.id !== id),
          }));
          
          if (inventarioAtual) {
              await get().atualizarProgressoInventario(inventarioAtual.id);
            }
          
        } catch (error) {
          console.error('Erro ao remover contagem:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      carregarDadosTransito: async (inventarioId?: string) => {
        set({ isLoading: true, error: null });
        try {
          // Se não passar inventarioId, usa o inventarioAtual
          const idToUse = inventarioId || get().inventarioAtual?.id;
          
          if (!idToUse) {
            set({ dadosTransito: [] });
            return;
          }
          
          const response = await fetch(`/api/transito?inventarioId=${idToUse}`);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao carregar dados de trânsito');
          }
          const data = await response.json();
          set({ dadosTransito: data });
        } catch (error) {
          console.error('Erro ao carregar dados de trânsito:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarTransito: async (dados) => {
        const { inventarioAtual } = get();

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para adicionar dados de trânsito");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/transito', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...dados,
              inventarioId: inventarioAtual.id,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar dado de trânsito');
          }

          const novoTransito = await response.json();
          
          set((state) => ({
            dadosTransito: [...state.dadosTransito, novoTransito],
          }));
        } catch (error) {
          console.error('Erro ao adicionar dado de trânsito:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      atualizarStatusTransito: async (id, status) => {
        const { inventarioAtual } = get();

        if (!inventarioAtual || inventarioAtual.status !== "ativo") {
          throw new Error("Não há inventário ativo para atualizar status de trânsito");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/transito/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar status');
          }

          const transitoAtualizado = await response.json();
          
          set((state) => ({
            dadosTransito: state.dadosTransito.map((transito) => 
              transito.id === id ? transitoAtualizado : transito
            ),
          }));
        } catch (error) {
          console.error('Erro ao atualizar status:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getEstatisticas: () => {
        const { inventarioAtual, contagens } = get()
        
        // Código existente para cálculo de estatísticas (sem alterações)
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
      // Não persistir alguns campos que são carregados da API
      partialize: (state) => {
        const { contagemChangeListeners, ...rest } = state;
        return rest;
      },
    }
  )
)

// Importações locais para o componente
import { lojas } from "@/data/lojas"
import { setoresCD } from "@/data/setores"