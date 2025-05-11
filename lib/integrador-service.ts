// Crie este arquivo em lib/integrador-service.ts

import { toast } from "sonner";
import { useInventarioStore } from "@/lib/store";
import { ColheitaCertaIntegration } from "@/lib/colheitacerta-integration";
import { Contagem } from "@/lib/types";

class IntegradorService {
  private static instance: IntegradorService;
  private integration: ColheitaCertaIntegration | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): IntegradorService {
    if (!IntegradorService.instance) {
      IntegradorService.instance = new IntegradorService();
    }
    return IntegradorService.instance;
  }

  public initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Verificar se há uma integração ativa
    const store = useInventarioStore.getState();
    if (store.integradorAtivo) {
      this.iniciarIntegracao();
    }
    
    // Escutar mudanças no estado do integrador
    useInventarioStore.subscribe((state) => {
      const ativo = state.integradorAtivo;
      if (ativo) {
        this.iniciarIntegracao();
      } else {
        this.pararIntegracao();
      }
    });
  }

  private iniciarIntegracao(): void {
    const store = useInventarioStore.getState();
    
    if (!store.inventarioAtual || store.inventarioAtual.status !== "ativo") {
      toast.error("Não há inventário ativo para adicionar contagens");
      useInventarioStore.getState().desativarIntegrador();
      return;
    }
    
    if (this.integration) {
      this.pararIntegracao();
    }
    
    const config = store.integradorConfig;
    
    this.integration = new ColheitaCertaIntegration(
      config.apiUrl,
      config.apiKey,
      {
        onNewData: this.handleNewContagens.bind(this),
        onError: this.handleIntegrationError.bind(this)
      }
    );
    
    // Iniciar monitoramento
    this.integration.startMonitoring(config.syncInterval * 1000);
    console.log(`Iniciando monitoramento a cada ${config.syncInterval} segundos...`);
  }

  private pararIntegracao(): void {
    if (this.integration) {
      this.integration.stopMonitoring();
      this.integration = null;
      console.log("Monitoramento interrompido");
    }
  }

  private handleNewContagens(contagens: Contagem[]): void {
    const store = useInventarioStore.getState();
    
    if (!store.inventarioAtual || store.inventarioAtual.status !== "ativo") {
      console.error("Não há inventário ativo para importar contagens");
      return;
    }
    
    const config = store.integradorConfig;
    
    // Processar contagens
    contagens.forEach(async (contagem) => {
      try {
        if (config.autoImport) {
          await store.adicionarContagem({
            inventarioId: store.inventarioAtual!.id,
            tipo: "loja",
            origem: contagem.origem,
            ativo: contagem.ativo,
            quantidade: contagem.quantidade,
            responsavel: "integrador",
          });
        }
        
        if (config.notifyOnCapture) {
          toast.info(`Nova contagem capturada: ${contagem.origem} - ${contagem.ativo} (${contagem.quantidade})`);
        }
        
        // Atualizar último sync
        store.atualizarUltimoSync(new Date().toISOString());
      } catch (error) {
        console.error("Erro ao processar contagem:", error);
      }
    });
  }

  private handleIntegrationError(error: Error): void {
    toast.error(`Erro na integração: ${error.message}`);
    console.error("Erro de integração:", error);
  }
}

export const integradorService = IntegradorService.getInstance();