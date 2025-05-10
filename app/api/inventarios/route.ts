import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { snakeToCamel, camelToSnake } from '@/lib/utils';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Gerar código de inventário
function gerarCodigoInventario(): string {
  const dataAtual = new Date();
  const mes = dataAtual.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
  const ano = dataAtual.getFullYear();
  const mesNumero = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const codigoAleatorio = Math.floor(10000 + Math.random() * 90000); // Gera número de 5 dígitos
  
  return `INV-${mes}-${ano}${mesNumero}${dia}-${codigoAleatorio}`;
}

// GET - Listar todos os inventários
export async function GET() {
  const { data, error } = await supabase
    .from('inventarios')
    .select('*')
    .order('data_inicio', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Converter snake_case para camelCase
  const inventarios = data.map(inv => {
    // Manter compatibilidade com o código existente
    return {
      ...snakeToCamel(inv),
      dataInicio: inv.data_inicio,
      dataFim: inv.data_fim
    };
  });

  return NextResponse.json(inventarios);
}

// POST - Criar novo inventário
export async function POST(request: Request) {
  const json = await request.json();
  const { responsavel } = json;

  if (!responsavel) {
    return NextResponse.json({ error: 'O nome do responsável é obrigatório' }, { status: 400 });
  }

  // Verificar se já existe um inventário ativo
  const { data: inventarioAtivo, error: erroConsulta } = await supabase
    .from('inventarios')
    .select('*')
    .eq('status', 'ativo')
    .maybeSingle();

  if (erroConsulta) {
    return NextResponse.json({ error: erroConsulta.message }, { status: 400 });
  }

  if (inventarioAtivo) {
    return NextResponse.json(
      { error: 'Já existe um inventário ativo. Finalize-o antes de iniciar um novo.' }, 
      { status: 400 }
    );
  }

  // Criar novo inventário
  const novoInventario = {
    codigo: gerarCodigoInventario(),
    responsavel,
    status: 'ativo',
    progresso: { lojas: 0, setores: 0, fornecedores: 0 }
  };

  const { data, error } = await supabase
    .from('inventarios')
    .insert(novoInventario)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}