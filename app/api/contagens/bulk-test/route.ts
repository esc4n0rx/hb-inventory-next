import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ativos } from '@/data/ativos';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// POST - Gerar contagens em massa para testes
export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    const { 
      inventarioId, 
      tipo, 
      origens, 
      quantidadeAtivos = 5, 
      responsavel = "Sistema Teste" 
    } = json;

    // Validação básica
    if (!inventarioId) {
      return NextResponse.json({ error: 'ID do inventário é obrigatório' }, { status: 400 });
    }
    
    if (!tipo || !['loja', 'setor'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser "loja" ou "setor"' }, { status: 400 });
    }
    
    if (!origens || !Array.isArray(origens) || origens.length === 0) {
      return NextResponse.json({ error: 'Lista de origens é obrigatória' }, { status: 400 });
    }
    
    if (quantidadeAtivos < 1 || quantidadeAtivos > 20) {
      return NextResponse.json({ error: 'Quantidade de ativos deve estar entre 1 e 20' }, { status: 400 });
    }

    // Verificar se o inventário existe e está ativo
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventarios')
      .select('id, status')
      .eq('id', inventarioId)
      .single();

    if (inventarioError) {
      return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
    }

    if (inventario.status !== 'ativo') {
      return NextResponse.json({ error: 'Só é possível gerar contagens para inventários ativos' }, { status: 400 });
    }

    // Gerar contagens para cada origem
    const contagensParaInserir = [];
    
    for (const origem of origens) {
      // Verificar se já existe contagem para esta origem
      const { data: contagemExistente } = await supabase
        .from('contagenshb')
        .select('id')
        .eq('inventario_id', inventarioId)
        .eq('tipo', tipo)
        .eq('origem', origem)
        .limit(1);

      if (contagemExistente && contagemExistente.length > 0) {
        console.log(`Pulando ${origem} - já possui contagem`);
        continue;
      }

      // Selecionar ativos aleatórios
      const ativosAleatorios = selecionarAtivosAleatorios(quantidadeAtivos);
      
      for (const ativo of ativosAleatorios) {
        // Gerar quantidade aleatória entre 1 e 50
        const quantidade = Math.floor(Math.random() * 50) + 1;
        
        contagensParaInserir.push({
          inventario_id: inventarioId,
          tipo,
          origem,
          ativo,
          quantidade,
          responsavel,
          data_contagem: new Date().toISOString(),
        });
      }
    }

    if (contagensParaInserir.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhuma contagem gerada - todas as origens já possuem contagens',
        contagensGeradas: 0 
      });
    }

    // Inserir todas as contagens de uma vez
    const { data, error } = await supabase
      .from('contagenshb')
      .insert(contagensParaInserir)
      .select();

    if (error) {
      console.error('Erro ao inserir contagens:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Contagens de teste geradas com sucesso',
      contagensGeradas: data.length,
      origensProcessadas: origens.length,
      detalhes: {
        tipo,
        responsavel,
        quantidadeAtivosPorOrigem: quantidadeAtivos
      }
    });

  } catch (error) {
    console.error('Erro no endpoint bulk-test:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: String(error)
    }, { status: 500 });
  }
}

// Função auxiliar para selecionar ativos aleatórios
function selecionarAtivosAleatorios(quantidade: number): string[] {
  const ativosDisponiveis = [...ativos];
  const ativosSelecionados: string[] = [];
  
  for (let i = 0; i < quantidade && ativosDisponiveis.length > 0; i++) {
    const indiceAleatorio = Math.floor(Math.random() * ativosDisponiveis.length);
    const ativoSelecionado = ativosDisponiveis.splice(indiceAleatorio, 1)[0];
    ativosSelecionados.push(ativoSelecionado);
  }
  
  return ativosSelecionados;
}