// app/api/integrador/toggle/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { ativo, notifyOnCapture, inventarioId } = await request.json();

    // Verificar se o inventário existe e está ativo
    if (ativo) {
      const { data: inventario, error: inventarioError } = await supabase
        .from('inventarios')
        .select('status')
        .eq('id', inventarioId)
        .single();

      if (inventarioError || !inventario || inventario.status !== 'ativo') {
        return NextResponse.json(
          { error: 'Inventário inválido ou não está ativo' },
          { status: 400 }
        );
      }
    }

    // Verificar se já existe a configuração
    const { data: existingConfig, error: checkError } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', 'integrador_simples')
      .maybeSingle();

    // Configuração a ser salva
    const configValue = {
      ativo,
      notifyOnCapture,
      inventarioId: ativo ? inventarioId : null,
      lastSync: ativo ? new Date().toISOString() : existingConfig?.value?.lastSync || null,
      totalCaptured: existingConfig?.value?.totalCaptured || 0
    };

    let result;
    
    if (!existingConfig) {
      // Criar nova configuração
      const { data, error } = await supabase
        .from('system_config')
        .insert([{ key: 'integrador_simples', value: configValue }])
        .select();

      if (error) throw error;
      result = data?.[0]?.value;
    } else {
      // Atualizar configuração existente
      const { data, error } = await supabase
        .from('system_config')
        .update({ value: configValue })
        .eq('key', 'integrador_simples')
        .select();

      if (error) throw error;
      result = data?.[0]?.value;
    }

    if (ativo) {
  try {
    // Criar um trigger que monitora inserções/atualizações na tabela contagens
    const triggerSQL = `
      -- Primeiro, criar a função que será chamada pelo trigger
      CREATE OR REPLACE FUNCTION process_new_contagem()
      RETURNS TRIGGER AS $$
      DECLARE
        config_record RECORD;
        inventory_id UUID;
        total_captured INTEGER;
        should_notify BOOLEAN;
        existing_count INTEGER;
      BEGIN
        -- Buscar configuração do integrador
        SELECT value INTO config_record FROM system_config WHERE key = 'integrador_simples';
        
        -- Se o integrador não estiver ativo, não fazer nada
        IF NOT (config_record.value->>'ativo')::BOOLEAN THEN
          RETURN NEW;
        END IF;
        
        -- Extrair valores da configuração
        inventory_id := (config_record.value->>'inventarioId')::UUID;
        total_captured := (config_record.value->>'totalCaptured')::INTEGER;
        should_notify := (config_record.value->>'notifyOnCapture')::BOOLEAN;
        
        -- Verificar se já existe uma contagem desta loja e ativo neste inventário
        SELECT COUNT(*) INTO existing_count
        FROM contagenshb
        WHERE inventario_id = inventory_id
          AND tipo = 'loja'
          AND origem = NEW.loja_nome
          AND ativo = NEW.ativo_nome
          AND responsavel = 'integrador';
        
        -- Se já existir uma contagem, atualizar a quantidade em vez de criar uma nova
        IF existing_count > 0 THEN
          UPDATE contagenshb
          SET quantidade = NEW.quantidade,
              data_contagem = NOW()
          WHERE inventario_id = inventory_id
            AND tipo = 'loja'
            AND origem = NEW.loja_nome
            AND ativo = NEW.ativo_nome
            AND responsavel = 'integrador';
        ELSE
          -- Inserir a nova contagem na tabela contagenshb
          INSERT INTO contagenshb (
            inventario_id,
            tipo,
            origem,
            ativo,
            quantidade,
            responsavel,
            data_contagem
          ) VALUES (
            inventory_id,
            'loja',
            NEW.loja_nome,
            NEW.ativo_nome,
            NEW.quantidade,
            'integrador',
            NOW()
          );
          
          -- Incrementar o contador apenas para novas contagens
          total_captured := total_captured + 1;
        END IF;
        
        -- Atualizar a configuração
        UPDATE system_config
        SET value = jsonb_set(
          jsonb_set(
            config_record.value::jsonb, 
            '{lastSync}', 
            to_jsonb(NOW()::text)
          ),
          '{totalCaptured}', 
          to_jsonb(total_captured)
        )
        WHERE key = 'integrador_simples';
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Remover o trigger existente se houver
      DROP TRIGGER IF EXISTS contagens_integrador_trigger ON contagens;
      
      -- Criar o novo trigger
      CREATE TRIGGER contagens_integrador_trigger
      AFTER INSERT OR UPDATE ON contagens
      FOR EACH ROW EXECUTE FUNCTION process_new_contagem();
    `;

    // Executar o SQL para criar o trigger
    await supabase.rpc('execute_sql', { sql: triggerSQL });
    console.log('Trigger configurado com sucesso');
  } catch (dbError) {
    console.error('Erro ao configurar trigger:', dbError);
    
    // Falha silenciosa - o monitoramento via cliente ainda funcionará como backup
    console.log('Usando monitoramento via cliente como fallback');
  }
    } else {
      // Se o integrador for desativado, desativar o trigger
      try {
        const disableTriggerSQL = `
          -- Desativar o trigger
          DROP TRIGGER IF EXISTS contagens_integrador_trigger ON contagens;
        `;
        
        await supabase.rpc('execute_sql', { sql: disableTriggerSQL });
        console.log('Trigger desativado com sucesso');
      } catch (error) {
        console.error('Erro ao desativar trigger:', error);
      }
    }

    return NextResponse.json(result || configValue);
  } catch (error) {
    console.error('Erro ao alterar status do integrador:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar status do integrador' },
      { status: 500 }
    );
  }
}