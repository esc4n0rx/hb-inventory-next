import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lojas } from '@/data/lojas';
import { setoresCD } from '@/data/setores';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Calcular e retornar o progresso atual
export async function GET(
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
    .from('contagens')
    .select('*')
    .eq('inventario_id', id);

  if (contagensError) {
    return NextResponse.json({ error: contagensError.message }, { status: 400 });
  }

  // Calcular o progresso
  const progresso = calcularProgresso(contagens);

  return NextResponse.json(progresso);
}

// PATCH - Atualizar o progresso do inventário
export async function PATCH(
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
    .from('contagens')
    .select('*')
    .eq('inventario_id', id);

  if (contagensError) {
    return NextResponse.json({ error: contagensError.message }, { status: 400 });
  }

  // Calcular o progresso
  const progresso = calcularProgresso(contagens);

  // Atualizar o inventário
  const { data, error } = await supabase
    .from('inventarios')
    .update({ progresso })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// Função para calcular o progresso com base nas contagens
function calcularProgresso(contagens: any[]) {
  // Lojas contadas
  const lojasContadas = new Set();
  contagens
    .filter((contagem) => contagem.tipo === "loja")
    .forEach((contagem) => lojasContadas.add(contagem.origem));

  // Setores contados
  const setoresContados = new Set();
  contagens
    .filter((contagem) => contagem.tipo === "setor")
    .forEach((contagem) => setoresContados.add(contagem.origem));

  // Fornecedores contados
  const fornecedoresContados = new Set();
  contagens
    .filter((contagem) => contagem.tipo === "fornecedor")
    .forEach((contagem) => fornecedoresContados.add(contagem.origem));

  // Calcular progresso
  const totalLojas = Object.values(lojas).flat().length;
  const totalSetores = setoresCD.length;
  const totalFornecedores = 3; // ES, SP, RIO

  return {
    lojas: Math.round((lojasContadas.size / totalLojas) * 100),
    setores: Math.round((setoresContados.size / totalSetores) * 100),
    fornecedores: Math.round((fornecedoresContados.size / totalFornecedores) * 100),
  };
}