
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

export function exportToExcel(reportTitle, columns, data, totals, congregationName = 'Deborita Gestión Local') {
  // 1. Preparar las filas estructuradas para la hoja de Excel
  const wsData = [];

  // Encabezados institucionales
  wsData.push([congregationName || 'Deborita Gestión Local']);
  wsData.push([`Informe: ${reportTitle}`]);
  wsData.push([`Fecha de Generación: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`]);
  wsData.push([]); // Fila en blanco

  // Fila de encabezados de columna
  const headerRow = columns.map(c => c.header);
  wsData.push(headerRow);

  // Filas de datos
  data.forEach((item) => {
    const row = columns.map((col) => {
      const val = item[col.key];
      if (col.isCurrency) {
        if (typeof val === 'number') return val;
        const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      }
      return val ?? '-';
    });
    wsData.push(row);
  });

  // Fila de Totales
  if (totals) {
    const totalRow = columns.map((col, index) => {
      if (index === 0) return 'TOTAL GENERAL';
      if (col.isCurrency && totals[col.key] !== undefined) {
        const tVal = totals[col.key];
        return typeof tVal === 'number' ? tVal : (parseFloat(String(tVal).replace(/[^0-9.-]+/g, '')) || 0);
      }
      return '';
    });
    wsData.push(totalRow);
  }

  // 2. Crear la hoja de trabajo a partir del arreglo de datos
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 3. Configurar anchos automáticos de columnas (Auto-fit Columns)
  const colWidths = columns.map((col, cIdx) => {
    let maxLen = col.header.length;
    data.forEach(item => {
      const cellVal = String(item[col.key] ?? '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.max(maxLen + 4, 14) };
  });
  ws['!cols'] = colWidths;

  // 4. Crear el Libro de Trabajo (Workbook)
  const wb = XLSX.utils.book_new();
  const safeSheetName = (reportTitle || 'Reporte').replace(/[:\\\/\?\*\[\]]/g, '').slice(0, 30);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // 5. Descargar archivo .xlsx nativo
  const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToPDF(reportTitle, congregationName, columns, data, totals) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Encabezado Formal de Congregación
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(congregationName || 'Deborita Gestión Local', 40, 40);

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Informe Financiero: ${reportTitle}`, 40, 58);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')}`, 40, 72);

  doc.setLineWidth(1);
  doc.setDrawColor(226, 232, 240);
  doc.line(40, 82, 555, 82);

  // Mapear headers y datos para autoTable
  const headers = columns.map(c => c.header);
  const tableRows = data.map((item) => {
    return columns.map((col) => {
      const val = item[col.key];
      return col.isCurrency ? formatCurrency(val) : (val ?? '-');
    });
  });

  // Fila de Sumatoria Total Obligatoria
  if (totals) {
    const totalRow = columns.map((col, index) => {
      if (index === 0) return 'TOTAL GENERAL';
      if (col.isCurrency && totals[col.key] !== undefined) {
        return formatCurrency(totals[col.key]);
      }
      return '-';
    });
    tableRows.push(totalRow);
  }

  autoTable(doc, {
    startY: 95,
    head: [headers],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Vibrant Blue
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (dataCell) => {
      // Resaltar la fila final de Totales
      if (totals && dataCell.section === 'body' && dataCell.rowIndex === tableRows.length - 1) {
        dataCell.cell.styles.fontStyle = 'bold';
        dataCell.cell.styles.fillColor = [224, 231, 255]; // Soft Indigo highlight
        dataCell.cell.styles.textColor = [30, 27, 75];
      }
    }
  });

  const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
