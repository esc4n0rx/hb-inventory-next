// app/api/inventarios/[id]/relatorio/route.ts
import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { lojas } from '@/data/lojas'; // Assuming lojas is Record<string, string[]>

// --- Interfaces for better type safety (Optional but Recommended) ---
interface Contagem {
    id: number;
    inventario_id: string;
    tipo: 'loja' | 'setor' | 'fornecedor';
    origem: string;
    ativo: string;
    quantidade: number;
    // add other fields if they exist
}

interface Transito {
    id: number;
    inventario_id: string;
    origem: string;
    ativo: string;
    quantidade: number;
    // add other fields if they exist
}

interface ResumoAtivo {
    lojas: number;
    cds: number;
    fornecedores: number;
    transito: number;
    total: number;
}

type CDKey = 'CD SP' | 'CD ES' | 'CD RJ';

interface CDSummary {
    estoque: Record<string, number>;
    fornecedor: Record<string, number>;
    transito: Record<string, number>;
}
// --- End Interfaces ---


// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// Add type safety to the client instance
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);


// --- Helper Function (Defined once) ---
const conjuntosAtivos: Record<string, string[]> = {
    'HB': ['HB 623', 'HB 618', 'HB 415','CAIXA HB 618', 'CAIXA HB 415', 'CAIXA HB 623'],
    'HNT': ['HNT G', 'HNT P','CAIXA HNT P','CAIXA HNT G'],
    'Outros': ['CAIXA BIN', 'CAIXA BASCULHANTE']
};

const getConjuntoAtivo = (ativo: string): 'HB' | 'HNT' | 'Outros' => {
    for (const [conjunto, listaAtivos] of Object.entries(conjuntosAtivos)) {
        if (listaAtivos.includes(ativo)) { // <--- Checks if 'ativo' is in the list
            return conjunto as 'HB' | 'HNT' | 'Outros';
        }
    }
    // If not found in any list, it prints the warning and returns 'Outros'
    if (!conjuntosAtivos['Outros'].includes(ativo)) {
          console.warn(`Ativo não classificado encontrado: ${ativo}. Classificado como 'Outros'.`);
    }
    return 'Outros';
};
// --- End Helper Function ---


export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Correção: não use await nos parâmetros, pois já são síncronos
    const id = params.id;
    console.log(`Iniciando geração de relatório para inventário ID: ${id}`);
    
    try {
        // 1. Fetch necessary data
        const { data: inventario, error: inventarioError } = await supabase
            .from('inventarios')
            .select('*')
            .eq('id', id)
            .single();

        if (inventarioError) {
            console.error("Erro ao buscar inventário:", inventarioError);
            const status = inventarioError.code === 'PGRST116' ? 404 : 500;
            return NextResponse.json({ error: `Inventário não encontrado ou erro ao buscar: ${inventarioError.message}` }, { status });
        }
         if (!inventario) {
             // Should be caught by PGRST116, but double-check
             return NextResponse.json({ error: 'Inventário não encontrado.' }, { status: 404 });
         }

        const { data: contagensRaw, error: contagensError } = await supabase
            .from('contagenshb')
            .select('*')
            .eq('inventario_id', id);

        if (contagensError) {
            console.error("Erro ao buscar contagens:", contagensError);
            return NextResponse.json({ error: `Erro ao buscar contagens: ${contagensError.message}` }, { status: 400 });
        }
        const contagens: Contagem[] = contagensRaw || []; // Ensure it's an array

        const { data: dadosTransitoRaw, error: transitoError } = await supabase
            .from('dados_transito')
            .select('*')
            .eq('inventario_id', id);

        if (transitoError) {
            console.error("Erro ao buscar dados de trânsito:", transitoError);
            return NextResponse.json({ error: `Erro ao buscar dados de trânsito: ${transitoError.message}` }, { status: 400 });
        }
        const dadosTransito: Transito[] = dadosTransitoRaw || []; // Ensure it's an array

        // 2. Perform Validations
        const lojasContadas = new Set<string>(contagens.filter(c => c.tipo === 'loja').map(c => c.origem));
        const lojasPendentes: Record<string, string[]> = {};
        let todasLojasTemContagem = true;

        Object.entries(lojas).forEach(([regional, lstLojas]) => {
            const lojasPend = lstLojas.filter(l => !lojasContadas.has(l));
            if (lojasPend.length > 0) {
                lojasPendentes[regional] = lojasPend;
                todasLojasTemContagem = false;
            }
        });

        const temFornecedor = contagens.some(c => c.tipo === 'fornecedor' && c.quantidade > 0);
        const temTransito = dadosTransito.length > 0;

        // 3. Process Data and Calculate Summaries (Single Pass)
        const resumoLojas: Record<string, Record<string, number>> = {};
        const resumoCDs: Record<CDKey, CDSummary> = {
            'CD SP': { estoque: {}, fornecedor: {}, transito: {} },
            'CD ES': { estoque: {}, fornecedor: {}, transito: {} },
            'CD RJ': { estoque: {}, fornecedor: {}, transito: {} }
        };
        const resumoAtivos: Record<string, ResumoAtivo> = {};
        // Initialize resumoAtivos based on defined conjuntos
         Object.keys(conjuntosAtivos).forEach(conjunto => {
             resumoAtivos[conjunto] = { lojas: 0, cds: 0, fornecedores: 0, transito: 0, total: 0 };
         });


        // Process Contagens
        for (const c of contagens) {
            const conjunto = getConjuntoAtivo(c.ativo);
             // Ensure conjunto exists in resumoAtivos (safety check for unexpected ativos)
             if (!resumoAtivos[conjunto]) {
                 console.warn(`Conjunto não inicializado encontrado para ativo ${c.ativo}: ${conjunto}. Inicializando.`);
                 resumoAtivos[conjunto] = { lojas: 0, cds: 0, fornecedores: 0, transito: 0, total: 0 };
             }

            if (c.tipo === 'loja') {
                // Update resumoLojas
                if (!resumoLojas[c.origem]) resumoLojas[c.origem] = {};
                resumoLojas[c.origem][c.ativo] = (resumoLojas[c.origem][c.ativo] || 0) + c.quantidade;

                // Update resumoAtivos (Lojas)
                resumoAtivos[conjunto].lojas += c.quantidade;
                resumoAtivos[conjunto].total += c.quantidade;

            } else if (c.tipo === 'setor') {
                // Determine CD for Setor (Assuming 'setor' means CD stock)
                let cdAssociado: CDKey = 'CD SP'; // Default assumption
                if (c.origem.includes('ES')) cdAssociado = 'CD ES';
                else if (c.origem.includes('RJ')) cdAssociado = 'CD RJ';
                // Add more specific logic if needed based on setor 'origem' format

                // Update resumoCDs (Estoque)
                resumoCDs[cdAssociado].estoque[c.ativo] = (resumoCDs[cdAssociado].estoque[c.ativo] || 0) + c.quantidade;

                // Update resumoAtivos (CDs)
                resumoAtivos[conjunto].cds += c.quantidade;
                resumoAtivos[conjunto].total += c.quantidade;

            } else if (c.tipo === 'fornecedor') {
                // Determine CD for Fornecedor
                let cdAssociado: CDKey = 'CD SP'; // Default assumption
                if (c.origem.includes('ES')) cdAssociado = 'CD ES';
                else if (c.origem.includes('RJ')) cdAssociado = 'CD RJ';
                // Add more specific logic if needed

                // Update resumoCDs (Fornecedor)
                resumoCDs[cdAssociado].fornecedor[c.ativo] = (resumoCDs[cdAssociado].fornecedor[c.ativo] || 0) + c.quantidade;

                // Update resumoAtivos (Fornecedores)
                resumoAtivos[conjunto].fornecedores += c.quantidade;
                resumoAtivos[conjunto].total += c.quantidade;
            }
        }

        // Process Transito
        for (const t of dadosTransito) {
             const conjunto = getConjuntoAtivo(t.ativo);
             // Ensure conjunto exists in resumoAtivos
             if (!resumoAtivos[conjunto]) {
                 console.warn(`Conjunto não inicializado encontrado para ativo em trânsito ${t.ativo}: ${conjunto}. Inicializando.`);
                 resumoAtivos[conjunto] = { lojas: 0, cds: 0, fornecedores: 0, transito: 0, total: 0 };
             }

            let cdAssociado: CDKey | null = null;
            if (t.origem.includes('São Paulo')) cdAssociado = 'CD SP';
            else if (t.origem.includes('Espírito Santo')) cdAssociado = 'CD ES';
            else if (t.origem.includes('Rio de Janeiro')) cdAssociado = 'CD RJ';

            if (cdAssociado) {
                // Update resumoCDs (Transito)
                resumoCDs[cdAssociado].transito[t.ativo] = (resumoCDs[cdAssociado].transito[t.ativo] || 0) + t.quantidade;

                // Update resumoAtivos (Transito)
                resumoAtivos[conjunto].transito += t.quantidade;
                resumoAtivos[conjunto].total += t.quantidade;
            } else {
                 console.warn(`Item em trânsito não associado a um CD: Ativo=${t.ativo}, Origem=${t.origem}`);
            }
        }

        // 4. Prepare data for saving
        const relatorioData = {
            inventario_id: id,
            lojas_sem_contagem: lojasPendentes, // JSON field in DB must support object/JSONB
            fornecedores_sem_contagem: !temFornecedor, // True if NO supplier records found
            tem_transito: temTransito, // True if ANY transit data found
            resumo_lojas: resumoLojas, // JSON field
            resumo_cds: resumoCDs, // JSON field
            resumo_ativos: resumoAtivos, // JSON field
            status: 'rascunho', // Initial status
            // data_geracao: new Date().toISOString() // Consider adding generation timestamp
        };

        // 5. Upsert (Insert or Update) the report in the database
        // Using Supabase upsert feature might be cleaner if primary key conflict is handled
        // Manual check/insert/update as implemented originally:
        const { data: relatorioExistente, error: relatorioCheckError } = await supabase
            .from('relatorios_inventario')
            .select('id')
            .eq('inventario_id', id)
            .maybeSingle(); // Returns null if not found, doesn't error

        if (relatorioCheckError) {
            console.error("Erro ao verificar relatório existente:", relatorioCheckError);
            return NextResponse.json({ error: `Erro ao verificar relatório: ${relatorioCheckError.message}` }, { status: 500 });
        }

        let resultado; // Variable to hold the final saved/updated report data

        if (relatorioExistente) {
            console.log(`Atualizando relatório existente ID: ${relatorioExistente.id}`);
            const { data: updatedData, error: updateError } = await supabase
                .from('relatorios_inventario')
                .update(relatorioData)
                .eq('id', relatorioExistente.id)
                .select() // Select updated data
                .single(); // Expect single result

            if (updateError) {
                console.error("Erro ao atualizar relatório:", updateError);
                return NextResponse.json({ error: `Erro ao atualizar relatório: ${updateError.message}` }, { status: 400 }); // 400 Bad Request likely
            }
            resultado = updatedData;
        } else {
            console.log("Criando novo relatório.");
            const { data: insertedData, error: insertError } = await supabase
                .from('relatorios_inventario')
                .insert([relatorioData]) // Insert requires an array
                .select() // Select inserted data
                .single(); // Expect single result

            if (insertError) {
                console.error("Erro ao criar relatório:", insertError);
                return NextResponse.json({ error: `Erro ao criar relatório: ${insertError.message}` }, { status: 400 }); // 400 Bad Request likely
            }
            resultado = insertedData;
        }

        console.log(`Relatório ${resultado ? `ID ${resultado.id} ` : ''}processado com sucesso.`);

        // 6. Return the final response
        return NextResponse.json({
            message: `Relatório ${relatorioExistente ? 'atualizado' : 'criado'} com sucesso.`,
            relatorioId: resultado.id, // Return the ID of the saved report
            validacao: {
                 todasLojasTemContagem,
                 temFornecedor,
                 temTransito,
                 lojasPendentes: Object.keys(lojasPendentes).length > 0 ? lojasPendentes : null // Return null if empty for cleaner output
            },
            // Include summaries if needed in response, or just the ID and status
            resumoAtivos: resumoAtivos,
            relatorioCompleto: resultado 
        });

    } catch (error) {
        console.error("Erro inesperado no processamento do relatório:", error);
        const message = error instanceof Error ? error.message : 'Erro interno desconhecido no servidor.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}