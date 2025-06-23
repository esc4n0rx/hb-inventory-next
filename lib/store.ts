// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Inventario, Contagem, DadosTransito, ContagemBulk } from './types';
import { lojas } from '@/data/lojas';
import { setoresCD } from '@/data/setores';

type ContagemChangeEvent = {
  tipo: 'loja' | 'setor' | 'fornecedor';
  origem: string;
  ativo: string;
  quantidade: number;
};

interface IntegradorConfig {
  apiUrl: string;
  apiKey: string;
  syncInterval: number;
  autoImport: boolean;
  notifyOnCapture: boolean;
  lastSync: string | null;
}

interface Estatisticas {
  totalLojasContadas: number;
  totalSetoresContados: number;
  lojasPendentes: Record<string, string[]>;
  progresso: {
    lojas: number;
    setores: number;
    fornecedores: number;
  };
}

interface InventarioStore {
  atualizarProgressoInventario: (inventarioId: string) => Promise<void>;
  // State
  inventarioAtual: Inventario | null;
  inventarios: Inventario[];
  contagens: Contagem[];
  dadosTransito: DadosTransito[];
  isLoading: boolean;
  error: string | null;

  integradorAtivo: boolean;
  integradorConfig: IntegradorConfig;

  contagemChangeListeners: Array<(event: ContagemChangeEvent) => void>;
  addContagemChangeListener: (listener: (event: ContagemChangeEvent) => void) => void
  removeContagemChangeListener: (listener: (event: ContagemChangeEvent) => void) => void

  atualizarConfigIntegrador: (config: IntegradorConfig & { ativo: boolean }) => void;

  // Integrador actions
  ativarIntegrador: (config: Omit<IntegradorConfig, 'lastSync'>) => void;
  desativarIntegrador: () => void;
  atualizarUltimoSync: (timestamp: string) => void;

  // Carregamento inicial
  carregarInventarioAtivo: () => Promise<void>;
  carregarInventarios: () => Promise<void>;
  carregarContagens: (inventarioId?: string, forceRefresh?: boolean) => Promise<void>;
  carregarDadosTransito: (inventarioId?: string, forceRefresh?: boolean) => Promise<void>;

  // Inventário actions
  iniciarInventario: (responsavel: string) => Promise<void>;
  finalizarInventario: () => Promise<void>;
  carregarInventario: (id: string) => Promise<void>;

  // Contagem actions
  adicionarContagem: (dados: Omit<Contagem, 'id' | 'dataContagem'>) => Promise<void>;
  adicionarContagemBulk: (dados: ContagemBulk) => Promise<void>;
  editarContagem: (id: string, dados: Partial<Contagem>) => Promise<void>;
  removerContagem: (id: string) => Promise<void>;

  // Trânsito actions
  adicionarTransito: (dados: Omit<DadosTransito, 'id' | 'dataEnvio' | 'dataRecebimento'>) => Promise<void>;
  adicionarTransitoBulk: (dados: { origem: string; destino: string; itens: { ativo: string; quantidade: number }[] }) => Promise<void>;
  editarTransito: (id: string, dados: Partial<DadosTransito>) => Promise<void>;
  removerTransito: (id: string) => Promise<void>;
  atualizarStatusTransito: (id: string, status: DadosTransito['status']) => Promise<void>;

  // Estatísticas
  getEstatisticas: () => Estatisticas;
}

export const useInventarioStore = create<InventarioStore>()(
  persist(
    (set, get) => ({
      // Initial state
      inventarioAtual: null,
      inventarios: [],
      contagens: [],
      dadosTransito: [],
      isLoading: false,
      error: null,

      integradorAtivo: false,
      integradorConfig: {
        apiUrl: '',
        apiKey: '',
        syncInterval: 5,
        autoImport: false,
        notifyOnCapture: true,
        lastSync: null,
      },

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

      atualizarConfigIntegrador: (config) => {
        set({
          integradorAtivo: config.ativo,
          integradorConfig: {
            apiUrl: config.apiUrl,
            apiKey: config.apiKey,
            syncInterval: config.syncInterval,
            autoImport: config.autoImport,
            notifyOnCapture: config.notifyOnCapture,
            lastSync: config.lastSync,
          },
        });
      },

      ativarIntegrador: (config) => {
        set({
          integradorAtivo: true,
          integradorConfig: {
            ...config,
            lastSync: null,
          },
        });
      },

      desativarIntegrador: () => {
        set({
          integradorAtivo: false,
          integradorConfig: {
            apiUrl: '',
            apiKey: '',
            syncInterval: 5,
            autoImport: false,
            notifyOnCapture: true,
            lastSync: null,
          },
        });
      },

      atualizarUltimoSync: (timestamp) => {
        set((state) => ({
          integradorConfig: {
            ...state.integradorConfig,
            lastSync: timestamp,
          },
        }));
      },

      // Actions
      carregarInventarioAtivo: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/inventarios/ativo');
          if (res.ok) {
            const inventario: Inventario = await res.json();
            set({ inventarioAtual: inventario });
            await get().carregarContagens(inventario.id);
            await get().carregarDadosTransito(inventario.id);
          } else {
            set({ inventarioAtual: null });
          }
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      carregarInventarios: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/inventarios');
          if (!res.ok) {
            throw new Error('Erro ao carregar inventários');
          }
          const inventarios: Inventario[] = await res.json();
          set({ inventarios });
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      carregarContagens: async (inventarioId?: string, forceRefresh = false) => {
        const { inventarioAtual } = get();
        const targetId = inventarioId || inventarioAtual?.id;
        
        if (!targetId) return;

        if (!forceRefresh && get().contagens.length > 0) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/contagens?inventarioId=${targetId}`);
          if (!res.ok) {
            throw new Error('Erro ao carregar contagens');
          }
          const contagens: Contagem[] = await res.json();
          set({ contagens });
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      carregarDadosTransito: async (inventarioId?: string, forceRefresh = false) => {
        const { inventarioAtual } = get();
        const targetId = inventarioId || inventarioAtual?.id;
        
        if (!targetId) return;

        if (!forceRefresh && get().dadosTransito.length > 0) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/transito?inventarioId=${targetId}`);
          if (!res.ok) {
            throw new Error('Erro ao carregar dados de trânsito');
          }
          const dadosTransito: DadosTransito[] = await res.json();
          set({ dadosTransito });
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      atualizarProgressoInventario: async (inventarioId: string) => {
        try {
          const res = await fetch(`/api/inventarios/${inventarioId}/progresso`);
          if (res.ok) {
            const inventarioAtualizado: Inventario = await res.json();
            set((state) => ({
              inventarioAtual: state.inventarioAtual?.id === inventarioId ? inventarioAtualizado : state.inventarioAtual,
              inventarios: state.inventarios.map((inv) => 
                inv.id === inventarioId ? inventarioAtualizado : inv
              ),
            }));
          }
        } catch (error) {
          console.error('Erro ao atualizar progresso:', error);
        }
      },

      iniciarInventario: async (responsavel) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/inventarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responsavel }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao iniciar inventário');
          }
          const novo: Inventario = await res.json();
          set((state) => ({
            inventarioAtual: novo,
            inventarios: [...state.inventarios, novo],
            contagens: [],
            dadosTransito: [],
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      finalizarInventario: async () => {
        const { inventarioAtual } = get();
        if (!inventarioAtual) {
          throw new Error('Não há inventário ativo para finalizar');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/inventarios/${inventarioAtual.id}/finalizar`, {
            method: 'PATCH',
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao finalizar inventário');
          }
          const finalizado: Inventario = await res.json();
          set((state) => ({
            inventarioAtual: null,
            inventarios: state.inventarios.map((inv) => 
              inv.id === finalizado.id ? finalizado : inv
            ),
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      carregarInventario: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/inventarios/${id}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao carregar inventário');
          }
          const inventario: Inventario = await res.json();
          set({ inventarioAtual: inventario });
          await get().carregarContagens(id, true);
          await get().carregarDadosTransito(id, true);
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarContagem: async (dados) => {
        const { inventarioAtual, contagemChangeListeners } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para adicionar contagem');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/contagens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...dados, inventarioId: inventarioAtual.id }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao adicionar contagem');
          }
          const nova: Contagem = await res.json();
          set((state) => ({
            contagens: [...state.contagens, nova],
          }));
          
          // Disparar evento para listeners
          contagemChangeListeners.forEach(listener => {
            listener({
              tipo: dados.tipo,
              origem: dados.origem,
              ativo: dados.ativo,
              quantidade: dados.quantidade
            });
          });

          await get().atualizarProgressoInventario(inventarioAtual.id);
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarContagemBulk: async (dados) => {
        const { inventarioAtual, contagemChangeListeners } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para adicionar contagens');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/contagens/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...dados, inventarioId: inventarioAtual.id }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao adicionar contagens');
          }
          const novas: Contagem[] = await res.json();
          set((state) => ({
            contagens: [...state.contagens, ...novas],
          }));

          // Disparar eventos para listeners
          dados.itens.forEach(item => {
            contagemChangeListeners.forEach(listener => {
              listener({
                tipo: dados.tipo,
                origem: dados.origem,
                ativo: item.ativo,
                quantidade: item.quantidade
              });
            });
          });

          await get().atualizarProgressoInventario(inventarioAtual.id);
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      editarContagem: async (id, dados) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para editar contagem');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/contagens/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao editar contagem');
          }
          const atualizada: Contagem = await res.json();
          set((state) => ({
            contagens: state.contagens.map((c) => (c.id === id ? atualizada : c)),
          }));
          await get().carregarContagens(inventarioAtual.id, true);
          await get().atualizarProgressoInventario(inventarioAtual.id);
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      removerContagem: async (id) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para remover contagem');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/contagens/${id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao remover contagem');
          }
          set((state) => ({
            contagens: state.contagens.filter((c) => c.id !== id),
          }));
          await get().carregarContagens(inventarioAtual.id, true);
          await get().atualizarProgressoInventario(inventarioAtual.id);
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Trânsito actions
      adicionarTransito: async (dados) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para adicionar trânsito');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/transito', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...dados, inventarioId: inventarioAtual.id }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao adicionar trânsito');
          }
          const novo: DadosTransito = await res.json();
          set((state) => ({
            dadosTransito: [...state.dadosTransito, novo],
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarTransitoBulk: async (dados) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para adicionar trânsito');
        }
        set({ isLoading: true, error: null });
        try {
          // Adicionar múltiplos trânsitos individualmente
          const novosTransitos: DadosTransito[] = [];
          
          for (const item of dados.itens) {
            const res = await fetch('/api/transito', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inventarioId: inventarioAtual.id,
                origem: dados.origem,
                destino: dados.destino,
                ativo: item.ativo,
                quantidade: item.quantidade,
                status: 'enviado'
              }),
            });
            
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error ?? `Erro ao adicionar trânsito para ${item.ativo}`);
            }
            
            const novo: DadosTransito = await res.json();
            novosTransitos.push(novo);
          }

          set((state) => ({
            dadosTransito: [...state.dadosTransito, ...novosTransitos],
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      editarTransito: async (id, dados) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para editar trânsito');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/transito/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao editar trânsito');
          }
          const atualizado: DadosTransito = await res.json();
          set((state) => ({
            dadosTransito: state.dadosTransito.map((t) => (t.id === id ? atualizado : t)),
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      removerTransito: async (id) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para remover trânsito');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/transito/${id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao remover trânsito');
          }
          set((state) => ({
            dadosTransito: state.dadosTransito.filter((t) => t.id !== id),
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },
      
      atualizarStatusTransito: async (id, status) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para atualizar trânsito');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/transito/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao atualizar status');
          }
          const atualizado: DadosTransito = await res.json();
          set((state) => ({
            dadosTransito: state.dadosTransito.map((t) => (t.id === id ? atualizado : t)),
          }));
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
          } finally {
         set({ isLoading: false });
       }
     },

     getEstatisticas: () => {
       const { contagens } = get();
       
       // Calcular lojas únicas contadas
       const lojasContadas = new Set(
         contagens
           .filter((c) => c.tipo === 'loja')
           .map((c) => c.origem)
       );

       // Calcular setores únicos contados
       const setoresContados = new Set(
         contagens
           .filter((c) => c.tipo === 'setor')
           .map((c) => c.origem)
       );

       // Calcular lojas pendentes por responsável
       const todasAsLojas = Object.values(lojas).flat();
       const lojasPendentes: Record<string, string[]> = {};
       
       Object.entries(lojas).forEach(([responsavel, lojasResp]) => {
         const pendentes = lojasResp.filter(loja => !lojasContadas.has(loja));
         if (pendentes.length > 0) {
           lojasPendentes[responsavel] = pendentes;
         }
       });

       // Calcular progresso por tipo
       const totalLojas = todasAsLojas.length;
       const totalSetores = setoresCD.length;
       const totalFornecedores = 3; // Fixo conforme código existente

       const contagensFornecedor = contagens.filter(c => c.tipo === 'fornecedor');
       const fornecedoresContados = new Set(contagensFornecedor.map(c => c.origem)).size;

       return {
         totalLojasContadas: lojasContadas.size,
         totalSetoresContados: setoresContados.size,
         lojasPendentes,
         progresso: {
           lojas: totalLojas > 0 ? Math.round((lojasContadas.size / totalLojas) * 100) : 0,
           setores: totalSetores > 0 ? Math.round((setoresContados.size / totalSetores) * 100) : 0,
           fornecedores: totalFornecedores > 0 ? Math.round((fornecedoresContados / totalFornecedores) * 100) : 0,
         }
       };
     },
   }),
   {
     name: 'inventario-storage',
     partialize: (state) => ({ 
       integradorAtivo: state.integradorAtivo,
       integradorConfig: state.integradorConfig 
     }),
   }
 )
);