import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, formatLongDate, compareDatesAsc } from './formatters';
import { toast } from 'react-hot-toast';

/**
 * Función auxiliar para copiar texto con fallback robusto para todos los navegadores
 */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('navigator.clipboard failed, trying fallback', e);
    }
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  let successful = false;
  try {
    successful = document.execCommand('copy');
  } catch (err) {
    console.error('Fallback execCommand failed', err);
  }
  document.body.removeChild(textArea);
  return successful;
}

/**
 * Exporta un arreglo genérico de objetos a un archivo Excel (.csv con BOM UTF-8)
 */
export function exportToExcel(data, fileName = 'reporte_contable') {
  if (!data || data.length === 0) {
    toast.error('No hay datos disponibles para exportar');
    return;
  }

  // Obtener encabezados
  const headers = Object.keys(data[0]);
  
  // Construir filas
  const csvRows = [];
  csvRows.push(headers.join(';')); // Punto y coma es estándar para Excel en español

  data.forEach(row => {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'string') {
        // Escapar comillas dobles y saltos de línea
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(';'));
  });

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // BOM UTF-8 para que Excel reconozca tildes y ñ
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success('Archivo Excel descargado con éxito');
}

/**
 * Exporta el reporte de ofrendas a un archivo Excel (.xlsx) con la estructura exacta:
 * Título: Ingresos Ofrendas Mensual
 * Columnas: Fecha | Comité | Valor
 * Fila final: Total
 */
export function exportOfferingsToExcel({
  offerings = [],
  committees = [],
  monthName = '',
  title = 'Ingresos Ofrendas Mensual',
  fileName = 'Ingresos_Ofrendas_Mensual'
}) {
  if (!offerings || offerings.length === 0) {
    toast.error('No hay ofrendas registradas para exportar');
    return;
  }

  // Ordenar cronológicamente del día 1 al 31
  const sorted = [...offerings].sort((a, b) => compareDatesAsc(a.date, b.date));

  // Mapa de nombres de comités
  const committeeMap = {};
  if (Array.isArray(committees)) {
    committees.forEach(c => {
      if (c && c.id) committeeMap[c.id] = c.name;
    });
  }

  const wsData = [];

  // Fila 1: Título superior
  const reportHeader = monthName ? `Ingresos Ofrendas Mensual - ${monthName}` : title;
  wsData.push([reportHeader, '', '']);

  // Fila 2: Encabezados de columnas
  wsData.push(['Fecha', 'Comité', 'Valor']);

  let totalAmount = 0;

  // Filas de datos
  sorted.forEach(o => {
    const fechaStr = formatLongDate(o.date) || formatDate(o.date);
    const baseCommName = committeeMap[o.destinationCommitteeId] || o.committeeName || 'General';
    
    // Extraer notas u observaciones adicionales (sin corchetes repetidos)
    const rawNote = (o.notes || o.description || '').replace(/^\[.*?\]\s*/, '').replace(/^\[|\]$/g, '').trim();
    let comiteStr = baseCommName;
    if (rawNote && rawNote.toLowerCase() !== baseCommName.toLowerCase()) {
      comiteStr = `${baseCommName} (${rawNote})`;
    }

    const amt = typeof o.amount === 'number' ? o.amount : (parseFloat(String(o.amount).replace(/[^0-9.-]+/g, '')) || 0);
    totalAmount += amt;

    wsData.push([fechaStr, comiteStr, amt]);
  });

  // Fila final de Totales
  wsData.push(['Total', '', totalAmount]);

  // Crear la hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Unir celdas del título superior (A1:C1)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
  ];

  // Aplicar formato de moneda a la columna 'Valor' (columna C, índice 2)
  for (let r = 2; r < wsData.length; r++) {
    const cellRef = XLSX.utils.encode_cell({ r: r, c: 2 });
    if (ws[cellRef]) {
      ws[cellRef].t = 'n';
      ws[cellRef].z = '"$"#,##0';
    }
  }

  // Anchos automáticos de columnas ajustados profesionalmente
  ws['!cols'] = [
    { wch: 34 }, // Fecha (sábado, 1 de agosto de 2026)
    { wch: 48 }, // Comité (Junta Local (Ofrenda ayuda a damnificados))
    { wch: 20 }  // Valor ($ 1.847.800)
  ];

  // Crear el libro de trabajo y descargar
  const wb = XLSX.utils.book_new();
  const safeSheetName = (monthName || 'Ofrendas').slice(0, 30);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const cleanFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
  toast.success('📊 ¡Archivo Excel generado con éxito!');
}

/**
 * Comparte liquidación de diezmo por WhatsApp
 */
export function shareTitheWhatsApp(tithe, pastorName = 'Pastor', congName = '') {
  let text = `📜 *COMPROBANTE OFICIAL DE LIQUIDACIÓN DE DIEZMOS*\n`;
  if (congName) text += `🏛️ *Congregación:* ${congName}\n`;
  text += `📅 *Fecha:* ${formatDate(tithe.date || new Date())}\n`;
  text += `👤 *Pastor Titular:* ${pastorName}\n`;
  text += `------------------------------------\n`;
  text += `💰 *Diezmo Bruto Recaudado:* ${formatCurrency(tithe.grossTithe || 0)}\n`;
  text += `🔴 *Fondo Nacional (${tithe.nationalPercentage || 10}%):* -${formatCurrency(tithe.nationalTreasury || 0)}\n`;
  text += `🟠 *Fondo Local:* -${formatCurrency(tithe.localFundAport || 0)}\n`;
  text += `------------------------------------\n`;
  text += `💵 *Ingreso Neto Distribuible:* ${formatCurrency(tithe.netIncome || 0)}\n`;
  text += `⭐ *ASIGNACIÓN AL PASTOR (${tithe.correctedPoint || 50}%):* ${formatCurrency(tithe.pastorAllocation || 0)}\n`;
  text += `====================================\n`;
  text += `_Generado por Sistema Deborita Gestión Local_`;

  const encoded = encodeURI(text);
  navigator.clipboard.writeText(text);
  toast.success('Comprobante copiado. Abriendo WhatsApp...');
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

/**
 * Comparte ofrenda por WhatsApp
 */
export function shareOfferingWhatsApp(offering, committeeName = 'Comité', congName = '') {
  let text = `✨ *COMPROBANTE DE RECAUDACIÓN DE OFRENDA*\n`;
  if (congName) text += `🏛️ *Congregación:* ${congName}\n`;
  text += `📅 *Fecha:* ${formatDate(offering.date || new Date())}\n`;
  text += `📁 *Destino:* ${committeeName}\n`;
  text += `📝 *Tipo/Concepto:* ${offering.type || 'Ofrenda General'}\n`;
  text += `💰 *Monto Recaudado:* ${formatCurrency(offering.amount || 0)}\n`;
  if (offering.notes) text += `📋 *Observaciones:* ${offering.notes}\n`;
  text += `====================================\n`;
  text += `_Generado por Sistema Deborita Gestión Local_`;

  const encoded = encodeURI(text);
  navigator.clipboard.writeText(text);
  toast.success('Comprobante copiado. Abriendo WhatsApp...');
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

/**
 * Abre una ventana imprimible / PDF con el reporte completo de diezmos filtrados, promedios y diseño elegante sin firmas
 */
export function printFilteredTithesReport({
  congregationName = 'Deborita Gestión Local',
  pastorName = 'Pastor',
  period = 'Historial Consolidado',
  tithes = [],
  totals = {},
  averages = {}
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir');
    return;
  }

  // Ordenar diezmos cronológicamente por año y mes
  const sorted = [...tithes].sort((a, b) => {
    const yDiff = Number(a.year || 0) - Number(b.year || 0);
    if (yDiff !== 0) return yDiff;
    return Number(a.month || 0) - Number(b.month || 0);
  });

  const count = sorted.length;
  const totGross = totals.grossIncome ?? sorted.reduce((sum, t) => sum + (Number(t.grossTithe ?? t.grossIncome ?? 0)), 0);
  const totNational = totals.nationalShare ?? sorted.reduce((sum, t) => sum + (Number(t.nationalTreasury ?? t.nationalShare ?? 0)), 0);
  const totNet = totals.netIncome ?? sorted.reduce((sum, t) => sum + (Number(t.netIncome ?? 0)), 0);
  const totLocal = totals.localFundAport ?? sorted.reduce((sum, t) => sum + (Number(t.localFundAport ?? 0)), 0);
  const totPastor = totals.pastorAllocation ?? sorted.reduce((sum, t) => sum + (Number(t.pastorAllocation ?? 0)), 0);

  const avgGross = averages.avgGross ?? (count > 0 ? Math.round(totGross / count) : 0);
  const avgNational = averages.avgNational ?? (count > 0 ? Math.round(totNational / count) : 0);
  const avgNet = averages.avgNet ?? (count > 0 ? Math.round(totNet / count) : 0);
  const avgLocal = averages.avgLocal ?? (count > 0 ? Math.round(totLocal / count) : 0);
  const avgPastor = averages.avgPastor ?? (count > 0 ? Math.round(totPastor / count) : 0);

  const rowsHtml = sorted.map((t, idx) => {
    const gross = Number(t.grossTithe ?? t.grossIncome ?? 0);
    const nat = Number(t.nationalTreasury ?? t.nationalShare ?? 0);
    const net = Number(t.netIncome ?? (gross - nat));
    const pts = t.correctedPoint ?? t.pastorAllocationPercentage ?? 0;
    const local = Number(t.localFundAport ?? 0);
    const pastor = Number(t.pastorAllocation ?? 0);
    const pName = t.pastorName || t.balanceGroup || pastorName || 'Pastor';
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `
      <tr style="border-bottom: 1.5px solid #e2e8f0; background: ${rowBg};">
        <td style="padding: 13px 16px; font-weight: 900; color: #4338ca; font-size: 15px;">${String(t.month).padStart(2, '0')}/${t.year}</td>
        <td style="padding: 13px 16px; font-weight: 700; color: #1e293b; font-size: 14.5px;">${pName}</td>
        <td style="padding: 13px 16px; text-align: right; font-weight: 900; color: #6b21a8; font-size: 15px;">${formatCurrency(gross)}</td>
        <td style="padding: 13px 16px; text-align: right; font-weight: 800; color: #b91c1c; font-size: 15px;">-${formatCurrency(nat)}</td>
        <td style="padding: 13px 16px; text-align: right; font-weight: 900; color: #1e40af; font-size: 15px;">${formatCurrency(net)}</td>
        <td style="padding: 13px 16px; text-align: center; font-weight: 800; color: #92400e; font-size: 14px;">${typeof pts === 'number' ? pts.toFixed(2) : pts}%</td>
        <td style="padding: 13px 16px; text-align: right; font-weight: 800; color: #0f172a; font-size: 15px;">${formatCurrency(local)}</td>
        <td style="padding: 13px 16px; text-align: right; font-weight: 950; color: #15803d; font-size: 16px;">${formatCurrency(pastor)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Informe de Diezmos - ${congregationName}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #0f172a;
            max-width: 1050px;
            margin: 0 auto;
            background: #ffffff;
            font-size: 15px;
          }
          .header {
            text-align: center;
            border-bottom: 3.5px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 28px;
            font-weight: 950;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #1e1b4b;
          }
          .sub {
            font-size: 16px;
            color: #4338ca;
            margin-top: 8px;
            font-weight: 800;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            font-size: 14.5px;
            color: #334155;
            background: #f1f5f9;
            padding: 14px 18px;
            border-radius: 12px;
            border: 1.5px solid #cbd5e1;
            font-weight: 600;
          }
          .kpi-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 28px;
          }
          .kpi {
            padding: 16px 14px;
            border-radius: 14px;
            border: 2px solid #e2e8f0;
            background: #f8fafc;
            text-align: center;
          }
          .kpi-label {
            font-size: 12.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #475569;
            display: block;
          }
          .kpi-val {
            font-size: 23px;
            font-weight: 950;
            margin-top: 6px;
          }
          .kpi-sub {
            font-size: 13.5px;
            font-weight: 800;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1.5px dashed #cbd5e1;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 14.5px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid #c7d2fe;
          }
          th {
            background: #e0e7ff;
            color: #1e1b4b;
            padding: 14px 16px;
            text-transform: uppercase;
            font-size: 13.5px;
            font-weight: 950;
            letter-spacing: 0.6px;
            border-bottom: 3px solid #6366f1;
          }
          .total-row td {
            background: #e0e7ff !important;
            color: #1e1b4b !important;
            font-weight: 950 !important;
            border-top: 3px solid #4338ca !important;
            padding: 16px;
            font-size: 16.5px;
          }
          .avg-row td {
            background: #f1f5f9 !important;
            color: #1e293b !important;
            font-weight: 900 !important;
            border-top: 1.5px solid #cbd5e1 !important;
            padding: 14px 16px;
            font-size: 15.5px;
          }
          .footer {
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            margin-top: 40px;
            border-top: 1.5px solid #e2e8f0;
            padding-top: 16px;
          }
          @media print {
            body { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">INFORME DE LIQUIDACIÓN DE DIEZMOS</h1>
          <p class="sub">${congregationName} | Período: ${period} | Pastor Titular: ${pastorName}</p>
        </div>

        <div class="meta">
          <span><strong>Registros Liquidados:</strong> ${count} ${count === 1 ? 'mes' : 'meses'}</span>
          <span><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span><strong>Sistema:</strong> Deborita Cloud</span>
        </div>

        <div class="kpi-container">
          <div class="kpi" style="border-color: #c084fc; background: #faf5ff;">
            <span class="kpi-label" style="color: #6b21a8;">Diezmo Bruto Total</span>
            <div class="kpi-val" style="color: #581c87;">${formatCurrency(totGross)}</div>
            <div class="kpi-sub" style="color: #6b21a8;">Promedio: ${formatCurrency(avgGross)}/mes</div>
          </div>

          <div class="kpi" style="border-color: #fda4af; background: #fff1f2;">
            <span class="kpi-label" style="color: #be123c;">Tesorería Nacional (21%)</span>
            <div class="kpi-val" style="color: #991b1b;">-${formatCurrency(totNational)}</div>
            <div class="kpi-sub" style="color: #be123c;">Promedio: -${formatCurrency(avgNational)}/mes</div>
          </div>

          <div class="kpi" style="border-color: #93c5fd; background: #eff6ff;">
            <span class="kpi-label" style="color: #1d4ed8;">Ingreso Neto Distribuible</span>
            <div class="kpi-val" style="color: #1e3a8a;">${formatCurrency(totNet)}</div>
            <div class="kpi-sub" style="color: #1d4ed8;">Promedio: ${formatCurrency(avgNet)}/mes</div>
          </div>

          <div class="kpi" style="border-color: #86efac; background: #f0fdf4;">
            <span class="kpi-label" style="color: #15803d;">Asignación Pastoral</span>
            <div class="kpi-val" style="color: #14532d;">${formatCurrency(totPastor)}</div>
            <div class="kpi-sub" style="color: #15803d;">Promedio: ${formatCurrency(avgPastor)}/mes</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Mes/Año</th>
              <th style="text-align: left;">Pastor</th>
              <th style="text-align: right;">Diezmo Bruto</th>
              <th style="text-align: right;">Tesorería Nac.</th>
              <th style="text-align: right;">Ingreso Neto</th>
              <th style="text-align: center;">Puntos</th>
              <th style="text-align: right;">Fondo Local</th>
              <th style="text-align: right;">Asign. Pastor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="2">TOTALES CONSOLIDADOS (${count} MESES)</td>
              <td style="text-align: right;">${formatCurrency(totGross)}</td>
              <td style="text-align: right;">-${formatCurrency(totNational)}</td>
              <td style="text-align: right;">${formatCurrency(totNet)}</td>
              <td style="text-align: center;">-</td>
              <td style="text-align: right;">${formatCurrency(totLocal)}</td>
              <td style="text-align: right;">${formatCurrency(totPastor)}</td>
            </tr>
            <tr class="avg-row">
              <td colspan="2">PROMEDIOS MENSUALES CALCULADOS</td>
              <td style="text-align: right; color: #581c87;">${formatCurrency(avgGross)}</td>
              <td style="text-align: right; color: #991b1b;">-${formatCurrency(avgNational)}</td>
              <td style="text-align: right; color: #1e3a8a;">${formatCurrency(avgNet)}</td>
              <td style="text-align: center;">-</td>
              <td style="text-align: right;">${formatCurrency(avgLocal)}</td>
              <td style="text-align: right; color: #14532d;">${formatCurrency(avgPastor)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Documento generado electrónicamente por Sistema de Contabilidad Deborita. Válido para control interno, auditoría contable y reporte congregacional.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Exporta el reporte de diezmos a un archivo Excel (.xlsx) nativo con formato, totales y promedios
 */
export function exportTithesToExcel({
  tithes = [],
  pastorName = 'Pastor',
  period = '',
  congregationName = 'Deborita Gestión Local',
  fileName = 'Liquidacion_Diezmos'
}) {
  if (!tithes || tithes.length === 0) {
    toast.error('No hay diezmos liquidados para exportar');
    return;
  }

  const sorted = [...tithes].sort((a, b) => {
    const yDiff = Number(a.year || 0) - Number(b.year || 0);
    if (yDiff !== 0) return yDiff;
    return Number(a.month || 0) - Number(b.month || 0);
  });

  const count = sorted.length;
  let totGross = 0;
  let totNational = 0;
  let totNet = 0;
  let totLocal = 0;
  let totPastor = 0;

  const wsData = [];
  const headerTitle = `INFORME DE LIQUIDACIÓN DE DIEZMOS - ${period || 'Historial'}`;
  wsData.push([headerTitle, '', '', '', '', '', '', '']);
  wsData.push([`Congregación: ${congregationName}`, '', '', '', '', '', '', '']);
  wsData.push([]); // blank

  wsData.push(['Mes/Año', 'Pastor', 'Diezmo Bruto', 'Tesorería Nacional', 'Ingreso Neto', 'Puntos (%)', 'Fondo Local', 'Asignación Pastor']);

  sorted.forEach(t => {
    const gross = Number(t.grossTithe ?? t.grossIncome ?? 0);
    const nat = Number(t.nationalTreasury ?? t.nationalShare ?? 0);
    const net = Number(t.netIncome ?? (gross - nat));
    const pts = t.correctedPoint ?? t.pastorAllocationPercentage ?? 0;
    const local = Number(t.localFundAport ?? 0);
    const pastor = Number(t.pastorAllocation ?? 0);
    const pName = t.pastorName || t.balanceGroup || pastorName || 'Pastor';

    totGross += gross;
    totNational += nat;
    totNet += net;
    totLocal += local;
    totPastor += pastor;

    wsData.push([
      `${String(t.month).padStart(2, '0')}/${t.year}`,
      pName,
      gross,
      nat,
      net,
      typeof pts === 'number' ? `${pts.toFixed(2)}%` : `${pts}%`,
      local,
      pastor
    ]);
  });

  // Totales
  wsData.push([
    `TOTALES (${count} MESES)`,
    '',
    totGross,
    totNational,
    totNet,
    '',
    totLocal,
    totPastor
  ]);

  // Promedios
  wsData.push([
    'PROMEDIOS MENSUALES',
    '',
    count > 0 ? Math.round(totGross / count) : 0,
    count > 0 ? Math.round(totNational / count) : 0,
    count > 0 ? Math.round(totNet / count) : 0,
    '',
    count > 0 ? Math.round(totLocal / count) : 0,
    count > 0 ? Math.round(totPastor / count) : 0
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
  ];

  // Formato de moneda para columnas C, D, E, G, H (índices 2, 3, 4, 6, 7)
  const currencyCols = [2, 3, 4, 6, 7];
  for (let r = 4; r < wsData.length; r++) {
    currencyCols.forEach(c => {
      const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
      if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
        ws[cellRef].t = 'n';
        ws[cellRef].z = '"$"#,##0';
      }
    });
  }

  ws['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Diezmos');
  const cleanFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
  toast.success('📊 ¡Archivo Excel generado con éxito!');
}

/**
 * Genera el texto estructurado del resumen histórico de diezmos
 */
export function buildTithesHistorySummaryText({ congregationName = '', pastorName = '', period = '', tithes = [], totals = {}, averages = {} }) {
  const sorted = [...tithes].sort((a, b) => {
    const yDiff = Number(a.year || 0) - Number(b.year || 0);
    if (yDiff !== 0) return yDiff;
    return Number(a.month || 0) - Number(b.month || 0);
  });

  const count = sorted.length;
  const totGross = totals.grossIncome ?? sorted.reduce((sum, t) => sum + (Number(t.grossTithe ?? t.grossIncome ?? 0)), 0);
  const totNational = totals.nationalShare ?? sorted.reduce((sum, t) => sum + (Number(t.nationalTreasury ?? t.nationalShare ?? 0)), 0);
  const totNet = totals.netIncome ?? sorted.reduce((sum, t) => sum + (Number(t.netIncome ?? 0)), 0);
  const totPastor = totals.pastorAllocation ?? sorted.reduce((sum, t) => sum + (Number(t.pastorAllocation ?? 0)), 0);

  const avgGross = averages.avgGross ?? (count > 0 ? Math.round(totGross / count) : 0);
  const avgPastor = averages.avgPastor ?? (count > 0 ? Math.round(totPastor / count) : 0);

  let text = `📜 *INFORME CONSOLIDADO DE DIEZMOS*\n`;
  if (congregationName) text += `🏛️ *Congregación:* ${congregationName}\n`;
  if (period) text += `🗓️ *Período:* ${period}\n`;
  if (pastorName) text += `👤 *Pastor Titular:* ${pastorName}\n`;
  text += `------------------------------------\n`;
  text += `💰 *Total Diezmo Bruto (${count} meses):* ${formatCurrency(totGross)}\n`;
  text += `🔴 *Total Fondo Nacional:* -${formatCurrency(totNational)}\n`;
  text += `💵 *Total Ingreso Neto:* ${formatCurrency(totNet)}\n`;
  text += `⭐ *TOTAL ASIGNACIÓN PASTORAL:* ${formatCurrency(totPastor)}\n`;
  text += `------------------------------------\n`;
  text += `📊 *PROMEDIOS MENSUALES:*\n`;
  text += `• Diezmo Bruto Promedio: ${formatCurrency(avgGross)}/mes\n`;
  text += `• Asignación Pastoral Promedio: ${formatCurrency(avgPastor)}/mes\n`;
  text += `------------------------------------\n`;
  text += `📋 *DESGLOSE MES A MES:*\n`;

  if (sorted.length === 0) {
    text += `_Sin liquidaciones registradas en este período._\n`;
  } else {
    sorted.forEach(t => {
      const p = `${String(t.month).padStart(2, '0')}/${t.year}`;
      const g = formatCurrency(Number(t.grossTithe ?? t.grossIncome ?? 0));
      const a = formatCurrency(Number(t.pastorAllocation ?? 0));
      text += `• *${p}:* Bruto: ${g} | Neto Pastoral: *${a}*\n`;
    });
  }

  text += `====================================\n`;
  text += `_Generado por Sistema Deborita Gestión Local_`;
  return text;
}

export async function copyTithesHistoryText(params) {
  const text = buildTithesHistorySummaryText(params);
  await copyTextToClipboard(text);

  if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: `Informe de Diezmos`,
        text: text
      });
      return;
    } catch (e) {}
  }
  toast.success('📋 ¡Resumen de diezmos copiado al portapapeles!');
}

export function shareTithesHistoryWhatsApp(params) {
  const text = buildTithesHistorySummaryText(params);
  const encoded = encodeURI(text);
  copyTextToClipboard(text);
  toast.success('Reporte copiado. Abriendo WhatsApp...');
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

/**
 * Abre una ventana imprimible / PDF con el comprobante oficial membretado
 */
export function printOfficialReceipt({ title, subtitle, congregationName, date, details = [], total, notes, signatures = [] }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir');
    return;
  }

  const detailsHtml = details.map(d => `
    <tr style="border-bottom: 1.5px solid #e2e8f0;">
      <td style="padding: 12px 14px; font-weight: 700; color: #334155; font-size: 14.5px;">${d.label}</td>
      <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: ${d.color || '#0f172a'}; font-size: 15.5px;">${d.value}</td>
    </tr>
  `).join('');

  const signaturesHtml = signatures.map(s => `
    <div style="text-align: center; width: 45%;">
      <div style="border-bottom: 2px solid #0f172a; height: 50px; margin-bottom: 8px;"></div>
      <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">${s.name}</p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">${s.role}</p>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${congregationName}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 35px;
            color: #0f172a;
            max-width: 850px;
            margin: 0 auto;
            background: #ffffff;
            font-size: 14.5px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 18px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 24px;
            font-weight: 950;
            margin: 0;
            text-transform: uppercase;
            color: #1e3a8a;
            letter-spacing: 0.5px;
          }
          .sub {
            font-size: 15px;
            color: #475569;
            margin-top: 6px;
            font-weight: 700;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 22px;
            font-size: 13.5px;
            color: #334155;
            background: #f8fafc;
            padding: 10px 14px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 26px;
            font-size: 14.5px;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            overflow: hidden;
          }
          th {
            background: #e2e8f0;
            color: #1e293b;
            padding: 12px 14px;
            text-transform: uppercase;
            font-size: 13px;
            font-weight: 950;
            letter-spacing: 0.5px;
          }
          .total-box {
            background: #eff6ff;
            border: 2.5px solid #93c5fd;
            border-radius: 14px;
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }
          .total-title {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            color: #1e3a8a;
          }
          .total-value {
            font-size: 26px;
            font-weight: 950;
            color: #1d4ed8;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 55px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #64748b;
            margin-top: 40px;
            border-top: 1.5px solid #e2e8f0;
            padding-top: 14px;
            font-weight: 500;
          }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          <p class="sub">${congregationName || 'Gestión Financiera Eclesiástica'} - ${subtitle || ''}</p>
        </div>

        <div class="meta">
          <span><strong>Fecha de Emisión:</strong> ${date}</span>
          <span><strong>Sistema:</strong> Deborita Cloud</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Concepto / Descripción</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${detailsHtml}
          </tbody>
        </table>

        ${total ? `
          <div class="total-box">
            <span class="total-title">Total Oficial Liquidado</span>
            <span class="total-value">${total}</span>
          </div>
        ` : ''}

        ${notes ? `
          <div style="font-size: 13.5px; color: #334155; margin-bottom: 24px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; border: 1.5px solid #e2e8f0;">
            <strong>Observaciones:</strong> ${notes}
          </div>
        ` : ''}

        <div class="signatures">
          ${signaturesHtml}
        </div>

        <div class="footer">
          Documento generado electrónicamente por Sistema de Contabilidad Deborita. Válido para control interno y auditoría contable.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Abre una ventana imprimible / PDF con el reporte completo de un comité filtrado
 */
export function printFilteredCommitteeReport({ committeeName, treasurerName = '', monthName = '', movements = [], totals = { income: 0, expense: 0, net: 0 }, congregationName = '' }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir el reporte');
    return;
  }

  // Ordenar movimientos por fecha del día 1 al 31 (ascendente)
  const sorted = [...movements].sort((a, b) => compareDatesAsc(a.date, b.date));

  const rowsHtml = sorted.map((m, idx) => {
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `
      <tr style="border-bottom: 1.5px solid #e2e8f0; background: ${rowBg}; ${m.annulled ? 'opacity: 0.55;' : ''}">
        <td style="padding: 12px 14px; font-weight: 800; font-size: 14px; color: #1e293b;">${formatDate(m.date)}</td>
        <td style="padding: 12px 14px; font-weight: 900; font-size: 14px; color: ${m.type === 'INGRESO' ? '#16a34a' : '#dc2626'};">${m.type}</td>
        <td style="padding: 12px 14px; font-size: 14px; color: #334155; font-weight: 600;">${m.description || 'Sin descripción'} ${m.annulled ? '<span style="color:#dc2626;font-weight:900;">(ANULADO)</span>' : ''}</td>
        <td style="padding: 12px 14px; text-align: right; font-weight: 900; font-size: 15px; color: ${m.type === 'INGRESO' ? '#15803d' : '#b91c1c'};">
          ${m.type === 'INGRESO' ? '+' : '-'}${formatCurrency(m.amount || 0)}
        </td>
        <td style="padding: 12px 14px; text-align: center; font-size: 12.5px; font-weight: 800; color: ${m.annulled ? '#b91c1c' : '#0369a1'};">${m.annulled ? 'Anulado' : 'Activo'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte Comité - ${committeeName}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 35px;
            color: #0f172a;
            max-width: 950px;
            margin: 0 auto;
            background: #ffffff;
            font-size: 14.5px;
          }
          .header {
            text-align: center;
            border-bottom: 3.5px solid #2563eb;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .title {
            font-size: 26px;
            font-weight: 950;
            margin: 0;
            text-transform: uppercase;
            color: #1e3a8a;
            letter-spacing: 0.5px;
          }
          .sub {
            font-size: 15.5px;
            color: #3b82f6;
            margin-top: 6px;
            font-weight: 800;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 13.5px;
            color: #334155;
            background: #f1f5f9;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1.5px solid #cbd5e1;
            font-weight: 600;
          }
          .kpi-container {
            display: flex;
            gap: 14px;
            margin-bottom: 24px;
          }
          .kpi {
            flex: 1;
            padding: 16px 14px;
            border-radius: 14px;
            border: 2px solid #cbd5e1;
            text-align: center;
            background: #f8fafc;
          }
          .kpi-val {
            font-size: 22px;
            font-weight: 950;
            margin-top: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 26px;
            font-size: 14px;
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            overflow: hidden;
          }
          th {
            background: #e2e8f0;
            color: #1e293b;
            padding: 13px 14px;
            text-transform: uppercase;
            font-size: 13px;
            font-weight: 950;
            text-align: left;
            letter-spacing: 0.5px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 55px;
          }
          .footer {
            text-align: center;
            font-size: 11.5px;
            color: #64748b;
            margin-top: 35px;
            border-top: 1.5px solid #e2e8f0;
            padding-top: 14px;
            font-weight: 500;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">ESTADO DE CUENTA - ${committeeName}</h1>
          <p class="sub">${congregationName || 'Deborita Gestión Local'} | Período: ${monthName || 'Histórico Completo'}</p>
        </div>

        <div class="meta">
          <span><strong>Tesorero(a) a Cargo:</strong> ${treasurerName || 'Sin asignar'}</span>
          <span><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        <div class="kpi-container">
          <div class="kpi" style="border-color: #86efac; background: #f0fdf4;">
            <span style="font-size: 12px; color: #16a34a; font-weight: 900; text-transform: uppercase;">Total Aportes / Ingresos</span>
            <div class="kpi-val" style="color: #15803d;">+${formatCurrency(totals.income)}</div>
          </div>
          <div class="kpi" style="border-color: #fca5a5; background: #fff1f2;">
            <span style="font-size: 12px; color: #dc2626; font-weight: 900; text-transform: uppercase;">Total Egresos</span>
            <div class="kpi-val" style="color: #b91c1c;">-${formatCurrency(totals.expense)}</div>
          </div>
          <div class="kpi" style="border-color: #93c5fd; background: #eff6ff;">
            <span style="font-size: 12px; color: #1d4ed8; font-weight: 900; text-transform: uppercase;">Saldo Neto Período</span>
            <div class="kpi-val" style="color: #1e3a8a;">${formatCurrency(totals.net)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha (Día 1-31)</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th style="text-align: right;">Monto</th>
              <th style="text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 2px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">${treasurerName || 'Tesorero(a) del Comité'}</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Tesorería del Comité</p>
          </div>
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 2px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">Pastor Titular / Tesorería General</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Visto Bueno y Aprobación</p>
          </div>
        </div>

        <div class="footer">
          Documento generado por Sistema de Contabilidad Deborita. Válido para control interno e informe congregacional.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Genera el texto estructurado del resumen de un comité
 */
export function buildCommitteeSummaryText({ committeeName, treasurerName = '', monthName = '', movements = [], totals = { income: 0, expense: 0, net: 0 }, congregationName = '' }) {
  const sorted = [...movements].sort((a, b) => compareDatesAsc(a.date, b.date));

  let text = `📊 *REPORTE DE COMITÉ: ${committeeName.toUpperCase()}*\n`;
  if (congregationName) text += `🏛️ *Congregación:* ${congregationName}\n`;
  if (monthName) text += `🗓️ *Período:* ${monthName}\n`;
  if (treasurerName) text += `👤 *Tesorero(a):* ${treasurerName}\n`;
  text += `------------------------------------\n`;
  text += `💰 *Total Aportes / Ingresos:* +${formatCurrency(totals.income)}\n`;
  text += `🔴 *Total Egresos:* -${formatCurrency(totals.expense)}\n`;
  text += `💵 *SALDO NETO PERÍODO:* ${formatCurrency(totals.net)}\n`;
  text += `------------------------------------\n`;
  text += `📋 *DESGLOSE (Del 1 al 31 en orden):*\n`;

  if (sorted.length === 0) {
    text += `_Sin transacciones registradas en este período._\n`;
  } else {
    sorted.forEach((m) => {
      const d = formatDate(m.date);
      const sign = m.type === 'INGRESO' ? '+' : '-';
      const ann = m.annulled ? ' (ANULADO)' : '';
      text += `• ${d}: ${m.description || 'Movimiento'} (${sign}${formatCurrency(m.amount)})${ann}\n`;
    });
  }

  text += `====================================\n`;
  text += `_Generado por Sistema Deborita Gestión Local_`;
  return text;
}

/**
 * Copia o Comparte el resumen en texto de un comité
 */
export async function copyCommitteeSummaryText(params) {
  const text = buildCommitteeSummaryText(params);
  await copyTextToClipboard(text);

  if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: `Reporte ${params.committeeName}`,
        text: text
      });
      return;
    } catch (e) {
      // Ignorar si el usuario cancela la ventana nativa
    }
  }

  toast.success('📋 ¡Resumen en texto copiado al portapapeles!');
}

/**
 * Comparte el reporte filtrado de un comité por WhatsApp
 */
export function shareCommitteeReportWhatsApp(params) {
  const text = buildCommitteeSummaryText(params);
  const encoded = encodeURI(text);
  copyTextToClipboard(text);
  toast.success('Reporte copiado. Abriendo WhatsApp...');
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

/**
 * Abre una ventana imprimible / PDF con el reporte completo de ofrendas filtrado
 */
export function printFilteredOfferingsReport({ monthName = '', offerings = [], totalAmount = 0, congregationName = '', committeeMap = {} }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir');
    return;
  }

  // Ordenar ofrendas por fecha del día 1 al 31 (ascendente)
  const sorted = [...offerings].sort((a, b) => compareDatesAsc(a.date, b.date));

  const rowsHtml = sorted.map((o, idx) => {
    const comName = committeeMap[o.destinationCommitteeId] || 'General';
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fffbeb';
    return `
      <tr style="border-bottom: 1.5px solid #fed7aa; background: ${rowBg};">
        <td style="padding: 12px 14px; font-weight: 800; font-size: 14px; color: #1e293b;">${formatDate(o.date)}</td>
        <td style="padding: 12px 14px; font-weight: 900; font-size: 14px; color: #b45309;">${o.dayOfWeek || ''}</td>
        <td style="padding: 12px 14px; font-weight: 700; font-size: 14px; color: #78350f;">${comName}</td>
        <td style="padding: 12px 14px; text-align: right; font-weight: 900; font-size: 15.5px; color: #0f172a;">${formatCurrency(o.amount || 0)}</td>
        <td style="padding: 12px 14px; font-size: 13px; font-weight: 600; color: #334155;">${o.responsible || 'Tesorero'}</td>
        <td style="padding: 12px 14px; font-size: 13px; color: #475569;">${(o.notes || o.description || '').replace(/^\[|\]$/g, '')}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Ofrendas - ${monthName || 'Histórico'}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 35px;
            color: #0f172a;
            max-width: 950px;
            margin: 0 auto;
            background: #ffffff;
            font-size: 14.5px;
          }
          .header {
            text-align: center;
            border-bottom: 3.5px solid #f59e0b;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .title {
            font-size: 26px;
            font-weight: 950;
            margin: 0;
            text-transform: uppercase;
            color: #92400e;
            letter-spacing: 0.5px;
          }
          .sub {
            font-size: 15.5px;
            color: #b45309;
            margin-top: 6px;
            font-weight: 800;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 13.5px;
            color: #475569;
            background: #fffbeb;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1.5px solid #fde68a;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 26px;
            font-size: 14px;
            border: 2px solid #fed7aa;
            border-radius: 12px;
            overflow: hidden;
          }
          th {
            background: #fef3c7;
            padding: 13px 14px;
            text-transform: uppercase;
            font-size: 13px;
            text-align: left;
            color: #78350f;
            font-weight: 950;
            letter-spacing: 0.5px;
          }
          .total-box {
            background: #fffbeb;
            border: 2.5px solid #fde68a;
            border-radius: 14px;
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 26px;
          }
          .total-val {
            font-size: 26px;
            font-weight: 950;
            color: #b45309;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 55px;
          }
          .footer {
            text-align: center;
            font-size: 11.5px;
            color: #64748b;
            margin-top: 35px;
            border-top: 1.5px solid #e2e8f0;
            padding-top: 14px;
            font-weight: 500;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">REPORTE OFICIAL DE OFRENDAS</h1>
          <p class="sub">${congregationName || 'Deborita Gestión Local'} | Período: ${monthName || 'Histórico Completo'}</p>
        </div>

        <div class="meta">
          <span><strong>Total Registros:</strong> ${sorted.length} ofrendas</span>
          <span><strong>Fecha de Impresión:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        <div class="total-box">
          <span style="font-weight: 900; font-size: 15px; text-transform: uppercase; color: #92400e;">Gran Total Recaudado</span>
          <span class="total-val">${formatCurrency(totalAmount)}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha (Día 1-31)</th>
              <th>Día Culto</th>
              <th>Comité Destino</th>
              <th style="text-align: right;">Monto</th>
              <th>Responsable</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 2px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">Tesorero(a) Local</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Responsable de Recaudo</p>
          </div>
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 2px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">Pastor Titular</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Visto Bueno y Aprobación</p>
          </div>
        </div>

        <div class="footer">
          Documento generado electrónicamente por Sistema Deborita. Válido para auditoría y control financiero.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Genera el texto estructurado del resumen de ofrendas
 */
export function buildOfferingsSummaryText({ monthName = '', offerings = [], totalAmount = 0, congregationName = '', committeeMap = {} }) {
  const sorted = [...offerings].sort((a, b) => compareDatesAsc(a.date, b.date));

  let text = `✨ *REPORTE OFICIAL DE RECAUDACIÓN DE OFRENDAS*\n`;
  if (congregationName) text += `🏛️ *Congregación:* ${congregationName}\n`;
  if (monthName) text += `🗓️ *Período:* ${monthName}\n`;
  text += `💰 *GRAN TOTAL RECAUDADO (${sorted.length} OFRENDAS):* ${formatCurrency(totalAmount)}\n`;
  text += `------------------------------------\n`;
  text += `📋 *DESGLOSE DE OFRENDAS (Del 1 al 31 en orden):*\n`;

  if (sorted.length === 0) {
    text += `_Sin ofrendas registradas en este período._\n`;
  } else {
    sorted.forEach((o) => {
      const d = formatDate(o.date);
      const day = o.dayOfWeek ? ` (${o.dayOfWeek})` : '';
      const com = committeeMap[o.destinationCommitteeId] || 'General';
      text += `• ${d}${day}: ${com} - *${formatCurrency(o.amount)}* (Resp: ${o.responsible || 'Tesorero'})\n`;
    });
  }

  text += `====================================\n`;
  text += `_Generado por Sistema Deborita Gestión Local_`;
  return text;
}

/**
 * Copia o Comparte el resumen en texto de ofrendas
 */
export async function copyOfferingsSummaryText(params) {
  const text = buildOfferingsSummaryText(params);
  await copyTextToClipboard(text);

  if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: `Reporte de Ofrendas`,
        text: text
      });
      return;
    } catch (e) {
      // Ignorar si cancela el share nativo
    }
  }

  toast.success('📋 ¡Resumen en texto copiado al portapapeles!');
}

/**
 * Comparte el reporte filtrado de ofrendas por WhatsApp
 */
export function shareOfferingsReportWhatsApp(params) {
  const text = buildOfferingsSummaryText(params);
  const encoded = encodeURI(text);
  copyTextToClipboard(text);
  toast.success('Reporte de ofrendas copiado. Abriendo WhatsApp...');
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

/**
 * Descarga una imagen PNG de alta calidad a partir de una referencia de Chart.js o elemento canvas
 */
export function downloadChartImage(chartRef, fileName = 'grafico_financiero') {
  try {
    let base64Image = null;

    if (chartRef?.current) {
      if (typeof chartRef.current.toBase64Image === 'function') {
        base64Image = chartRef.current.toBase64Image();
      } else if (chartRef.current.canvas && typeof chartRef.current.canvas.toDataURL === 'function') {
        base64Image = chartRef.current.canvas.toDataURL('image/png');
      } else if (typeof chartRef.current.toDataURL === 'function') {
        base64Image = chartRef.current.toDataURL('image/png');
      }
    }

    if (!base64Image) {
      const canvasEl = chartRef?.current?.querySelector?.('canvas') || (chartRef instanceof HTMLCanvasElement ? chartRef : null);
      if (canvasEl && typeof canvasEl.toDataURL === 'function') {
        base64Image = canvasEl.toDataURL('image/png');
      }
    }

    if (!base64Image) {
      toast.error('No se pudo generar la imagen del gráfico');
      return;
    }

    const link = document.createElement('a');
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = base64Image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('🖼️ ¡Gráfico descargado en formato PNG!');
  } catch (err) {
    console.error('Error al exportar imagen del gráfico:', err);
    toast.error('Error al exportar la imagen del gráfico');
  }
}

/**
 * Abre una ventana imprimible / PDF con el gráfico incrustado y resumen estadístico
 */
export function printChartReport({ title = 'Informe Gráfico', subtitle = '', congregationName = 'Deborita Gestión Local', chartRef, stats = [], period = '' }) {
  let base64Image = null;

  if (chartRef?.current) {
    if (typeof chartRef.current.toBase64Image === 'function') {
      base64Image = chartRef.current.toBase64Image();
    } else if (chartRef.current.canvas && typeof chartRef.current.canvas.toDataURL === 'function') {
      base64Image = chartRef.current.canvas.toDataURL('image/png');
    }
  }

  if (!base64Image) {
    const canvasEl = chartRef?.current?.querySelector?.('canvas');
    if (canvasEl && typeof canvasEl.toDataURL === 'function') {
      base64Image = canvasEl.toDataURL('image/png');
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir');
    return;
  }

  const statsHtml = stats && stats.length > 0 ? `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin: 24px 0;">
      ${stats.map(s => `
        <div style="padding: 16px; border-radius: 12px; border: 2px solid #cbd5e1; background: #f8fafc; text-align: center;">
          <span style="font-size: 13px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">${s.label}</span>
          <div style="font-size: 24px; font-weight: 950; color: ${s.color || '#1e3a8a'}; margin-top: 6px;">${s.value}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${period || 'Reporte'}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 35px;
            color: #0f172a;
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            font-size: 15px;
          }
          .header {
            text-align: center;
            border-bottom: 3.5px solid #4f46e5;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .title {
            font-size: 26px;
            font-weight: 950;
            margin: 0;
            text-transform: uppercase;
            color: #1e1b4b;
            letter-spacing: 0.5px;
          }
          .sub {
            font-size: 15.5px;
            color: #4338ca;
            margin-top: 6px;
            font-weight: 800;
          }
          .chart-box {
            text-align: center;
            margin: 24px 0;
            padding: 20px;
            border: 2px solid #cbd5e1;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .chart-img {
            max-width: 100%;
            height: auto;
            max-height: 480px;
            object-fit: contain;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 55px;
          }
          .footer {
            text-align: center;
            font-size: 11.5px;
            color: #64748b;
            margin-top: 35px;
            border-top: 1.5px solid #e2e8f0;
            padding-top: 14px;
            font-weight: 500;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          <p class="sub">${congregationName} | ${subtitle || 'Análisis Gráfico y Estadístico'} | Período: ${period || 'Actual'}</p>
        </div>

        ${base64Image ? `
          <div class="chart-box">
            <img src="${base64Image}" class="chart-img" alt="Gráfico Estadístico" />
          </div>
        ` : ''}

        ${statsHtml}

        <div class="signatures">
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 2px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">Tesorería Local</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Elaborado y Verificado</p>
          </div>
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 2px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 900; margin: 0; font-size: 13.5px; color: #0f172a;">Pastor Titular</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Visto Bueno y Aprobación</p>
          </div>
        </div>

        <div class="footer">
          Documento generado electrónicamente por Sistema de Gestión Financiera Deborita. Válido para informes y control financiero.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

