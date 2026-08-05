import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './formatters';

export function exportToExcel(reportTitle, columns, data, totals) {
  // Construir filas para Excel
  const rows = data.map((item) => {
    const rowObj = {};
    columns.forEach((col) => {
      let val = item[col.key];
      if (col.isCurrency) {
        val = formatCurrency(val);
      }
      rowObj[col.header] = val;
    });
    return rowObj;
  });

  // Agregar fila final obligatoria de sumatoria total
  if (totals) {
    const totalsRow = {};
    columns.forEach((col, index) => {
      if (index === 0) {
        totalsRow[col.header] = 'TOTAL GENERAL';
      } else if (col.isCurrency && totals[col.key] !== undefined) {
        totalsRow[col.header] = formatCurrency(totals[col.key]);
      } else {
        totalsRow[col.header] = '-';
      }
    });
    rows.push(totalsRow);
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

  const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
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

  doc.autoTable({
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
