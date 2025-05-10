import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { camelToSnake, snakeToCamel } from '@/lib/utils';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obter dado de trânsito por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const { data, error } = await supabase
    .from('dados_transito')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Converter para camelCase
  const dadoTransito = {
    ...snakeToCamel(data),
    inventarioId: data.inventario_id,
    dataEnvio: data.data_envio,
    dataRecebimento: data.data_recebimento
  };

  return NextResponse.json(dadoTransito);
}

// PATCH - Atualizar status do trânsito
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const json = await request.json();
  const { status } = json;

  if (!status || !['enviado', 'recebido', 'pendente'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  // Verificar se o dado de trânsito existe
  const { data: existingData, error: existingError } = await supabase
    .from('dados_transito')
    .select('inventario_id')
    .eq('id', id)
    .single();

  if (existingError) {
    return NextResponse.json({ error: 'Dado de trânsito não encontrado' }, { status: 404 });
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
    return NextResponse.json({ error: 'Não é possível editar dados de trânsito de um inventário finalizado' }, { status: 400 });
  }

  // Preparar dados para atualização
  const dadosAtualizados: Record<string, any> = { status };
  
  // Se o status for 'recebido', atualizar a data de recebimento
  if (status === 'recebido') {
    dadosAtualizados.data_recebimento = new Date().toISOString();
  } else {
    // Se o status for alterado de 'recebido' para outro, limpar a data de recebimento
    dadosAtualizados.data_recebimento = null;
  }

  const { data, error } = await supabase
    .from('dados_transito')
    .update(dadosAtualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter para camelCase
  const dadoTransitoAtualizado = {
    ...snakeToCamel(data),
    inventarioId: data.inventario_id,
    dataEnvio: data.data_envio,
    dataRecebimento: data.data_recebimento
  };

  return NextResponse.json(dadoTransitoAtualizado);
}