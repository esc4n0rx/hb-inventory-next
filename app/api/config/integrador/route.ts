// app/api/config/integrador/route.ts - ajustes para corrigir o problema de salvar a configuração

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Melhorias para debug e tratamento de erros
export async function GET() {
  console.log('GET /api/config/integrador - Obtendo configuração...');
  try {
    // Verificar primeiro se o registro existe
    const { data: existingData, error: checkError } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'integrador');
    
    if (checkError) {
      console.error('Erro ao verificar config existente:', checkError);
      throw checkError;
    }
    
    // Se não existir configuração, retornar padrão
    if (!existingData || existingData.length === 0) {
      const defaultConfig = {
        ativo: false,
        apiUrl: '',
        apiKey: '',
        syncInterval: 30,
        autoImport: true,
        notifyOnCapture: true,
        lastSync: null
      };
      
      console.log('Configuração não encontrada, retornando padrão:', defaultConfig);
      return NextResponse.json(defaultConfig);
    }
    
    console.log('Configuração encontrada:', existingData[0].value);
    return NextResponse.json(existingData[0].value);
  } catch (error) {
    console.error('Erro ao obter configuração do integrador:', error);
    return NextResponse.json({ 
      error: 'Erro ao obter configuração do integrador',
      details: String(error)
    }, { status: 500 });
  }
}

// PUT - Atualizar configuração do integrador
export async function PUT(request: Request) {
  console.log('PUT /api/config/integrador - Atualizando configuração...');
  try {
    const config = await request.json();
    console.log('Payload recebido:', config);
    
    // Verificar primeiro se o registro existe
    const { data: existingData, error: checkError } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', 'integrador');
    
    if (checkError) {
      console.error('Erro ao verificar configuração existente:', checkError);
      throw checkError;
    }
    
    let result;
    
    // Se não existir, criar um novo registro
    if (!existingData || existingData.length === 0) {
      console.log('Configuração não existe, criando novo registro...');
      const { data, error } = await supabase
        .from('system_config')
        .insert([{ 
          key: 'integrador', 
          value: config 
        }])
        .select();
      
      if (error) {
        console.error('Erro ao inserir configuração:', error);
        throw error;
      }
      
      result = data?.[0]?.value;
    } else {
      // Se existir, atualizar o registro
      console.log('Configuração existe, atualizando registro existente...');
      const { data, error } = await supabase
        .from('system_config')
        .update({ value: config })
        .eq('key', 'integrador')
        .select();
      
      if (error) {
        console.error('Erro ao atualizar configuração:', error);
        throw error;
      }
      
      result = data?.[0]?.value;
    }
    
    console.log('Configuração salva com sucesso:', result);
    return NextResponse.json(result || config);
  } catch (error) {
    console.error('Erro ao atualizar configuração do integrador:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar configuração do integrador',
      details: String(error)
    }, { status: 500 });
  }
}