import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { camelToSnake, snakeToCamel } from '@/lib/utils';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Listar dados de trânsito (com opção de filtrar por inventário_id)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inventarioId = searchParams.get('inventarioId');
  const status = searchParams.get('status');

  let query = supabase.from('dados_transito').select('*');

  // Aplicar filtros se fornecidos
  if (inventarioId) {
    query = query.eq('inventario_id', inventarioId);
  }
  
  if (status) {
    query = query.eq('status', status);
  }

  // Ordenar por data de envio (mais recentes primeiro)
  query = query.order('data_envio', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter snake_case para camelCase
  const dadosTransito = data.map(transito => {
    return {
      ...snakeToCamel(transito),
      // Manter compatibilidade com o código existente
      inventarioId: transito.inventario_id,
      dataEnvio: transito.data_envio,
      dataRecebimento: transito.data_recebimento
    };
  });

  return NextResponse.json(dadosTransito);
}

// POST - Criar novo dado de trânsito
export async function POST(request: Request) {
  const json = await request.json();
  
  const { 
    inventarioId, 
    origem, 
    destino, 
    ativo, 
    quantidade, 
    status = 'enviado'
  } = json;

  // Validação básica
  if (!inventarioId) {
    return NextResponse.json({ error: 'ID do inventário é obrigatório' }, { status: 400 });
  }
  
  if (!origem) {
    return NextResponse.json({ error: 'Origem é obrigatória' }, { status: 400 });
  }
  
  if (!destino) {
    return NextResponse.json({ error: 'Destino é obrigatório' }, { status: 400 });
  }
  
  if (origem === destino) {
    return NextResponse.json({ error: 'A origem e o destino não podem ser iguais' }, { status: 400 });
  }
  
  if (!ativo) {
    return NextResponse.json({ error: 'Ativo é obrigatório' }, { status: 400 });
  }
  
  if (!quantidade || quantidade <= 0) {
    return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
  }
  
  if (!['enviado', 'recebido', 'pendente'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
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
    return NextResponse.json({ error: 'Não é possível adicionar dados de trânsito a um inventário finalizado' }, { status: 400 });
  }

  // Transformar para snake_case antes de inserir no banco
  const novoDadoTransito = {
    inventario_id: inventarioId,
    origem,
    destino,
    ativo,
    quantidade,
    status,
    // data_envio será preenchida pelo padrão no banco
    // data_recebimento será null inicialmente
  };

  const { data, error } = await supabase
    .from('dados_transito')
    .insert(novoDadoTransito)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter para camelCase para retornar
  const transitoCriado = {
    ...snakeToCamel(data),
    inventarioId: data.inventario_id,
    dataEnvio: data.data_envio,
    dataRecebimento: data.data_recebimento
  };

  return NextResponse.json(transitoCriado);
}