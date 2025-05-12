// app/api/inventarios/[id]/relatorio/pdf/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const relatorioId = searchParams.get('relatorioId');

  if (!relatorioId) {
    return NextResponse.json({ error: 'ID do relatório é obrigatório' }, { status: 400 });
  }

  // Buscar inventário
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('*')
    .eq('id', id)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  // Buscar relatório
  const { data: relatorio, error: relatorioError } = await supabase
    .from('relatorios_inventario')
    .select('*')
    .eq('id', relatorioId)
    .single();

  if (relatorioError) {
    return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
  }

  // Em vez de gerar o PDF no servidor Next.js, vamos retornar os dados do relatório
  // para que possamos gerar o PDF no cliente usando uma biblioteca JavaScript
  
  return NextResponse.json({
    inventario,
    relatorio
  });
}