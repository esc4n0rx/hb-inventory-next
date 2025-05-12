// lib/pdf-generator.ts
import { jsPDF } from 'jspdf';
// Import jspdf-autotable to extend the jsPDF prototype, even if not directly called here.
// Consider using doc.autoTable() for cleaner table generation in the future.
import 'jspdf-autotable'; 

// --- Interface definitions (as defined above) ---
interface Inventario {
  codigo: string | number; 
  responsavel: string;
  data_inicio: string | Date; 
}

interface ResumoAtivoDetalhes {
  lojas: number;
  cds: number;
  fornecedores: number;
  transito: number;
  total: number;
}

interface AtivoQuantidadeMap {
  [ativo: string]: number;
}

interface ResumoCdDetalhes {
  estoque?: AtivoQuantidadeMap;     
  fornecedor?: AtivoQuantidadeMap;  
  transito?: AtivoQuantidadeMap;    
}

interface Relatorio {
  data_aprovacao?: string | Date | null; 
  lojas_sem_contagem?: { [key: string]: string[] }; 
  fornecedores_sem_contagem: boolean; 
  tem_transito: boolean;
  resumo_ativos: { [conjunto: string]: ResumoAtivoDetalhes }; 
  resumo_cds: { [cd: string]: ResumoCdDetalhes }; 
}
// --- End of Interface definitions ---

/**
 * Generates a PDF report for inventory finalization.
 * @param inventario - The inventory basic information.
 * @param relatorio - The detailed report data.
 */
export function generatePDF(inventario: Inventario, relatorio: Relatorio): void { // Changed return type, removed async
  // Criar um novo documento PDF
  const doc = new jsPDF();
  
  // Adicionar título
  doc.setFontSize(18);
  doc.text('Relatório de Finalização de Inventário', 105, 20, { align: 'center' });
  
  // Adicionar informações do inventário
  doc.setFontSize(12);
  doc.text(`Código do Inventário: ${inventario.codigo}`, 14, 40);
  doc.text(`Responsável: ${inventario.responsavel}`, 14, 48);
  // Ensure data_inicio is converted to Date if it's a string
  doc.text(`Data de Início: ${new Date(inventario.data_inicio).toLocaleDateString('pt-BR')}`, 14, 56);
  // Use data_aprovacao if available (and convert), otherwise use current date
  const dataFinalizacao = relatorio.data_aprovacao ? new Date(relatorio.data_aprovacao) : new Date();
  doc.text(`Data de Finalização: ${dataFinalizacao.toLocaleDateString('pt-BR')}`, 14, 64);
  
  // Adicionar validações
  doc.setFontSize(14);
  doc.text('Validações', 14, 80);
  
  // Calculate pending stores, handling potential undefined/null for lojas_sem_contagem
  const lojasPendentes = Object.values(relatorio.lojas_sem_contagem || {}).flat().length;
  
  doc.setFontSize(10);
  doc.text(`1. Todas as lojas têm registro de contagem: ${lojasPendentes === 0 ? 'Sim' : 'Não'}`, 14, 88);
  
  if (lojasPendentes > 0) {
    doc.text(`   ${lojasPendentes} lojas sem contagem`, 14, 96);
  }
  
  // Check based on the boolean flag (as defined in the interface)
  doc.text(`2. Registros de fornecedor completos: ${!relatorio.fornecedores_sem_contagem ? 'Sim' : 'Não'}`, 14, 104);
  doc.text(`3. Registros de trânsito presentes: ${relatorio.tem_transito ? 'Sim' : 'Não'}`, 14, 112);
  
  // Adicionar resumo por conjunto de ativos
  doc.setFontSize(14);
  doc.text('Resumo por Conjunto de Ativos', 14, 130);
  
  // Tabela para cada conjunto de ativos
  let yPosition = 140;
  // Use Object.entries with typed key/value pair
  Object.entries(relatorio.resumo_ativos).forEach(([conjunto, dados]: [string, ResumoAtivoDetalhes]) => {
    doc.setFontSize(12);
    doc.text(`${conjunto}:`, 14, yPosition);
    yPosition += 8;
    
    // Access properties safely based on ResumoAtivoDetalhes interface
    doc.setFontSize(10);
    doc.text(`Lojas: ${dados.lojas}`, 20, yPosition);
    yPosition += 6;
    doc.text(`CDs: ${dados.cds}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Fornecedores: ${dados.fornecedores}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Em Trânsito: ${dados.transito}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total: ${dados.total}`, 20, yPosition);
    yPosition += 10; // Space before next group

    // Basic page break handling (could be improved with autoTable)
     if (yPosition > 280) { 
       doc.addPage();
       yPosition = 20; 
     }
  });
  
  // --- Resumo por CD Section ---
  // Check if there's enough space for the title, otherwise add page first
   if (yPosition > 270) { 
       doc.addPage();
       yPosition = 20; 
   } else {
       // Ensure some spacing if content continues on the same page
       yPosition = Math.max(yPosition, 140) + 10; // Add some space after the last section if needed
   }

  // Add new page ONLY IF the previous section didn't already add one AND there's CD data
  // This logic might need adjustment based on desired layout. Let's try a different approach:
  // Always add a new page for the CD summary if there is CD data.
  if (Object.keys(relatorio.resumo_cds).length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Resumo por Centro de Distribuição', 14, 20);
      let cdYPosition = 30; // Start position on the new page

      // Use Object.entries with typed key/value pair
      Object.entries(relatorio.resumo_cds).forEach(([cd, dados]: [string, ResumoCdDetalhes]) => {
        doc.setFontSize(12);
        doc.text(`${cd}:`, 14, cdYPosition);
        cdYPosition += 8;
        
        // Check for optional 'estoque' property before accessing
        if (dados.estoque && Object.keys(dados.estoque).length > 0) {
          doc.setFontSize(10);
          doc.text('Estoque:', 20, cdYPosition);
          cdYPosition += 6;
          
          // Iterate through estoque map
          Object.entries(dados.estoque).forEach(([ativo, quantidade]: [string, number]) => {
            doc.text(`${ativo}: ${quantidade}`, 30, cdYPosition);
            cdYPosition += 6;
             // Check page break inside inner loop
             if (cdYPosition > 280) { doc.addPage(); cdYPosition = 20; }
          });
        }
        
        // Check for optional 'fornecedor' property
        if (dados.fornecedor && Object.keys(dados.fornecedor).length > 0) {
          doc.setFontSize(10);
          doc.text('Fornecedor:', 20, cdYPosition);
          cdYPosition += 6;
          
          Object.entries(dados.fornecedor).forEach(([ativo, quantidade]: [string, number]) => {
            doc.text(`${ativo}: ${quantidade}`, 30, cdYPosition);
            cdYPosition += 6;
             if (cdYPosition > 280) { doc.addPage(); cdYPosition = 20; }
          });
        }
        
        // Check for optional 'transito' property
        if (dados.transito && Object.keys(dados.transito).length > 0) {
          doc.setFontSize(10);
          doc.text('Em Trânsito:', 20, cdYPosition);
          cdYPosition += 6;
          
          Object.entries(dados.transito).forEach(([ativo, quantidade]: [string, number]) => {
            doc.text(`${ativo}: ${quantidade}`, 30, cdYPosition);
            cdYPosition += 6;
             if (cdYPosition > 280) { doc.addPage(); cdYPosition = 20; }
          });
        }
        
        cdYPosition += 10; // Space before next CD
        
        // Add new page if needed before the *next* CD section title
        if (cdYPosition > 270) { // Check threshold before adding next title
          doc.addPage();
          cdYPosition = 20;
        }
      });
  } // End of check for CD data
  
  // Salvar o PDF
  // The .save() method triggers download and returns the jsPDF instance.
  // The function return type is void as we primarily care about the side effect.
  doc.save(`relatorio-inventario-${inventario.codigo}.pdf`); 
}