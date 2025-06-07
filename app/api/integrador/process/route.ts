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

    // Validar o inventarioId
    if (!inventarioId) {
      console.error('Erro Crítico: inventarioId não configurado para o integrador_simples.');
      return NextResponse.json(
        { error: 'Configuração do integrador incompleta: inventarioId não definido.' },
        { status: 500 } // Or 400 if preferred for client error
      );
    }

    const { data: inventario, error: inventarioError } = await supabase
      .from('inventarios')
      .select('status')
      .eq('id', inventarioId)
      .single();

    if (inventarioError) {
      console.error(`Erro Crítico: Falha ao buscar inventário com ID ${inventarioId}:`, inventarioError.message);
      return NextResponse.json(
        { error: `Inventário configurado (ID: ${inventarioId}) não encontrado.` },
        { status: 400 } // Client error as the ID is bad
      );
    }

    if (!inventario || inventario.status !== 'ativo') {
      console.error(`Erro Crítico: Inventário configurado (ID: ${inventarioId}) não está ativo. Status atual: ${inventario ? inventario.status : 'não encontrado'}.`);
      return NextResponse.json(
        { error: `Inventário configurado (ID: ${inventarioId}) não está ativo. Contagens não podem ser processadas.` },
        { status: 400 }
      );
    }

    console.log(`Inventário ID ${inventarioId} validado e ativo. Prosseguindo com o processamento de contagens.`);

    // Buscar as novas contagens desde a última sincronização
    const lastSync = config.value.lastSync || new Date(0).toISOString();
    
    const { data: novasContagens, error: contagensError } = await supabase
      .from('contagens') // Tabela de contagens do sistema externo
      .select('*')
      .gt('data_modificacao', lastSync);

    if (contagensError) {
      throw contagensError;
    }

    // Log the number of new counts found
    console.log(`Found ${novasContagens.length} new counts to process.`);

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
      const dataToInsert = {
        inventario_id: inventarioId,
        tipo: 'loja',
        origem: contagem.loja_nome,
        ativo: contagem.ativo_nome,
        quantidade: contagem.quantidade,
        responsavel: 'integrador',
        data_contagem: new Date().toISOString()
      };
      console.log('Attempting to insert count:', JSON.stringify(dataToInsert));
      try {
        const { data: insertedData, error: insertError } = await supabase
          .from('contagenshb')
          .insert([dataToInsert])
          .select(); // Added .select() to get the inserted data back

        if (insertError) {
          console.error('Error inserting count:', insertError, 'Data:', JSON.stringify(dataToInsert));
          // Optionally, decide if you want to throw this error to be caught by the outer catch block
          // or continue processing other counts. For now, just log and continue.
        } else {
          console.log('Successfully inserted count. Inserted data:', JSON.stringify(insertedData));
        }
      } catch (e) {
        // Catch any other unexpected error during insert for this specific count
        console.error('Unexpected error inserting count:', e, 'Data:', JSON.stringify(dataToInsert));
      }
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