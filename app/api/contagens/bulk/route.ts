import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { camelToSnake, snakeToCamel } from '@/lib/utils';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// POST - Criar múltiplas contagens de uma vez
export async function POST(request: Request) {
  const json = await request.json();
  
  const { 
    inventarioId, 
    tipo, 
    origem, 
    destino, 
    responsavel,
    itens
  } = json;

  // Validação básica
  if (!inventarioId) {
    return NextResponse.json({ error: 'ID do inventário é obrigatório' }, { status: 400 });
  }
  
  if (!tipo || !['loja', 'setor', 'fornecedor'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo de contagem inválido' }, { status: 400 });
  }
  
  if (!origem) {
    return NextResponse.json({ error: 'Origem é obrigatória' }, { status: 400 });
  }
  
  if (!responsavel) {
    return NextResponse.json({ error: 'Responsável é obrigatório' }, { status: 400 });
  }

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: 'Pelo menos um item deve ser informado' }, { status: 400 });
  }

  // Validar cada item
  for (const item of itens) {
    if (!item.ativo) {
      return NextResponse.json({ error: 'Ativo é obrigatório para todos os itens' }, { status: 400 });
    }
    if (!item.quantidade || item.quantidade <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero para todos os itens' }, { status: 400 });
    }
  }

  // Verificar se o inventário existe e está ativo
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('status')
    .eq('id', inventarioId)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  if (inventario.status !== 'ativo') {
    return NextResponse.json({ error: 'Não é possível adicionar contagens a um inventário finalizado' }, { status: 400 });
  }

  // Preparar dados para inserção em lote
  const novasContagens = itens.map(item => ({
    inventario_id: inventarioId,
    tipo,
    origem,
    destino,
    ativo: item.ativo,
    quantidade: item.quantidade,
    responsavel
  }));

  // Inserir todas as contagens de uma vez
  const { data, error } = await supabase
    .from('contagenshb')
    .insert(novasContagens)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter para camelCase para retornar
  const contagensCriadas = data.map(contagem => ({
    ...snakeToCamel(contagem),
    inventarioId: contagem.inventario_id,
    dataContagem: contagem.data_contagem
  }));

  return NextResponse.json({
    success: true,
    count: contagensCriadas.length,
    contagens: contagensCriadas
  });
}