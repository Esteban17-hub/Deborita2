import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Filter } from 'lucide-react';
import { formatCurrency, formatDate, deduceDayOfWeek } from '../utils/formatters';
import { exportToExcel, exportToPDF } from '../utils/pdfExcelExporter';

export default function ReportsView({
  movements,
  committees,
  tithes,
  offerings,
  congregationName,
  userRole,
  isMobile
}) {
  const [reportType, setReportType] = useState('COMMITTEES'); // 'COMMITTEES', 'TITHES', 'OFFERINGS'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const isReadOnly = userRole === 'VISITA';

  // Filtrado dinámico de datos
  let filteredData = [];
  let columns = [];
  let totals = {};

  if (reportType === 'COMMITTEES') {
    columns = [
      { header: 'Fecha', key: 'formattedDate' },
      { header: 'Comité', key: 'committeeName' },
      { header: 'Tipo', key: 'type' },
      { header: 'Descripción', key: 'description' },
      { header: 'Monto', key: 'amount', isCurrency: true },
      { header: 'Estado', key: 'status' }
    ];

    filteredData = movements
      .filter(m => {
        if (selectedCommittee !== 'ALL' && m.committeeId !== selectedCommittee) return false;
        if (dateFrom && m.date < dateFrom) return false;
        if (dateTo && m.date > dateTo) return false;
        if (selectedYear !== 'ALL' && !m.date.startsWith(selectedYear)) return false;
        return true;
      })
      .map(m => {
        const com = committees.find(c => c.id === m.committeeId);
        return {
          ...m,
          formattedDate: formatDate(m.date),
          committeeName: com ? com.name : 'Desconocido',
          status: m.annulled ? 'Anulado' : 'Activo'
        };
      });

    // Sumatoria total (solo activos)
    const activeMovs = filteredData.filter(m => !m.annulled);
    totals = {
      amount: activeMovs.reduce((acc, m) => {
        return m.type === 'INGRESO' ? acc + m.amount : acc - m.amount;
      }, 0)
    };

  } else if (reportType === 'TITHES' && !isReadOnly) {
    columns = [
      { header: 'Mes/Año', key: 'period' },
      { header: 'Diezmo Bruto', key: 'grossIncome', isCurrency: true },
      { header: 'Tesorería Nac.', key: 'nationalShare', isCurrency: true },
      { header: 'Ingreso Neto', key: 'netIncome', isCurrency: true },
      { header: 'Puntos', key: 'points' },
      { header: 'Asign. Pastor', key: 'pastorAllocation', isCurrency: true }
    ];

    filteredData = tithes
      .filter(t => {
        if (selectedYear !== 'ALL' && String(t.year) !== String(selectedYear)) return false;
        return true;
      })
      .map(t => ({
        ...t,
        period: `${t.month}/${t.year}`,
        grossIncome: t.grossTithe ?? t.grossIncome ?? 0,
        nationalShare: t.nationalTreasury ?? t.nationalShare ?? 0,
        netIncome: t.netIncome ?? 0,
        points: `${t.correctedPoint ?? t.pastorAllocationPercentage ?? 0} pts`,
        pastorAllocation: t.pastorAllocation ?? 0
      }));

    totals = {
      grossIncome: filteredData.reduce((acc, t) => acc + (t.grossIncome || 0), 0),
      nationalShare: filteredData.reduce((acc, t) => acc + (t.nationalShare || 0), 0),
      netIncome: filteredData.reduce((acc, t) => acc + (t.netIncome || 0), 0),
      pastorAllocation: filteredData.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0)
    };

  } else if (reportType === 'OFFERINGS') {
    columns = [
      { header: 'Fecha', key: 'formattedDate' },
      { header: 'Día', key: 'dayOfWeek' },
      { header: 'Comité Destino', key: 'committeeName' },
      { header: 'Responsable', key: 'responsible' },
      { header: 'Observaciones', key: 'observation' },
      { header: 'Monto Ofrendado', key: 'amount', isCurrency: true }
    ];

    filteredData = offerings
      .filter(o => {
        const day = o.dayOfWeek || deduceDayOfWeek(o.date);
        if (selectedDay !== 'ALL' && day !== selectedDay) return false;
        if (selectedCommittee !== 'ALL' && o.destinationCommitteeId !== selectedCommittee) return false;
        if (dateFrom && o.date < dateFrom) return false;
        if (dateTo && o.date > dateTo) return false;
        if (selectedYear !== 'ALL' && !o.date.startsWith(selectedYear)) return false;
        return true;
      })
      .map(o => {
        const com = committees.find(c => c.id === o.destinationCommitteeId);
        const obs = (o.notes || o.description || '').replace(/^\[|\]$/g, '').trim();
        return {
          ...o,
          formattedDate: formatDate(o.date),
          dayOfWeek: o.dayOfWeek || deduceDayOfWeek(o.date),
          committeeName: com ? com.name : 'General',
          responsible: o.responsible || 'Tesorero General',
          observation: obs || '-'
        };
      });

    totals = {
      amount: filteredData.reduce((acc, o) => acc + (o.amount || 0), 0)
    };
  }

  const handleExportPDF = () => {
    const titlesMap = {
      COMMITTEES: 'Movimientos de Comités',
      TITHES: 'Liquidación de Diezmos',
      OFFERINGS: 'Ofrendas Locales'
    };
    exportToPDF(titlesMap[reportType], congregationName, columns, filteredData, totals);
  };

  const handleExportExcel = () => {
    const titlesMap = {
      COMMITTEES: 'Movimientos_Comites',
      TITHES: 'Liquidacion_Diezmos',
      OFFERINGS: 'Ofrendas_Locales'
    };
    exportToExcel(titlesMap[reportType], columns, filteredData, totals, congregationName);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Selector de Reporte */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-4 ${isMobile ? 'p-6' : 'p-8'} rounded-[2rem] text-white shadow-2xl`}
        style={{ backgroundImage: 'var(--gradient-reports)', boxShadow: '0 25px 50px -12px var(--shadow-color)' }}
      >
        <div>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>Tablero de Reportes</h2>
          <p className="text-sm text-cyan-100 font-medium opacity-90">Generación e impresión de estados financieros centralizados</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className={isMobile ? 'hidden' : 'inline'}>Exportar Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span className={isMobile ? 'hidden' : 'inline'}>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Panel de Filtros Dinámicos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          Filtros del Informe
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
            >
              <option value="COMMITTEES">Movimientos de Comités</option>
              {!isReadOnly && <option value="TITHES">Liquidación de Diezmos</option>}
              <option value="OFFERINGS">Ofrendas Locales</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Desde Fecha</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Hasta Fecha</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
            />
          </div>

          {reportType !== 'TITHES' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Comité</label>
              <select
                value={selectedCommittee}
                onChange={(e) => setSelectedCommittee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
              >
                <option value="ALL">Todos los Comités</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'OFFERINGS' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Día de Semana</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
              >
                <option value="ALL">Todos los días</option>
                <option value="Domingo">Domingo</option>
                <option value="Martes">Martes</option>
                <option value="Jueves">Jueves</option>
                <option value="Sábado">Sábado</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Vista Previa de la Tabla con Fila Final de Totales Obligatoria y Alto Contraste */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Vista Previa del Reporte <span className="text-blue-600 dark:text-blue-400">({filteredData.length} registros)</span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black uppercase text-[11px] tracking-wider">
                {columns.map((col, idx) => (
                  <th key={idx} className={`py-3.5 px-4 ${col.isCurrency ? 'text-right' : col.key === 'status' || col.key === 'type' ? 'text-center' : ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-slate-400 font-medium">
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {columns.map((col, colIdx) => {
                      const val = row[col.key];

                      if (col.key === 'status') {
                        return (
                          <td key={colIdx} className="py-3.5 px-4 text-center">
                            {val === 'Anulado' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                Anulado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                Activo
                              </span>
                            )}
                          </td>
                        );
                      }

                      if (col.key === 'type') {
                        return (
                          <td key={colIdx} className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                              val === 'INGRESO'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}>
                              {val}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'observation') {
                        return (
                          <td key={colIdx} className="py-3.5 px-4">
                            {val && val !== '-' ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-black text-[11px]">
                                {val}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">—</span>
                            )}
                          </td>
                        );
                      }

                      if (col.isCurrency) {
                        return (
                          <td key={colIdx} className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                            {formatCurrency(val)}
                          </td>
                        );
                      }

                      return (
                        <td key={colIdx} className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {val ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}

              {/* FILA OBLIGATORIA DE SUMATORIA TOTAL */}
              {filteredData.length > 0 && (
                <tr className="bg-blue-50 dark:bg-blue-950/70 font-black text-blue-950 dark:text-blue-100 border-t-2 border-blue-300 dark:border-blue-700">
                  {columns.map((col, colIdx) => {
                    if (colIdx === 0) {
                      return <td key={colIdx} className="py-4 px-4 text-xs font-black tracking-wider uppercase">TOTAL GENERAL</td>;
                    }
                    if (col.isCurrency && totals[col.key] !== undefined) {
                      return (
                        <td key={colIdx} className="py-4 px-4 text-right text-sm font-black">
                          {formatCurrency(totals[col.key])}
                        </td>
                      );
                    }
                    return <td key={colIdx} className="py-4 px-4 text-center">-</td>;
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
