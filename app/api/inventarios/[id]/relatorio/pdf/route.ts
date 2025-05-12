// app/api/inventarios/[id]/relatorio/pdf/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const relatorioId = searchParams.get('relatorioId');

  if (!relatorioId) {
    return NextResponse.json({ error: 'ID do relatório é obrigatório' }, { status: 400 });
  }

  // Buscar inventário
  const { data: inventario, error: inventarioError } = await supabase
    .from('inventarios')
    .select('*')
    .eq('id', id)
    .single();

  if (inventarioError) {
    return NextResponse.json({ error: 'Inventário não encontrado' }, { status: 404 });
  }

  // Buscar relatório
  const { data: relatorio, error: relatorioError } = await supabase
    .from('relatorios_inventario')
    .select('*')
    .eq('id', relatorioId)
    .single();

  if (relatorioError) {
    return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
  }

  // Criar o PDF
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    
    doc.on('error', reject);
  });

  // Gerar o conteúdo do PDF
  // Header
  doc.fontSize(25)
     .text('Relatório de Finalização de Inventário', { align: 'center' })
     .moveDown();
  
  doc.fontSize(12)
     .text(`Código do Inventário: ${inventario.codigo}`, { align: 'left' })
     .text(`Responsável: ${inventario.responsavel}`, { align: 'left' })
     .text(`Data de Início: ${new Date(inventario.data_inicio).toLocaleDateString('pt-BR')}`, { align: 'left' })
     .text(`Data de Finalização: ${new Date(relatorio.data_aprovacao || new Date()).toLocaleDateString('pt-BR')}`, { align: 'left' })
     .moveDown();
  
  // Status das validações
  doc.fontSize(16)
     .text('Validações', { align: 'left' })
     .moveDown(0.5);
  
  const lojasPendentes = Object.values(relatorio.lojas_sem_contagem || {}).flat().length;
  
  doc.fontSize(10)
     .text(`1. Todas as lojas têm registro de contagem: ${lojasPendentes === 0 ? 'Sim' : 'Não'}`, { align: 'left' });
  
  if (lojasPendentes > 0) {
    doc.text(`   ${lojasPendentes} lojas sem contagem`, { align: 'left' });
  }
  
  doc.text(`2. Registros de fornecedor: ${!relatorio.fornecedores_sem_contagem ? 'Sim' : 'Não'}`, { align: 'left' })
     .text(`3. Registros de trânsito: ${relatorio.tem_transito ? 'Sim' : 'Não'}`, { align: 'left' })
     .moveDown();
  
  // Resumo de ativos
  doc.fontSize(16)
     .text('Resumo por Conjunto de Ativos', { align: 'left' })
     .moveDown(0.5);
  
  interface ResumoAtivosData {
    lojas: number;
    cds: number;
    fornecedores: number;
    transito: number;
    total: number;
  }

  const resumoAtivos = relatorio.resumo_ativos as Record<string, ResumoAtivosData>;
    
  Object.entries(resumoAtivos).forEach(([conjunto, dados]) => {
    doc.fontSize(12)
       .text(`${conjunto}:`, { align: 'left' });
    
    doc.fontSize(10)
       .text(`Lojas: ${dados.lojas}`, { indent: 20 })
       .text(`CDs: ${dados.cds}`, { indent: 20 })
       .text(`Fornecedores: ${dados.fornecedores}`, { indent: 20 })
       .text(`Em Trânsito: ${dados.transito}`, { indent: 20 })
       .text(`Total: ${dados.total}`, { indent: 20 })
       .moveDown();
  });
  
  // Resumo por CDs
  doc.addPage();
  doc.fontSize(16)
     .text('Resumo por Centro de Distribuição', { align: 'left' })
     .moveDown(0.5);
  
  interface CDData {
    estoque?: Record<string, number>;
    fornecedor?: Record<string, number>;
    transito?: Record<string, number>;
  }

  const resumoCDs = relatorio.resumo_cds;
  
  Object.entries(resumoCDs as Record<string, CDData>).forEach(([cd, dados]) => {
    doc.fontSize(12)
       .text(`${cd}:`, { align: 'left' })
       .moveDown(0.2);
    
    // Estoque
    if (dados.estoque) {
      doc.fontSize(10)
         .text('Estoque:', { indent: 20 });
      
      Object.entries(dados.estoque).forEach(([ativo, quantidade]) => {
        doc.text(`${ativo}: ${quantidade}`, { indent: 40 });
      });
      
      doc.moveDown(0.2);
    }
    
    // Fornecedor
    if (dados.fornecedor) {
      doc.fontSize(10)
         .text('Fornecedor:', { indent: 20 });
      
      Object.entries(dados.fornecedor).forEach(([ativo, quantidade]) => {
        doc.text(`${ativo}: ${quantidade}`, { indent: 40 });
      });
      
      doc.moveDown(0.2);
    }
    
    // Trânsito
    if (dados.transito) {
      doc.fontSize(10)
         .text('Em Trânsito:', { indent: 20 });
      
      Object.entries(dados.transito).forEach(([ativo, quantidade]) => {
        doc.text(`${ativo}: ${quantidade}`, { indent: 40 });
      });
    }
    
    doc.moveDown();
  });
  
  // Resumo por Lojas
  doc.addPage();
  doc.fontSize(16)
     .text('Resumo por Lojas', { align: 'left' })
     .moveDown(0.5);
  
  const resumoLojas = relatorio.resumo_lojas as Record<string, Record<string, number>>;
  let lojaCount = 0;
  
  Object.entries(resumoLojas).forEach(([loja, ativos]) => {
    // Limitar a quantidade de lojas no PDF para não ficar muito grande
    if (lojaCount >= 10) {
      if (lojaCount === 10) {
        doc.text(`... e mais ${Object.keys(resumoLojas).length - 10} lojas`, { align: 'center' });
      }
      return;
    }
    
    doc.fontSize(10)
       .text(`${loja}:`, { align: 'left' });
    
    Object.entries(ativos).forEach(([ativo, quantidade]) => {
      doc.text(`${ativo}: ${quantidade}`, { indent: 20 });
    });
    
    doc.moveDown(0.5);
    lojaCount++;
  });
  
  // Footer
  doc.addPage();
  doc.fontSize(16)
     .text('Aprovação', { align: 'left' })
     .moveDown(0.5);
  
  doc.fontSize(10)
     .text(`Aprovado por: ${relatorio.aprovado_por || 'Pendente de aprovação'}`, { align: 'left' });
  
  if (relatorio.data_aprovacao) {
    doc.text(`Data da aprovação: ${new Date(relatorio.data_aprovacao).toLocaleDateString('pt-BR')}`, { align: 'left' });
  }
  
  doc.moveDown(2);
  
  doc.fontSize(10)
     .text('Assinatura: ______________________________', { align: 'left' })
     .moveDown(2)
     .font('Helvetica-Oblique')
     .text('Relatório gerado automaticamente pelo sistema HB Inventory', { align: 'center' });
  
  // Finalizar o PDF
  doc.end();
  
  // Aguardar a geração completa do PDF
  const pdfBuffer = await pdfPromise;
  
  // Retornar o PDF como download
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=relatorio-inventario-${inventario.codigo}.pdf`
    }
  });
}