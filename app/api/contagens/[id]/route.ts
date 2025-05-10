import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { camelToSnake, snakeToCamel } from '@/lib/utils';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obter contagem por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const { data, error } = await supabase
    .from('contagenshb')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Converter para camelCase
  const contagem = {
    ...snakeToCamel(data),
    inventarioId: data.inventario_id,
    dataContagem: data.data_contagem
  };

  return NextResponse.json(contagem);
}

// PATCH - Atualizar contagem
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const json = await request.json();

  // Verificar se a contagem existe
  const { data: existingData, error: existingError } = await supabase
    .from('contagenshb')
    .select('inventario_id')
    .eq('id', id)
    .single();

  if (existingError) {
    return NextResponse.json({ error: 'Contagem não encontrada' }, { status: 404 });
  }

  // Verificar se o inventário está ativo
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('status')
    .eq('id', existingData.inventario_id)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  if (inventario.status !== 'ativo') {
    return NextResponse.json({ error: 'Não é possível editar contagens de um inventário finalizado' }, { status: 400 });
  }

  // Transformar para snake_case
  const { inventarioId, dataContagem, ...rest } = json;
  let dadosAtualizados = camelToSnake(rest);

  // Não permitir atualizar inventarioId
  delete dadosAtualizados.inventario_id;
  
  // Não permitir atualizar a data da contagem
  delete dadosAtualizados.data_contagem;

  const { data, error } = await supabase
    .from('contagenshb')
    .update(dadosAtualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter para camelCase
  const contagemAtualizada = {
    ...snakeToCamel(data),
    inventarioId: data.inventario_id,
    dataContagem: data.data_contagem
  };

  return NextResponse.json(contagemAtualizada);
}

// DELETE - Remover contagem
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Verificar se a contagem existe
  const { data: existingData, error: existingError } = await supabase
    .from('contagenshb')
    .select('inventario_id')
    .eq('id', id)
    .single();

  if (existingError) {
    return NextResponse.json({ error: 'Contagem não encontrada' }, { status: 404 });
  }

  // Verificar se o inventário está ativo
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('status')
    .eq('id', existingData.inventario_id)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  if (inventario.status !== 'ativo') {
    return NextResponse.json({ error: 'Não é possível remover contagens de um inventário finalizado' }, { status: 400 });
  }

  const { error } = await supabase
    .from('contagenshb')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}