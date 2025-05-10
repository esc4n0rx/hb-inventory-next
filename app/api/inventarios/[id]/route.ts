import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obter inventário por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  const { data, error } = await supabase
    .from('inventarios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH - Atualizar inventário (finalizar, atualizar progresso, etc.)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const json = await request.json();

  // Verificar se o inventário existe
  const { data: existingData, error: existingError } = await supabase
    .from('inventarios')
    .select('*')
    .eq('id', id)
    .single();

  if (existingError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  // Se for finalizar o inventário
  if (json.status === 'finalizado') {
    json.data_fim = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('inventarios')
    .update(json)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}