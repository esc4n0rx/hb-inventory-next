// app/api/inventarios/[id]/finalizar/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { relatorioId, aprovadoPor } = await request.json();

  if (!relatorioId || !aprovadoPor) {
    return NextResponse.json({ 
      error: 'ID do relatório e nome do aprovador são obrigatórios' 
    }, { status: 400 });
  }

  // Verificar se o inventário existe e está ativo
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('status')
    .eq('id', id)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  if (inventario.status !== 'ativo') {
    return NextResponse.json({ error: 'Apenas inventários ativos podem ser finalizados' }, { status: 400 });
  }

  // Iniciar transação para finalizar o inventário e aprovar o relatório
  // Como o Supabase não suporta transações diretamente via API, fazemos as operações em sequência

  // 1. Finalizar o inventário
  const dataFim = new Date().toISOString();
  const { data: inventarioFinalizado, error: finalizarError } = await supabase
    .from('inventarios')
    .update({
      status: 'finalizado',
      data_fim: dataFim
    })
    .eq('id', id)
    .select()
    .single();

  if (finalizarError) {
    return NextResponse.json({ error: finalizarError.message }, { status: 400 });
  }

  // 2. Aprovar o relatório
  const { data: relatorioAprovado, error: aprovarError } = await supabase
    .from('relatorios_inventario')
    .update({
      status: 'aprovado',
      aprovado_por: aprovadoPor,
      data_aprovacao: dataFim
    })
    .eq('id', relatorioId)
    .select()
    .single();

  if (aprovarError) {
    // Em caso de erro, tentar reverter a finalização do inventário
    await supabase
      .from('inventarios')
      .update({
        status: 'ativo',
        data_fim: null
      })
      .eq('id', id);
      
    return NextResponse.json({ error: aprovarError.message }, { status: 400 });
  }

  return NextResponse.json({
    message: 'Inventário finalizado com sucesso',
    inventario: inventarioFinalizado,
    relatorio: relatorioAprovado
  });
}