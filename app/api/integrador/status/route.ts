// app/api/integrador/status/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'integrador_simples')
      .single();

    if (error) {
      // Se não existir, retornar a configuração padrão
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ativo: false,
          notifyOnCapture: true,
          lastSync: null,
          inventarioId: null,
          totalCaptured: 0
        });
      }
      throw error;
    }

    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Erro ao buscar status do integrador:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status do integrador' },
      { status: 500 }
    );
  }
}