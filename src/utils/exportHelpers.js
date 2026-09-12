import { formatCurrency, formatDate } from './formatters';
import { toast } from 'react-hot-toast';

/**
 * Exporta un arreglo de objetos a un archivo Excel (.csv con BOM UTF-8)
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
 * Abre una ventana imprimible / PDF con el comprobante oficial membretado
 */
export function printOfficialReceipt({ title, subtitle, congregationName, date, details = [], total, notes, signatures = [] }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir');
    return;
  }

  const detailsHtml = details.map(d => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 12px; font-weight: 600; color: #334155;">${d.label}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: ${d.color || '#0f172a'};">${d.value}</td>
    </tr>
  `).join('');

  const signaturesHtml = signatures.map(s => `
    <div style="text-align: center; width: 45%;">
      <div style="border-bottom: 1.5px solid #0f172a; height: 50px; margin-bottom: 8px;"></div>
      <p style="font-weight: 800; margin: 0; font-size: 13px; color: #0f172a;">${s.name}</p>
      <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">${s.role}</p>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${congregationName}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 750px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; color: #1e3a8a; }
          .sub { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .total-box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .total-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #1e293b; }
          .total-value { font-size: 22px; font-weight: 900; color: #1d4ed8; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            body { padding: 0; }
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
            <tr style="background: #f1f5f9; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
              <th style="padding: 10px 12px; text-align: left;">Concepto / Descripción</th>
              <th style="padding: 10px 12px; text-align: right;">Valor</th>
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
          <div style="font-size: 12px; color: #475569; margin-bottom: 24px; padding: 10px; background: #f8fafc; border-radius: 8px;">
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
