// lib/supabase.ts - verificar se está configurado corretamente

import { createClient } from '@supabase/supabase-js';

// Certifique-se de que estas variáveis de ambiente estejam definidas
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log para debug
console.log('Inicializando cliente Supabase...');
console.log('URL disponível:', !!supabaseUrl);
console.log('Chave disponível:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis de ambiente do Supabase não configuradas corretamente!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);