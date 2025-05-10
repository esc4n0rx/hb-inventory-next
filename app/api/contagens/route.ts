import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { camelToSnake, snakeToCamel } from '@/lib/utils';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Listar contagenshb (com opção de filtrar por inventário_id)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inventarioId = searchParams.get('inventarioId');
  const tipo = searchParams.get('tipo');

  let query = supabase.from('contagenshb').select('*');

  // Aplicar filtros se fornecidos
  if (inventarioId) {
    query = query.eq('inventario_id', inventarioId);
  }
  
  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  // Ordenar por data de contagem (mais recentes primeiro)
  query = query.order('data_contagem', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter snake_case para camelCase
  const contagens = data.map(contagem => {
    return {
      ...snakeToCamel(contagem),
      // Manter compatibilidade com o código existente
      inventarioId: contagem.inventario_id,
      dataContagem: contagem.data_contagem
    };
  });

  return NextResponse.json(contagens);
}

// POST - Criar nova contagem
export async function POST(request: Request) {
  const json = await request.json();
  
  const { 
    inventarioId, 
    tipo, 
    origem, 
    destino, 
    ativo, 
    quantidade, 
    responsavel 
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
  
  if (!ativo) {
    return NextResponse.json({ error: 'Ativo é obrigatório' }, { status: 400 });
  }
  
  if (!quantidade || quantidade <= 0) {
    return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
  }
  
  if (!responsavel) {
    return NextResponse.json({ error: 'Responsável é obrigatório' }, { status: 400 });
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

  // Transformar para snake_case antes de inserir no banco
  const novaContagem = {
    inventario_id: inventarioId,
    tipo,
    origem,
    destino,
    ativo,
    quantidade,
    responsavel,
    // data_contagem será preenchida pelo padrão no banco
  };

  const { data, error } = await supabase
    .from('contagenshb')
    .insert(novaContagem)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Atualizar o progresso do inventário
  // Na próxima implementação, isso deve estar em uma função separada
  // Ou idealmente em um trigger no banco de dados

  // Converter para camelCase para retornar
  const contagemCriada = {
    ...snakeToCamel(data),
    inventarioId: data.inventario_id,
    dataContagem: data.data_contagem
  };

  return NextResponse.json(contagemCriada);
}