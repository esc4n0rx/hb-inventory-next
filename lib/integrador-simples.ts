// lib/integrador-simples.ts

import { toast } from "sonner";

class IntegradorSimples {
  private static instance: IntegradorSimples;
  private intervalId: NodeJS.Timeout | null = null;
  private isActive = false;

  private constructor() {}

  public static getInstance(): IntegradorSimples {
    if (!IntegradorSimples.instance) {
      IntegradorSimples.instance = new IntegradorSimples();
    }
    return IntegradorSimples.instance;
  }

  public async verificarStatus() {
    try {
      const response = await fetch('/api/integrador/status');
      if (!response.ok) throw new Error('Falha ao verificar status');
      
      const data = await response.json();
      
      // Se o status mudou, atualizar o monitoramento
      if (data.ativo !== this.isActive) {
        this.isActive = data.ativo;
        
        if (this.isActive) {
          this.iniciarMonitoramento();
        } else {
          this.pararMonitoramento();
        }
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao verificar status do integrador:', error);
      return { ativo: false };
    }
  }

  private iniciarMonitoramento() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Verificar novas contagens a cada 30 segundos
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/integrador/process', {
          method: 'POST'
        });
        
        if (!response.ok) {
          console.error('Erro ao processar contagens');
          return;
        }
        
        const data = await response.json();
        
        // Se encontrou novas contagens, mostrar notificação
        if (data.contagens && data.contagens > 0) {
          // Verificar se devemos mostrar notificações
          const statusResponse = await fetch('/api/integrador/status');
          const statusData = await statusResponse.json();
          
          if (statusData.notifyOnCapture) {
            toast.success(`${data.contagens} novas contagens importadas com sucesso!`);
          }
        }
      } catch (error) {
        console.error('Erro no monitoramento de contagens:', error);
      }
    }, 30000); // 30 segundos
  }

  private pararMonitoramento() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const integradorSimples = IntegradorSimples.getInstance();