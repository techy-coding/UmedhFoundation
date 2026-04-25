import { jsPDF } from 'jspdf';

export function downloadFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function toCsv(rows: Array<Array<string | number>>) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
}

function normalizeRow(row: Array<string | number>) {
  return row.map((cell) => String(cell));
}

export function downloadPdf(options: {
  filename: string;
  title: string;
  subtitle?: string;
  lines?: string[];
  sections?: Array<{ heading: string; rows: Array<Array<string | number>>; isTable?: boolean }>;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const ensureSpace = (required = 10) => {
    if (y + required <= pageHeight - margin) {
      return;
    }
    doc.addPage();
    y = 20;
  };

  // Add header with organization info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(options.title, margin, y);
  y += 12;

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const subtitleLines = doc.splitTextToSize(options.subtitle, contentWidth);
    doc.text(subtitleLines, margin, y);
    y += subtitleLines.length * 6 + 8;
  }

  // Add organization info and date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Umedh Foundation - Registered NGO', margin, y);
  y += 5;
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);
  y += 10;

  // Add lines section
  if (options.lines?.length) {
    ensureSpace(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    for (const line of options.lines) {
      ensureSpace(8);
      const wrapped = doc.splitTextToSize(line, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6 + 2;
    }
    y += 8;
  }

  // Add sections with proper tables
  for (const section of options.sections || []) {
    ensureSpace(30);
    
    // Section heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(section.heading, margin, y);
    y += 10;

    if (section.isTable && section.rows.length > 0) {
      // Draw proper table
      const tableStartY = y;
      const rowHeight = 8;
      const colWidths = calculateColumnWidths(section.rows, contentWidth);
      
      // Draw table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      let x = margin;
      
      section.rows[0].forEach((header, colIndex) => {
        doc.text(String(header), x, tableStartY + rowHeight - 2);
        x += colWidths[colIndex];
      });
      
      // Draw header line
      doc.setLineWidth(0.5);
      doc.line(margin, tableStartY + rowHeight, margin + contentWidth, tableStartY + rowHeight);
      
      // Draw table rows
      doc.setFont('helvetica', 'normal');
      y = tableStartY + rowHeight + 2;
      
      for (let i = 1; i < section.rows.length; i++) {
        ensureSpace(rowHeight + 2);
        x = margin;
        
        section.rows[i].forEach((cell, colIndex) => {
          doc.text(String(cell), x, y + rowHeight - 2);
          x += colWidths[colIndex];
        });
        
        // Draw row separator
        if (i < section.rows.length - 1) {
          doc.setLineWidth(0.2);
          doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
        }
        
        y += rowHeight;
      }
      
      // Draw table border
      doc.setLineWidth(0.5);
      doc.line(margin, tableStartY, margin, y);
      doc.line(margin + contentWidth, tableStartY, margin + contentWidth, y);
      doc.line(margin, y, margin + contentWidth, y);
      
      y += 10;
    } else {
      // Simple text format for non-table sections
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      
      for (const row of section.rows.map(normalizeRow)) {
        ensureSpace(7);
        const line = row.join('   |   ');
        const wrapped = doc.splitTextToSize(line, contentWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5 + 1;
      }
      
      y += 8;
    }
  }

  // Add footer
  y = pageHeight - 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('This document is electronically generated and does not require a signature', margin, y);
  doc.text('For any queries, contact: info@umedhfoundation.org', margin, y + 4);

  doc.save(options.filename);
}

function calculateColumnWidths(rows: Array<Array<string | number>>, totalWidth: number): number[] {
  if (rows.length === 0) return [];
  
  const numCols = rows[0].length;
  const colWidths = new Array(numCols).fill(0);
  
  // Calculate maximum width needed for each column
  rows.forEach(row => {
    row.forEach((cell, colIndex) => {
      const text = String(cell);
      const textWidth = text.length * 2.5; // Approximate character width
      colWidths[colIndex] = Math.max(colWidths[colIndex], textWidth);
    });
  });
  
  // Normalize to fit within total width
  const totalCalculatedWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const scaleFactor = totalWidth / totalCalculatedWidth;
  
  return colWidths.map(width => width * scaleFactor);
}
