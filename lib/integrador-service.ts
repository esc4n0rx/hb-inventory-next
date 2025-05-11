// lib/integrador-service.ts - alterações

import { toast } from "sonner";
import { useInventarioStore } from "@/lib/store";
import { ColheitaCertaIntegration } from "@/lib/colheitacerta-integration";
import { Contagem } from "@/lib/types";

class IntegradorService {
  private static instance: IntegradorService;
  private integration: ColheitaCertaIntegration | null = null;
  private isInitialized = false;
  // Propriedade para armazenar o estado atual de ativação
  private currentlyActive = false;

  private constructor() {}

  public static getInstance(): IntegradorService {
    if (!IntegradorService.instance) {
      IntegradorService.instance = new IntegradorService();
    }
    return IntegradorService.instance;
  }

  public async initialize(): Promise<void> {
    // Se já foi inicializado, não execute novamente
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log("Inicializando serviço de integrador...");
    
    // Carregar configuração do integrador do banco de dados
    try {
      const response = await fetch('/api/config/integrador');
      if (response.ok) {
        const config = await response.json();
        console.log("Configuração do integrador carregada:", config);
        
        // Atualizar o estado do store com a configuração carregada
        const store = useInventarioStore.getState();
        store.atualizarConfigIntegrador(config);
        
        // IMPORTANTE: Se o integrador estava ativo no banco, começar a integração
        if (config.ativo) {
          this.currentlyActive = true;
          console.log("Integrador estava ativo no banco, iniciando...");
          this.iniciarIntegracao();
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configuração do integrador:", error);
    }
    
    // Monitorar mudanças no estado do integrador
    useInventarioStore.subscribe((state, prevState) => {
      // Apenas executar se houve mudança de estado do integrador
      if (state.integradorAtivo !== prevState.integradorAtivo) {
        console.log("Mudança de estado do integrador detectada:", state.integradorAtivo);
        
        if (state.integradorAtivo && !this.currentlyActive) {
          // Se mudou para ativo e não estava ativo, iniciar
          this.currentlyActive = true;
          this.iniciarIntegracao();
        } else if (!state.integradorAtivo && this.currentlyActive) {
          // Se mudou para inativo e estava ativo, parar
          this.currentlyActive = false;
          this.pararIntegracao();
        }
      }
    });
  }
private iniciarIntegracao(): void {
  const store = useInventarioStore.getState();
  
  if (!store.inventarioAtual || store.inventarioAtual.status !== "ativo") {
    toast.error("Não há inventário ativo para adicionar contagens");
    useInventarioStore.getState().desativarIntegrador();
    this.currentlyActive = false;
    return;
  }
  
  // Se já existe uma integração ativa, pará-la antes de iniciar uma nova
  if (this.integration) {
    this.pararIntegracao();
  }
  
  const config = store.integradorConfig;
  console.log("Iniciando integração com configuração:", config);
  
  // Criar uma nova instância do integrador com callbacks bem definidos
  this.integration = new ColheitaCertaIntegration(
    config.apiUrl,
    config.apiKey,
    {
      onNewData: (contagens) => {
        console.log(`onNewData chamado com ${contagens.length} contagens`);
        this.handleNewContagens(contagens);
      },
      onError: (error) => {
        console.error(`onError chamado:`, error);
        this.handleIntegrationError(error);
      }
    }
  );
  
  // Iniciar monitoramento com intervalo correto
  const intervalMs = config.syncInterval * 1000;
  console.log(`Monitoramento iniciado: verificando a cada ${config.syncInterval} segundos (${intervalMs}ms)`);
  
  // Começar com um timestamp recente para evitar importar contagens antigas
  this.integration.resetTimestamp();
  
  // Iniciar o monitoramento
  this.integration.startMonitoring(intervalMs);
  
  // Atualizar último sync imediatamente para mostrar que começamos o monitoramento
  store.atualizarUltimoSync(new Date().toISOString());
  
  // Executar uma verificação imediata após um pequeno delay para garantir que tudo está configurado
  setTimeout(() => {
    this.integration?.checkOnce().catch(error => {
      console.error("Erro na verificação inicial:", error);
    });
  }, 2000);
}

  private pararIntegracao(): void {
    if (this.integration) {
      console.log("Parando integração...");
      this.integration.stopMonitoring();
      this.integration = null;
    }
  }

    private async handleNewContagens(contagens: Contagem[]): Promise<void> {
    const store = useInventarioStore.getState();
    const config = store.integradorConfig;
    const timestamp = new Date().toLocaleString();
    
    console.log(`[${timestamp}] Processando ${contagens.length} novas contagens`);
    
    if (!store.inventarioAtual || store.inventarioAtual.status !== "ativo") {
        console.error("Não há inventário ativo para importar contagens");
        return;
    }
    
    let importadosComSucesso = 0;
    let erros = 0;
    
    // Processar cada contagem recebida
    for (const contagem of contagens) {
        try {
        console.log(`Processando contagem: ${contagem.origem} - ${contagem.ativo} (${contagem.quantidade})`);
        
        if (config.autoImport) {
            await store.adicionarContagem({
            inventarioId: store.inventarioAtual.id,
            tipo: "loja",
            origem: contagem.origem,
            ativo: contagem.ativo,
            quantidade: contagem.quantidade,
            responsavel: "integrador",
            });
            importadosComSucesso++;
            console.log(`Contagem importada com sucesso: ${contagem.origem} - ${contagem.ativo}`);
        }
        
        if (config.notifyOnCapture) {
            toast.info(`Nova contagem capturada: ${contagem.origem} - ${contagem.ativo} (${contagem.quantidade})`);
        }
        } catch (error) {
        erros++;
        console.error(`Erro ao processar contagem de ${contagem.origem}:`, error);
        }
    }
    
    console.log(`Importação finalizada: ${importadosComSucesso} sucesso, ${erros} erros`);
    
    // Atualizar timestamp da última sincronização
    const novoTimestamp = new Date().toISOString();
    store.atualizarUltimoSync(novoTimestamp);
    console.log(`Última sincronização atualizada: ${novoTimestamp}`);
}

  private handleIntegrationError(error: Error): void {
    toast.error(`Erro na integração: ${error.message}`);
    console.error("Erro de integração:", error);
    
    // Apenas registrar o erro, mas NÃO desativar o integrador automaticamente
    // Isso permite que a integração continue tentando em caso de falhas temporárias
  }
  
  // Método para verificar o status atual do integrador
  public isActive(): boolean {
    return this.currentlyActive;
  }
}

export const integradorService = IntegradorService.getInstance();