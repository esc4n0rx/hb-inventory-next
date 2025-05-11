// lib/colheitacerta-integration.ts

import { Contagem } from "@/lib/types";

// Interfaces para tipagem dos dados da API
interface ContagemColheitaCerta {
  id: string;
  loja: string;
  loja_nome: string;
  email: string;
  ativo: string;
  ativo_nome: string;
  quantidade: number;
  data_registro: string;
}

interface ContagemResponse {
  success: boolean;
  count: number;
  timestamp: string;
  data: ContagemColheitaCerta[];
}

/**
 * Cliente de Integração com API do ColheitaCerta
 */
export class ColheitaCertaIntegration {
  private apiBaseUrl: string;
  private token: string;
  private lastTimestamp: Date;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private onNewData?: (contagens: Contagem[]) => void;
  private onError?: (error: Error) => void;

  /**
   * Constrói um novo cliente de integração
   * @param apiBaseUrl URL base da API
   * @param token Token de autenticação
   * @param options Opções adicionais
   */
  constructor(
    apiBaseUrl: string,
    token: string,
    options?: {
      onNewData?: (contagens: Contagem[]) => void;
      onError?: (error: Error) => void;
    }
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
    this.lastTimestamp = new Date();
    this.onNewData = options?.onNewData;
    this.onError = options?.onError;
  }

  /**
   * Consulta a API em busca de novas contagens
   * @param since Data a partir da qual buscar contagens
   * @returns Resposta da API com contagens
   */
 async fetchContagens(since: Date): Promise<ContagemResponse> {
  try {
    // Usar o endpoint de proxy que criamos no Next.js para evitar problemas de CORS
    const url = `/api/proxy?desde=${since.toISOString()}&token=${this.token}`;
    
    console.log(`Fazendo requisição para: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Resposta recebida: ${data.count} contagens`);
    return data;
  } catch (error) {
    console.error("Erro ao buscar contagens:", error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    if (this.onError) {
      this.onError(errorObj);
    }
    throw errorObj;
  }
}

  /**
   * Processa dados recebidos da API, convertendo para o formato esperado pelo sistema
   * @param response Resposta da API
   */
  private processarContagens(contagens: ContagemColheitaCerta[]): Contagem[] {
    return contagens.map(contagem => ({
      id: Math.random().toString(36).substring(2, 15),
      inventarioId: "",  // Será preenchido pelo store
      tipo: "loja",
      origem: contagem.loja_nome,
      ativo: contagem.ativo_nome,
      quantidade: contagem.quantidade,
      dataContagem: new Date().toISOString(), // Data atual
      responsavel: "integrador"
    }));
  }

  /**
   * Processa dados recebidos da API
   * @param response Resposta da API
   */
private handleResponse(response: ContagemResponse): void {
  const timestamp = new Date().toLocaleTimeString();
  
  if (response.success) {
    if (response.count > 0) {
      console.log(`[${timestamp}] Recebidas ${response.count} novas contagens`);
      
      // Se houver um callback registrado, chama-o com os dados processados
      if (this.onNewData) {
        this.onNewData(this.processarContagens(response.data));
      }
    } else {
      console.log(`[${timestamp}] Verificação realizada - nenhuma nova contagem disponível`);
    }
    
    // Atualiza o timestamp para a próxima consulta
    this.lastTimestamp = new Date(response.timestamp);
  } else {
    console.warn(`[${timestamp}] Resposta inválida da API`);
  }
}

  /**
   * Verifica uma única vez por novas contagens
   */
 async checkOnce(): Promise<void> {
  console.log(`[${new Date().toLocaleTimeString()}] Verificando novas contagens desde ${this.lastTimestamp.toLocaleTimeString()}`);
  
  try {
    const response = await this.fetchContagens(this.lastTimestamp);
    this.handleResponse(response);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Erro ao verificar contagens:`, error);
  }
}

  /**
   * Inicia o monitoramento contínuo
   * @param intervalMs Intervalo em milissegundos entre verificações
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isRunning) {
      console.warn('Monitoramento já está em execução');
      return;
    }

    this.isRunning = true;
    console.log(`Iniciando monitoramento a cada ${intervalMs / 1000} segundos...`);
    
    // Executar verificação imediatamente na inicialização
    this.checkOnce();
    
    // Configurar verificação periódica
    this.intervalId = setInterval(async () => {
      await this.checkOnce();
    }, intervalMs);
  }

  /**
   * Para o monitoramento contínuo
   */
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.warn('Monitoramento não está em execução');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    this.isRunning = false;
    console.log('Monitoramento interrompido');
  }

  /**
   * Reseta o timestamp para a data atual
   * Útil quando você deseja ignorar contagens antigas
   */
  resetTimestamp(): void {
    this.lastTimestamp = new Date();
    console.log(`Timestamp resetado para: ${this.lastTimestamp.toISOString()}`);
  }

  /**
   * Verifica se o token ainda é válido
   * @returns true se conseguir fazer uma requisição com sucesso
   */
  async isTokenValid(): Promise<boolean> {
    try {
      await this.fetchContagens(new Date(0)); // Data antiga para teste de conexão
      return true;
    } catch (error) {
      const errorMessage = String(error);
      // Verifica se o erro é específico de autenticação
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        return false;
      }
      // Para outros erros, o token pode ainda ser válido (problemas de rede, etc)
      throw error;
    }
  }

  /**
   * Verifica o status atual do monitoramento
   * @returns status atual do monitoramento
   */
    getStatus(): { running: boolean; lastUpdate: Date } {
      return {
        running: this.isRunning,
        lastUpdate: this.lastTimestamp
      };
    }
  }