// app/api/integrador/process/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Esta rota é chamada pelo webhook do Supabase quando há novas contagens
export async function POST(request: Request) {
  try {
    // Verificar se o integrador está ativo
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'integrador_simples')
      .single();

    if (configError || !config.value.ativo) {
      return NextResponse.json(
        { error: 'Integrador não está ativo' },
        { status: 400 }
      );
    }

    const { inventarioId, notifyOnCapture } = config.value;

    // Buscar as novas contagens desde a última sincronização
    const lastSync = config.value.lastSync || new Date(0).toISOString();
    
    const { data: novasContagens, error: contagensError } = await supabase
      .from('contagens') // Tabela de contagens do sistema externo
      .select('*')
      .gt('data_modificacao', lastSync);

    if (contagensError) {
      throw contagensError;
    }

    // Se não houver novas contagens, apenas atualizar o timestamp
    if (!novasContagens || novasContagens.length === 0) {
      await supabase
        .from('system_config')
        .update({ 
          value: { 
            ...config.value, 
            lastSync: new Date().toISOString() 
          } 
        })
        .eq('key', 'integrador_simples');

      return NextResponse.json({ message: 'Nenhuma nova contagem encontrada' });
    }

    // Processar cada nova contagem
    for (const contagem of novasContagens) {
      // Inserir na tabela contagenshb
      await supabase
        .from('contagenshb')
        .insert([{
          inventario_id: inventarioId,
          tipo: 'loja',
          origem: contagem.loja_nome,
          ativo: contagem.ativo_nome,
          quantidade: contagem.quantidade,
          responsavel: 'integrador',
          data_contagem: new Date().toISOString()
        }]);
    }

    // Atualizar a configuração com a nova data de sincronização e o total
    await supabase
      .from('system_config')
      .update({ 
        value: { 
          ...config.value, 
          lastSync: new Date().toISOString(),
          totalCaptured: (config.value.totalCaptured || 0) + novasContagens.length
        } 
      })
      .eq('key', 'integrador_simples');

    return NextResponse.json({ 
      message: `${novasContagens.length} contagens processadas com sucesso`,
      contagens: novasContagens.length
    });
  } catch (error) {
    console.error('Erro ao processar contagens:', error);
    return NextResponse.json(
      { error: 'Erro ao processar contagens' },
      { status: 500 }
    );
  }
}