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

/**
 * Abre una ventana imprimible / PDF con el reporte completo de un comité filtrado
 */
export function printFilteredCommitteeReport({ committeeName, treasurerName = '', monthName = '', movements = [], totals = { income: 0, expense: 0, net: 0 }, congregationName = '' }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Por favor permite las ventanas emergentes para imprimir el reporte');
    return;
  }

  // Ordenar movimientos por fecha del 1 al 31 (ascendente)
  const sorted = [...movements].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const rowsHtml = sorted.map(m => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${m.annulled ? 'opacity: 0.5;' : ''}">
      <td style="padding: 8px 10px; font-weight: 700;">${formatDate(m.date)}</td>
      <td style="padding: 8px 10px; font-weight: 800; color: ${m.type === 'INGRESO' ? '#16a34a' : '#dc2626'};">${m.type}</td>
      <td style="padding: 8px 10px;">${m.description || 'Sin descripción'} ${m.annulled ? '<span style="color:#dc2626;font-weight:700;">(ANULADO)</span>' : ''}</td>
      <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: ${m.type === 'INGRESO' ? '#15803d' : '#b91c1c'};">
        ${m.type === 'INGRESO' ? '+' : '-'}${formatCurrency(m.amount || 0)}
      </td>
      <td style="padding: 8px 10px; text-align: center; font-size: 11px;">${m.annulled ? 'Anulado' : 'Activo'}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte Comité - ${committeeName}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 850px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; color: #1e3a8a; }
          .sub { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #475569; }
          .kpi-container { display: flex; gap: 12px; margin-bottom: 20px; }
          .kpi { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; text-align: center; background: #f8fafc; }
          .kpi-val { font-size: 16px; font-weight: 900; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px 10px; text-transform: uppercase; font-size: 11px; text-align: left; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">ESTADO DE CUENTA - ${committeeName}</h1>
          <p class="sub">${congregationName || 'Deborita Gestión Local'} | Período: ${monthName || 'Histórico Completo'}</p>
        </div>

        <div class="meta">
          <span><strong>Tesorero(a) a Cargo:</strong> ${treasurerName || 'Sin asignar'}</span>
          <span><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString('es-CO')}</span>
        </div>

        <div class="kpi-container">
          <div class="kpi">
            <span style="font-size: 11px; color: #16a34a; font-weight: 800; text-transform: uppercase;">Total Aportes / Ingresos</span>
            <div class="kpi-val" style="color: #15803d;">+${formatCurrency(totals.income)}</div>
          </div>
          <div class="kpi">
            <span style="font-size: 11px; color: #dc2626; font-weight: 800; text-transform: uppercase;">Total Egresos</span>
            <div class="kpi-val" style="color: #b91c1c;">-${formatCurrency(totals.expense)}</div>
          </div>
          <div class="kpi" style="border-color: #3b82f6; background: #eff6ff;">
            <span style="font-size: 11px; color: #1d4ed8; font-weight: 800; text-transform: uppercase;">Saldo Neto Período</span>
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
            <div style="border-bottom: 1.5px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 800; margin: 0; font-size: 12px;">${treasurerName || 'Tesorero(a) del Comité'}</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">Tesorería del Comité</p>
          </div>
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 1.5px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 800; margin: 0; font-size: 12px;">Pastor Titular / Tesorería General</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">Visto Bueno y Aprobación</p>
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
 * Comparte el reporte filtrado de un comité por WhatsApp
 */
export function shareCommitteeReportWhatsApp({ committeeName, treasurerName = '', monthName = '', movements = [], totals = { income: 0, expense: 0, net: 0 }, congregationName = '' }) {
  // Ordenar movimientos por fecha del 1 al 31
  const sorted = [...movements].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

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

  const encoded = encodeURI(text);
  navigator.clipboard.writeText(text);
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

  // Ordenar ofrendas por fecha del 1 al 31 (ascendente)
  const sorted = [...offerings].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const rowsHtml = sorted.map(o => {
    const comName = committeeMap[o.destinationCommitteeId] || 'General';
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px; font-weight: 700;">${formatDate(o.date)}</td>
        <td style="padding: 8px 10px; font-weight: 800; color: #b45309;">${o.dayOfWeek || ''}</td>
        <td style="padding: 8px 10px; font-weight: 600;">${comName}</td>
        <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #0f172a;">${formatCurrency(o.amount || 0)}</td>
        <td style="padding: 8px 10px; font-size: 11px;">${o.responsible || 'Tesorero'}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${(o.notes || o.description || '').replace(/^\[|\]$/g, '')}</td>
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
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 850px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; color: #92400e; }
          .sub { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #fef3c7; padding: 8px 10px; text-transform: uppercase; font-size: 11px; text-align: left; color: #78350f; }
          .total-box { background: #fffbeb; border: 2px solid #fde68a; border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
          .total-val { font-size: 20px; font-weight: 900; color: #b45309; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">REPORTE OFICIAL DE OFRENDAS</h1>
          <p class="sub">${congregationName || 'Deborita Gestión Local'} | Período: ${monthName || 'Histórico Completo'}</p>
        </div>

        <div class="meta">
          <span><strong>Total Registros:</strong> ${sorted.length} ofrendas</span>
          <span><strong>Fecha de Impresión:</strong> ${new Date().toLocaleDateString('es-CO')}</span>
        </div>

        <div class="total-box">
          <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #92400e;">Gran Total Recaudado</span>
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
            <div style="border-bottom: 1.5px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 800; margin: 0; font-size: 12px;">Tesorero(a) Local</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">Responsable de Recaudo</p>
          </div>
          <div style="text-align: center; width: 40%;">
            <div style="border-bottom: 1.5px solid #0f172a; height: 45px; margin-bottom: 6px;"></div>
            <p style="font-weight: 800; margin: 0; font-size: 12px;">Pastor Titular</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">Visto Bueno y Aprobación</p>
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
 * Comparte el reporte filtrado de ofrendas por WhatsApp
 */
export function shareOfferingsReportWhatsApp({ monthName = '', offerings = [], totalAmount = 0, congregationName = '', committeeMap = {} }) {
  // Ordenar ofrendas por fecha del 1 al 31
  const sorted = [...offerings].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

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

  const encoded = encodeURI(text);
  navigator.clipboard.writeText(text);
  toast.success('Reporte de ofrendas copiado. Abriendo WhatsApp...');
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}
