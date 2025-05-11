// app/api/config/integrador/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obter configuração do integrador
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'integrador')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Erro ao obter configuração do integrador:', error);
    return NextResponse.json({ error: 'Erro ao obter configuração do integrador' }, { status: 500 });
  }
}

// PUT - Atualizar configuração do integrador
export async function PUT(request: Request) {
  try {
    const config = await request.json();

    const { data, error } = await supabase
      .from('system_config')
      .update({ value: config })
      .eq('key', 'integrador')
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Erro ao atualizar configuração do integrador:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configuração do integrador' }, { status: 500 });
  }
}