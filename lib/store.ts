import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Inventario, Contagem, DadosTransito } from './types';
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
  atualizarProgressoInventario: any;
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
  carregarContagens: (inventarioId?: string) => Promise<void>;
  carregarDadosTransito: (inventarioId?: string) => Promise<void>;

  // Inventário actions
  iniciarInventario: (responsavel: string) => Promise<void>;
  finalizarInventario: () => Promise<void>;
  carregarInventario: (id: string) => Promise<void>;

  // Contagem actions
  adicionarContagem: (contagem: Omit<Contagem, 'id' | 'dataContagem'>) => Promise<void>;
  editarContagem: (id: string, dados: Partial<Contagem>) => Promise<void>;
  removerContagem: (id: string) => Promise<void>;

  // Trânsito actions
  adicionarTransito: (dados: Omit<DadosTransito, 'id' | 'dataEnvio'>) => Promise<void>;
  atualizarStatusTransito: (id: string, status: DadosTransito['status']) => Promise<void>;

  // Estatísticas
  getEstatisticas: () => Estatisticas;
}

export const useInventarioStore = create<InventarioStore>()(
  persist(
    (set, get) => ({
      // State
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
        syncInterval: 30,
        autoImport: true,
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
          }
        });
      },

      // Modificar a função ativarIntegrador existente
      ativarIntegrador: async (config) => {
        const completeConfig = {
          ativo: true,
          ...config,
          lastSync: new Date().toISOString(),
        };
        
        // Salvar no banco de dados primeiro
        try {
          const response = await fetch('/api/config/integrador', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(completeConfig),
          });
          
          if (!response.ok) {
            throw new Error('Falha ao salvar configuração do integrador');
          }
          
          console.log("Configuração salva no banco com sucesso:", completeConfig);
          
          // Depois atualizar o estado local
          set({
            integradorAtivo: true,
            integradorConfig: {
              apiUrl: config.apiUrl,
              apiKey: config.apiKey,
              syncInterval: config.syncInterval,
              autoImport: config.autoImport,
              notifyOnCapture: config.notifyOnCapture,
              lastSync: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error("Erro ao salvar configuração do integrador:", error);
          throw error;
        }
      },

      desativarIntegrador: async () => {
        const config = get().integradorConfig;
        const completeConfig = {
          ativo: false,
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          syncInterval: config.syncInterval,
          autoImport: config.autoImport,
          notifyOnCapture: config.notifyOnCapture,
          lastSync: config.lastSync,
        };
        
        // Salvar no banco de dados primeiro
        try {
          const response = await fetch('/api/config/integrador', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(completeConfig),
          });
          
          if (!response.ok) {
            throw new Error('Falha ao salvar configuração do integrador');
          }
          
          console.log("Desativação salva no banco com sucesso");
          
          // Depois atualizar o estado local
          set({ integradorAtivo: false });
        } catch (error) {
          console.error("Erro ao salvar configuração do integrador:", error);
          throw error;
        }
      },
      atualizarUltimoSync: async (timestamp) => {
        const config = get().integradorConfig;
        const integradorAtivo = get().integradorAtivo;
        
        const completeConfig = {
          ativo: integradorAtivo,
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          syncInterval: config.syncInterval,
          autoImport: config.autoImport,
          notifyOnCapture: config.notifyOnCapture,
          lastSync: timestamp,
        };
        
        // Atualizar no banco de dados
        try {
          await fetch('/api/config/integrador', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(completeConfig),
          });
        } catch (error) {
          console.error("Erro ao atualizar último sync:", error);
        }
        
        // Atualizar estado local
        set((state) => ({
          integradorConfig: {
            ...state.integradorConfig,
            lastSync: timestamp,
          },
        }));
      },

      // Carregamento inicial
      carregarInventarioAtivo: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/inventarios/ativo');
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao carregar inventário ativo');
          }
          const data: Inventario | null = await res.json();
          set({ inventarioAtual: data });
          if (data) {
            await get().carregarContagens(data.id);
          }
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
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
          const res = await fetch('/api/inventarios');
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao carregar inventários');
          }
          const data: Inventario[] = await res.json();
          set({ inventarios: data });
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },
      carregarContagens: async (inventarioId) => {
        set({ isLoading: true, error: null });
        try {
          const idToUse = inventarioId ?? get().inventarioAtual?.id;
          if (!idToUse) {
            set({ contagens: [] });
            return;
          }
          const res = await fetch(`/api/contagens?inventarioId=${idToUse}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao carregar contagens');
          }
          const data: Contagem[] = await res.json();
          set({ contagens: data });
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },
      carregarDadosTransito: async (inventarioId) => {
        set({ isLoading: true, error: null });
        try {
          const idToUse = inventarioId ?? get().inventarioAtual?.id;
          if (!idToUse) {
            set({ dadosTransito: [] });
            return;
          }
          const res = await fetch(`/api/transito?inventarioId=${idToUse}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao carregar dados de trânsito');
          }
          const data: DadosTransito[] = await res.json();
          set({ dadosTransito: data });
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Inventário actions
      iniciarInventario: async (responsavel) => {
        const { inventarioAtual } = get();
        if (inventarioAtual?.status === 'ativo') {
          throw new Error('Já existe um inventário em andamento');
        }
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
          const res = await fetch(`/api/inventarios/${inventarioAtual.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'finalizado' }),
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
        const { inventarioAtual } = get();
        if (inventarioAtual?.status === 'ativo') {
          throw new Error('Finalize o inventário atual antes de carregar outro');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/inventarios/${id}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao carregar inventário');
          }
          const inv: Inventario = await res.json();
          set({ inventarioAtual: inv });
          await get().carregarContagens(id);
        } catch (err: any) {
          console.error(err);
          set({ error: err.message ?? 'Erro desconhecido' });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Contagem actions
      adicionarContagem: async (dados) => {
        const { inventarioAtual } = get();
        if (!inventarioAtual || inventarioAtual.status !== 'ativo') {
          throw new Error('Não há inventário ativo para adicionar contagem');
        }
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/contagens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? 'Erro ao adicionar contagem');
          }
          const nova: Contagem = await res.json();
          set((state) => ({ contagens: [...state.contagens, nova] }));
          const event: ContagemChangeEvent = {
            tipo: dados.tipo,
            origem: dados.origem,
            ativo: dados.ativo,
            quantidade: dados.quantidade,
          };
          get().contagemChangeListeners.forEach((fn) => {
            try {
              fn(event);
            } catch (e) {
              console.error('Erro em listener:', e);
            }
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
          const updated: Contagem = await res.json();
          set((state) => ({
            contagens: state.contagens.map((c) =>
              c.id === id ? updated : c
            ),
          }));
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
            throw new Error(err.error ?? 'Erro ao atualizar trânsito');
          }
          const updated: DadosTransito = await res.json();
          set((state) => ({
            dadosTransito: state.dadosTransito.map((t) =>
              t.id === id ? updated : t
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

      // Estatísticas
      getEstatisticas: () => {
        const { inventarioAtual, contagens } = get();
        if (!inventarioAtual) {
          return {
            totalLojasContadas: 0,
            totalSetoresContados: 0,
            lojasPendentes: {},
            progresso: { lojas: 0, setores: 0, fornecedores: 0 },
          };
        }
        const todas = contagens.filter((c) => c.inventarioId === inventarioAtual.id);
        const lojasContadas = new Set(
          todas.filter((c) => c.tipo === 'loja').map((c) => c.origem)
        );
        const setoresContados = new Set(
          todas.filter((c) => c.tipo === 'setor').map((c) => c.origem)
        );
        const fornecedoresContados = new Set(
          todas.filter((c) => c.tipo === 'fornecedor').map((c) => c.origem)
        );
        const lojasPendentes: Record<string, string[]> = {};
        Object.entries(lojas).forEach(([regional, lst]) => {
          const pend = lst.filter((l) => !lojasContadas.has(l));
          if (pend.length) lojasPendentes[regional] = pend;
        });
        const totalLojas = Object.values(lojas).flat().length;
        const totalSetores = setoresCD.length;
        const totalFornecedores = 3;

        return {
          totalLojasContadas: lojasContadas.size,
          totalSetoresContados: setoresContados.size,
          lojasPendentes,
          progresso: {
            lojas: Math.round((lojasContadas.size / totalLojas) * 100),
            setores: Math.round((setoresContados.size / totalSetores) * 100),
            fornecedores: Math.round((fornecedoresContados.size / totalFornecedores) * 100),
          },
        };
      },
    }),
    {
      name: 'hb-inventory-storage',
      partialize: (state) => {
        const { contagemChangeListeners, ...rest } = state;
        return rest;
      },
    }
  )
);
