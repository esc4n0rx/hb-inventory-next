// app/api/inventarios/[id]/relatorio/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lojas } from '@/data/lojas';
import { ativos } from '@/data/ativos';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Verificar se o inventário existe
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('*')
    .eq('id', id)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  // Buscar todas as contagens deste inventário
  const { data: contagens, error: contagensError } = await supabase
    .from('contagenshb')
    .select('*')
    .eq('inventario_id', id);

  if (contagensError) {
    return NextResponse.json({ error: contagensError.message }, { status: 400 });
  }

  // Buscar dados de trânsito deste inventário
  const { data: dadosTransito, error: transitoError } = await supabase
    .from('dados_transito')
    .select('*')
    .eq('inventario_id', id);

  if (transitoError) {
    return NextResponse.json({ error: transitoError.message }, { status: 400 });
  }

  // 1. Validar se todas as lojas têm registro de contagem
  const lojasPendentes: { [key: string]: string[] } = {};
  const lojasContadas = new Set(
    contagens.filter(c => c.tipo === 'loja').map(c => c.origem)
  );
  
  let todasLojasTemContagem = true;
  Object.entries(lojas).forEach(([regional, lstLojas]) => {
    const lojasPend = lstLojas.filter(l => !lojasContadas.has(l));
    if (lojasPend.length) {
      lojasPendentes[regional] = lojasPend;
      todasLojasTemContagem = false;
    }
  });

  // 2. Validar se tem registro de fornecedor na tabela de contagens
  const temFornecedor = contagens.some(c => c.tipo === 'fornecedor');

  // 3. Validar se temos dados de trânsito na tabela de trânsito
  const temTransito = dadosTransito.length > 0;

  // Gerar resumo por lojas
  const resumoLojas: { [loja: string]: { [ativo: string]: number } } = {};
  contagens
    .filter(c => c.tipo === 'loja')
    .forEach(c => {
      if (!resumoLojas[c.origem]) {
        resumoLojas[c.origem] = {};
      }
      
      if (!resumoLojas[c.origem][c.ativo]) {
        resumoLojas[c.origem][c.ativo] = 0;
      }
      
      resumoLojas[c.origem][c.ativo] += c.quantidade;
    });

  // Gerar resumo por CDs
  type CDKeys = 'CD ES' | 'CD SP' | 'CD RJ';
  const resumoCDs: Record<CDKeys, Record<string, Record<string, number>>> = {
    'CD ES': {},
    'CD SP': {},
    'CD RJ': {}
  };
  
  // Estoque nos CDs
  contagens
    .filter(c => c.tipo === 'setor')
    .forEach(c => {
      let cdAssociado: CDKeys = 'CD SP'; // Defaultt
      
      // Lógica para associar setores aos CDs
      if (c.origem.includes('ES')) {
        cdAssociado = 'CD ES';
      } else if (c.origem.includes('RJ')) {
        cdAssociado = 'CD RJ';
      }
      
      if (!resumoCDs[cdAssociado]['estoque']) {
        resumoCDs[cdAssociado]['estoque'] = {};
      }
      
      if (!resumoCDs[cdAssociado]['estoque'][c.ativo]) {
        resumoCDs[cdAssociado]['estoque'][c.ativo] = 0;
      }
      
      resumoCDs[cdAssociado]['estoque'][c.ativo] += c.quantidade;
    });
  
  // Fornecedores
  contagens
    .filter(c => c.tipo === 'fornecedor')
    .forEach(c => {
      let cdAssociado: CDKeys = 'CD SP'; // Default
      
      // Lógica para associar fornecedores aos CDs
      if (c.origem.includes('ES')) {
        cdAssociado = 'CD ES';
      } else if (c.origem.includes('RJ')) {
        cdAssociado = 'CD RJ';
      }
      
      if (!resumoCDs[cdAssociado]['fornecedor']) {
        resumoCDs[cdAssociado]['fornecedor'] = {};
      }
      
      if (!resumoCDs[cdAssociado]['fornecedor'][c.ativo]) {
        resumoCDs[cdAssociado]['fornecedor'][c.ativo] = 0;
      }
      
      resumoCDs[cdAssociado]['fornecedor'][c.ativo] += c.quantidade;
    });
  
  // Trânsito
  dadosTransito.forEach(t => {
    const origem = t.origem;
    let cdAssociado: CDKeys | null = null;
    
    if (origem.includes('São Paulo')) {
      cdAssociado = 'CD SP';
    } else if (origem.includes('Espírito Santo')) {
      cdAssociado = 'CD ES';
    } else if (origem.includes('Rio de Janeiro')) {
      cdAssociado = 'CD RJ';
    }
    
    if (cdAssociado !== null) {
      if (!resumoCDs[cdAssociado]['transito']) {
        resumoCDs[cdAssociado]['transito'] = {};
      }
      
      if (!resumoCDs[cdAssociado]['transito'][t.ativo]) {
        resumoCDs[cdAssociado]['transito'][t.ativo] = 0;
      }
      
      resumoCDs[cdAssociado]['transito'][t.ativo] += t.quantidade;
    }
  });

  // Resumo por tipo de ativo
  interface ResumoAtivo {
    lojas: number;
    cds: number;
    fornecedores: number;
    transito: number;
    total: number;
  }
  const resumoAtivos: Record<string, ResumoAtivo> = {};
  
  // Separar ativos por conjuntos conforme solicitado
  const conjuntosAtivos = {
    'HB': ['CAIXA HB 623', 'CAIXA HB 618', 'CAIXA HB 415'],
    'HNT': ['CAIXA HNT G', 'CAIXA HNT P'],
    'Outros': ['CAIXA BIN', 'CAIXA BASCULHANTE']
  };
  
  // Inicializar estrutura
  Object.keys(conjuntosAtivos).forEach(conjunto => {
    resumoAtivos[conjunto] = {
      lojas: 0,
      cds: 0,
      fornecedores: 0,
      transito: 0,
      total: 0
    };
  });
  
  // Função para classificar ativo no conjunto correto
  const getConjuntoAtivo = (ativo: string) => {
    for (const [conjunto, listaAtivos] of Object.entries(conjuntosAtivos)) {
      if (listaAtivos.includes(ativo)) {
        return conjunto;
      }
    }
    return 'Outros';
  };
  
  // Contar lojas
  contagens
    .filter(c => c.tipo === 'loja')
    .forEach(c => {
      const conjunto = getConjuntoAtivo(c.ativo);
      resumoAtivos[conjunto].lojas += c.quantidade;
      resumoAtivos[conjunto].total += c.quantidade;
    });
  
  // Contar CDs (setores)
  contagens
    .filter(c => c.tipo === 'setor')
    .forEach(c => {
      const conjunto = getConjuntoAtivo(c.ativo);
      resumoAtivos[conjunto].cds += c.quantidade;
      resumoAtivos[conjunto].total += c.quantidade;
    });
  
  // Contar fornecedores
  contagens
    .filter(c => c.tipo === 'fornecedor')
    .forEach(c => {
      const conjunto = getConjuntoAtivo(c.ativo);
      resumoAtivos[conjunto].fornecedores += c.quantidade;
      resumoAtivos[conjunto].total += c.quantidade;
    });
  
  // Contar trânsito
  dadosTransito.forEach(t => {
    const conjunto = getConjuntoAtivo(t.ativo);
    resumoAtivos[conjunto].transito += t.quantidade;
    resumoAtivos[conjunto].total += t.quantidade;
  });

  // Criar registro preliminar do relatório
  const relatorioData = {
    inventario_id: id,
    lojas_sem_contagem: lojasPendentes,
    fornecedores_sem_contagem: !temFornecedor,
    tem_transito: temTransito,
    resumo_lojas: resumoLojas,
    resumo_cds: resumoCDs,
    resumo_fornecedores: { 
      tem_contagem: temFornecedor 
    },
    resumo_transito: {
      tem_registros: temTransito,
      quantidade: dadosTransito.length
    },
    resumo_ativos: resumoAtivos,
    status: 'rascunho'
  };

  // Verificar se já existe um relatório para este inventário
  const { data: relatorioExistente, error: relatorioError } = await supabase
    .from('relatorios_inventario')
    .select('id')
    .eq('inventario_id', id)
    .maybeSingle();

  let resultado;
  
  if (relatorioExistente) {
    // Atualizar relatório existente
    const { data, error } = await supabase
      .from('relatorios_inventario')
      .update(relatorioData)
      .eq('id', relatorioExistente.id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    resultado = data;
  } else {
    // Criar novo relatório
    const { data, error } = await supabase
      .from('relatorios_inventario')
      .insert([relatorioData])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    resultado = data;
  }
  
  // Retornar o resultado da análise e o ID do relatório
  return NextResponse.json({
    id: resultado.id,
    todasLojasTemContagem,
    temFornecedor,
    temTransito,
    lojasPendentes,
    resumoAtivos,
    relatorioCompleto: resultado
  });
}