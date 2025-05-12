// lib/pdf-generator.ts - Função melhorada

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

export function generatePDF(inventario: any, relatorio: any): void {
  // Criar um novo documento PDF
  const doc = new jsPDF();
  
  // Configurações de estilo
  const corPrincipal = [41, 128, 185]; // Azul
  const corSecundaria = [39, 174, 96]; // Verde
  const corTerciaria = [211, 84, 0]; // Laranja
  
  // Adicionar cabeçalho
  doc.setFillColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text('Relatório de Finalização de Inventário', 105, 10, { align: 'center' });
  
  // Adicionar informações do inventário
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Informações Gerais', 14, 25);
  
  doc.setDrawColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
  doc.line(14, 27, 196, 27);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Código do Inventário: ${inventario.codigo}`, 14, 35);
  doc.text(`Responsável: ${inventario.responsavel}`, 14, 43);
  doc.text(`Data de Início: ${new Date(inventario.data_inicio).toLocaleDateString('pt-BR')}`, 14, 51);
  
  const dataFinalizacao = relatorio.data_aprovacao 
    ? new Date(relatorio.data_aprovacao).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data de Finalização: ${dataFinalizacao}`, 14, 59);
  
  if (relatorio.aprovado_por) {
    doc.text(`Aprovado por: ${relatorio.aprovado_por}`, 14, 67);
  }
  
  // Adicionar validações
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Validações', 14, 80);
  
  doc.setDrawColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
  doc.line(14, 82, 196, 82);
  
  // Obter os dados de validação
  const lojasPendentes = relatorio.lojas_sem_contagem || {};
  const totalLojasPendentes = Object.values(lojasPendentes).flat().length;
  const temFornecedor = !relatorio.fornecedores_sem_contagem;
  const temTransito = relatorio.tem_transito;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Tabela de validações
  autoTable(doc, {
    startY: 85,
    head: [['Item de Validação', 'Status', 'Observação']],
    body: [
      [
        'Todas as lojas têm registro de contagem', 
        totalLojasPendentes === 0 ? 'Sim' : 'Não', 
        totalLojasPendentes === 0 ? '-' : `${totalLojasPendentes} lojas sem contagem`
      ],
      ['Registros de fornecedor completos', temFornecedor ? 'Sim' : 'Não', '-'],
      ['Registros de trânsito presentes', temTransito ? 'Sim' : 'Não', '-']
    ],
    theme: 'striped',
    headStyles: { 
      fillColor: corPrincipal as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 70 }
    }
  });
  
  // Nova página para Resumo por Conjunto de Ativos
  doc.addPage();
  
  // Adicionar cabeçalho
  doc.setFillColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text('Resumo por Conjunto de Ativos', 105, 10, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Conjuntos de Ativos', 14, 25);
  doc.setDrawColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
  doc.line(14, 27, 196, 27);
  
  // Obter dados de resumo de ativos
  const resumoAtivos = relatorio.resumo_ativos || {};
  
  // Construir tabela para resumo de ativos
  const resumoAtivosData = Object.entries(resumoAtivos).map(([conjunto, dados]: [string, any]) => [
    conjunto,
    dados.lojas || 0,
    dados.cds || 0,
    dados.fornecedores || 0,
    dados.transito || 0,
    dados.total || 0
  ]);
  
  // Calcular totais por coluna
  const totaisAtivos = resumoAtivosData.reduce(
    (acc, row) => {
      acc[0] += Number(row[1]);
      acc[1] += Number(row[2]);
      acc[2] += Number(row[3]);
      acc[3] += Number(row[4]);
      acc[4] += Number(row[5]);
      return acc;
    },
    [0, 0, 0, 0, 0]
  );
  
  // Adicionar linha de totais
  resumoAtivosData.push(['TOTAL', ...totaisAtivos]);
  
  autoTable(doc, {
    startY: 32,
    head: [['Conjunto', 'Lojas', 'CDs', 'Fornecedores', 'Em Trânsito', 'Total']],
    body: resumoAtivosData,
    theme: 'striped',
    headStyles: { 
      fillColor: corPrincipal as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [220, 220, 220],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    }
  });
  
  // Adicionar página para detalhamento por CD se houver dados
  const resumoCDs = relatorio.resumo_cds || {};
  
  if (Object.keys(resumoCDs).length > 0) {
    doc.addPage();
    
    // Adicionar cabeçalho
    doc.setFillColor(corSecundaria[0], corSecundaria[1], corSecundaria[2]);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Detalhamento por Centro de Distribuição', 105, 10, { align: 'center' });
    
    let yPosition = 25;
    
    // Para cada CD
    Object.entries(resumoCDs).forEach(([cd, dados]: [string, any]) => {
      // Verificar se ainda há espaço na página atual
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 25;
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${cd}`, 14, yPosition);
      doc.setDrawColor(corSecundaria[0], corSecundaria[1], corSecundaria[2]);
      doc.line(14, yPosition + 2, 196, yPosition + 2);
      
      yPosition += 10;
      
      // Estoque
      if (dados.estoque && Object.keys(dados.estoque).length > 0) {
        doc.setFontSize(10);
        doc.text('Estoque:', 14, yPosition);
        yPosition += 5;
        
        const estoqueData = Object.entries(dados.estoque).map(([ativo, quantidade]) => [String(ativo), String(quantidade)]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Ativo', 'Quantidade']],
          body: estoqueData,
          theme: 'grid',
          headStyles: { 
            fillColor: [200, 220, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 30, halign: 'right' }
          },
          margin: { left: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Fornecedor
      if (dados.fornecedor && Object.keys(dados.fornecedor).length > 0) {
        // Verificar se ainda há espaço na página atual
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 25;
        }
        
        doc.setFontSize(10);
        doc.text('Fornecedor:', 14, yPosition);
        yPosition += 5;
        
        const fornecedorData = Object.entries(dados.fornecedor).map(([ativo, quantidade]) => [String(ativo), String(quantidade)]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Ativo', 'Quantidade']],
          body: fornecedorData,
          theme: 'grid',
          headStyles: { 
            fillColor: [220, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 30, halign: 'right' }
          },
          margin: { left: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Trânsito
      if (dados.transito && Object.keys(dados.transito).length > 0) {
        // Verificar se ainda há espaço na página atual
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 25;
        }
        
        doc.setFontSize(10);
        doc.text('Em Trânsito:', 14, yPosition);
        yPosition += 5;
        
        const transitoData = Object.entries(dados.transito).map(([ativo, quantidade]) => [String(ativo), String(quantidade)]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Ativo', 'Quantidade']],
          body: transitoData,
          theme: 'grid',
          headStyles: { 
            fillColor: [200, 200, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 30, halign: 'right' }
          },
          margin: { left: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
    });
  }
  
  // Adicionar página para detalhamento por loja se houver dados
  const resumoLojas = relatorio.resumo_lojas || {};
  
  if (Object.keys(resumoLojas).length > 0) {
    doc.addPage();
    
    // Adicionar cabeçalho
    doc.setFillColor(corTerciaria[0], corTerciaria[1], corTerciaria[2]);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Detalhamento por Loja', 105, 10, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Contagens por Loja', 14, 25);
    doc.setDrawColor(corTerciaria[0], corTerciaria[1], corTerciaria[2]);
    doc.line(14, 27, 196, 27);
    
    // Construir uma tabela consolidada de lojas
    const tabelaLojas: any[][] = [];
    
    Object.entries(resumoLojas).forEach(([loja, ativos]: [string, any]) => {
      const row = [loja];
      let total = 0;
      
      // Para cada tipo de ativo conhecido
      ['CAIXA HB 623', 'CAIXA HB 618', 'CAIXA HB 415', 'CAIXA HNT G', 'CAIXA HNT P', 'CAIXA BIN', 'CAIXA BASCULHANTE'].forEach(tipoAtivo => {
        const quantidade = ativos[tipoAtivo] || 0;
        row.push(quantidade);
        total += quantidade;
      });
      
      row.push(total.toString());
      tabelaLojas.push(row);
    });
    
    // Ordenar pelo nome da loja
    tabelaLojas.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Calcular totais por coluna
    const totaisLojas = tabelaLojas.reduce(
      (acc, row) => {
        for (let i = 1; i < row.length; i++) {
          acc[i-1] = (acc[i-1] || 0) + Number(row[i]);
        }
        return acc;
      },
      []
    );
    
    // Adicionar linha de totais
    tabelaLojas.push(['TOTAL', ...totaisLojas]);
    
    autoTable(doc, {
      startY: 32,
      head: [['Loja', 'HB 623', 'HB 618', 'HB 415', 'HNT G', 'HNT P', 'BIN', 'BASC.', 'Total']],
      body: tabelaLojas,
      theme: 'striped',
      headStyles: { 
        fillColor: corTerciaria as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: [220, 220, 220],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 18, halign: 'right' },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 18, halign: 'right' },
        8: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      }
    });
  }
  
  // Adicionar rodapé a todas as páginas
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`HB Inventory - Relatório de Finalização - Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
  }
  
  // Salvar o PDF
  doc.save(`relatorio-inventario-${inventario.codigo}.pdf`);
}