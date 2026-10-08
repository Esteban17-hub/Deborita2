import React, { useState, useMemo } from 'react';
import { FileText, Download, FileSpreadsheet, Filter, X, Coins, Building2, UserCheck, BarChart3, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, deduceDayOfWeek } from '../utils/formatters';
import { exportToExcel, exportToPDF } from '../utils/pdfExcelExporter';
import { exportOfferingsToExcel, printFilteredTithesReport, exportTithesToExcel } from '../utils/exportHelpers';

export default function ReportsView({
  movements = [],
  committees = [],
  tithes = [],
  offerings = [],
  congregationName = 'Deborita Gestión Local',
  userRole = 'ADMIN',
  isMobile = false
}) {
  const [reportType, setReportType] = useState('COMMITTEES'); // 'COMMITTEES', 'TITHES', 'OFFERINGS'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const isReadOnly = userRole === 'VISITA';

  // Años disponibles consolidados
  const availableYears = useMemo(() => {
    const yrs = new Set();
    yrs.add(String(new Date().getFullYear()));
    movements.forEach(m => { if (m.date) yrs.add(m.date.slice(0, 4)); });
    tithes.forEach(t => { if (t.year) yrs.add(String(t.year)); });
    offerings.forEach(o => { if (o.date) yrs.add(o.date.slice(0, 4)); });
    return Array.from(yrs).filter(Boolean).sort().reverse();
  }, [movements, tithes, offerings]);

  // Filtrado dinámico de datos
  let filteredData = [];
  let columns = [];
  let totals = {};
  let averages = {};

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
        if (selectedMonth !== 'ALL' && m.date.slice(5, 7) !== selectedMonth) return false;
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
      { header: 'Pastor', key: 'pastorName' },
      { header: 'Diezmo Bruto', key: 'grossIncome', isCurrency: true },
      { header: 'Tesorería Nac.', key: 'nationalShare', isCurrency: true },
      { header: 'Ingreso Neto', key: 'netIncome', isCurrency: true },
      { header: 'Puntos', key: 'points' },
      { header: 'Fondo Local', key: 'localFundAport', isCurrency: true },
      { header: 'Asign. Pastor', key: 'pastorAllocation', isCurrency: true }
    ];

    filteredData = tithes
      .filter(t => {
        const tYear = String(t.year || (t.date ? t.date.slice(0, 4) : ''));
        const tMonth = String(t.month || (t.date ? t.date.slice(5, 7) : '')).padStart(2, '0');
        const tDate = t.date || `${tYear}-${tMonth}-01`;

        if (selectedYear !== 'ALL' && tYear !== String(selectedYear)) return false;
        if (selectedMonth !== 'ALL' && tMonth !== String(selectedMonth).padStart(2, '0')) return false;
        if (dateFrom && tDate < dateFrom) return false;
        if (dateTo && tDate > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const yDiff = Number(b.year || 0) - Number(a.year || 0);
        if (yDiff !== 0) return yDiff;
        return Number(b.month || 0) - Number(a.month || 0);
      })
      .map(t => ({
        ...t,
        period: `${String(t.month).padStart(2, '0')}/${t.year}`,
        pastorName: t.pastorName || t.balanceGroup || 'Pastor',
        grossIncome: t.grossTithe ?? t.grossIncome ?? 0,
        nationalShare: t.nationalTreasury ?? t.nationalShare ?? 0,
        netIncome: t.netIncome ?? 0,
        points: `${t.correctedPoint ?? t.pastorAllocationPercentage ?? 0} pts`,
        localFundAport: t.localFundAport ?? 0,
        pastorAllocation: t.pastorAllocation ?? 0
      }));

    const count = filteredData.length;
    totals = {
      grossIncome: filteredData.reduce((acc, t) => acc + (t.grossIncome || 0), 0),
      nationalShare: filteredData.reduce((acc, t) => acc + (t.nationalShare || 0), 0),
      netIncome: filteredData.reduce((acc, t) => acc + (t.netIncome || 0), 0),
      localFundAport: filteredData.reduce((acc, t) => acc + (t.localFundAport || 0), 0),
      pastorAllocation: filteredData.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0)
    };

    averages = {
      grossIncome: count > 0 ? Math.round(totals.grossIncome / count) : 0,
      nationalShare: count > 0 ? Math.round(totals.nationalShare / count) : 0,
      netIncome: count > 0 ? Math.round(totals.netIncome / count) : 0,
      localFundAport: count > 0 ? Math.round(totals.localFundAport / count) : 0,
      pastorAllocation: count > 0 ? Math.round(totals.pastorAllocation / count) : 0
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
        if (selectedMonth !== 'ALL' && o.date.slice(5, 7) !== selectedMonth) return false;
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
    if (reportType === 'TITHES') {
      const periodLabel = selectedYear !== 'ALL'
        ? (selectedMonth !== 'ALL' ? `${selectedMonth}/${selectedYear}` : `Año ${selectedYear}`)
        : (dateFrom || dateTo ? `${dateFrom || ''} a ${dateTo || ''}` : 'Historial Consolidado');

      printFilteredTithesReport({
        congregationName,
        period: periodLabel,
        tithes: filteredData,
        totals,
        averages
      });
      return;
    }

    const titlesMap = {
      COMMITTEES: 'Movimientos de Comités',
      OFFERINGS: 'Ofrendas Locales'
    };
    exportToPDF(titlesMap[reportType], congregationName, columns, filteredData, totals);
  };

  const handleExportExcel = () => {
    if (reportType === 'OFFERINGS') {
      const periodLabel = dateFrom || dateTo ? `${dateFrom || ''} al ${dateTo || ''}` : (selectedYear !== 'ALL' ? `Año ${selectedYear}` : '');
      exportOfferingsToExcel({
        offerings: filteredData,
        committees,
        monthName: periodLabel,
        title: 'Ingresos Ofrendas Mensual',
        fileName: 'Ingresos_Ofrendas_Mensual'
      });
      return;
    }

    if (reportType === 'TITHES') {
      const periodLabel = selectedYear !== 'ALL'
        ? (selectedMonth !== 'ALL' ? `${selectedMonth}/${selectedYear}` : `Año ${selectedYear}`)
        : (dateFrom || dateTo ? `${dateFrom || ''} al ${dateTo || ''}` : 'Historial Consolidado');

      exportTithesToExcel({
        tithes: filteredData,
        period: periodLabel,
        congregationName,
        fileName: `Liquidacion_Diezmos_${selectedYear !== 'ALL' ? selectedYear : 'Consolidado'}`
      });
      return;
    }

    const titlesMap = {
      COMMITTEES: 'Movimientos_Comites'
    };
    exportToExcel(titlesMap[reportType], columns, filteredData, totals, congregationName);
  };

  const hasActiveFilters = dateFrom || dateTo || selectedCommittee !== 'ALL' || selectedDay !== 'ALL' || selectedYear !== 'ALL' || selectedMonth !== 'ALL';

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCommittee('ALL');
    setSelectedDay('ALL');
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
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
          <p className="text-sm text-cyan-100 font-medium opacity-90">Generación e impresión de estados financieros centralizados con promedios y balances</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className={isMobile ? 'hidden' : 'inline'}>Exportar Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span className={isMobile ? 'hidden' : 'inline'}>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Panel de Filtros Dinámicos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            Filtros del Informe
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Tipo de Reporte */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="COMMITTEES">📁 Movimientos de Comités</option>
              {!isReadOnly && <option value="TITHES">💰 Liquidación de Diezmos</option>}
              <option value="OFFERINGS">✨ Ofrendas Locales</option>
            </select>
          </div>

          {/* Año */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>Año {y}</option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Meses</option>
              <option value="01">01 - Enero</option>
              <option value="02">02 - Febrero</option>
              <option value="03">03 - Marzo</option>
              <option value="04">04 - Abril</option>
              <option value="05">05 - Mayo</option>
              <option value="06">06 - Junio</option>
              <option value="07">07 - Julio</option>
              <option value="08">08 - Agosto</option>
              <option value="09">09 - Septiembre</option>
              <option value="10">10 - Octubre</option>
              <option value="11">11 - Noviembre</option>
              <option value="12">12 - Diciembre</option>
            </select>
          </div>

          {/* Desde Fecha */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Desde Fecha</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hasta Fecha */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Hasta Fecha</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Comité (solo si no es diezmos) */}
          {reportType !== 'TITHES' && (
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Comité</label>
              <select
                value={selectedCommittee}
                onChange={(e) => setSelectedCommittee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los Comités</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Día de Semana (solo si es ofrendas) */}
          {reportType === 'OFFERINGS' && (
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Día de Semana</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Tarjetas KPI de Resumen y Promedios para Diezmos */}
      {reportType === 'TITHES' && filteredData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          
          <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Total Diezmo Bruto
            </span>
            <p className="text-2xl font-black text-indigo-950 dark:text-white mt-2">
              {formatCurrency(totals.grossIncome || 0)}
            </p>
            <div className="pt-2 mt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex justify-between items-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              <span>Promedio: {formatCurrency(averages.grossIncome || 0)}</span>
              <span>{filteredData.length} meses</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Total Tesorería Nac.
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
              {formatCurrency(totals.nationalShare || 0)}
            </p>
            <div className="pt-2 mt-2 border-t border-rose-100 dark:border-rose-900/60 flex justify-between items-center text-[10px] font-bold text-rose-700 dark:text-rose-300">
              <span>Promedio: {formatCurrency(averages.nationalShare || 0)}</span>
              <span>Aporte Nac.</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              🏛️ Total Ingreso Neto
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(totals.netIncome || 0)}
            </p>
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
              <span>Promedio: {formatCurrency(averages.netIncome || 0)}</span>
              <span>Neto Distribuible</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-100/90 via-indigo-50 to-blue-50 dark:from-indigo-950/60 dark:via-indigo-900/40 dark:to-slate-900 border-2 border-indigo-300 dark:border-indigo-700 shadow-md flex flex-col justify-between">
            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Total Asign. Pastoral
            </span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
              {formatCurrency(totals.pastorAllocation || 0)}
            </p>
            <div className="pt-2 mt-2 border-t border-indigo-200 dark:border-indigo-800 flex justify-between items-center text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
              <span>Promedio: {formatCurrency(averages.pastorAllocation || 0)}</span>
              <span>Neto Pastor</span>
            </div>
          </div>

        </div>
      )}

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
                  <th key={idx} className={`py-3.5 px-4 ${col.isCurrency ? 'text-right' : col.key === 'status' || col.key === 'type' || col.key === 'points' ? 'text-center' : ''}`}>
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

                      if (col.key === 'points') {
                        return (
                          <td key={colIdx} className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-mono font-black text-[11px]">
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

              {/* FILA 1: TOTAL GENERAL */}
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

              {/* FILA 2: PROMEDIOS MENSUALES (Solo para Diezmos) */}
              {reportType === 'TITHES' && filteredData.length > 0 && (
                <tr className="bg-indigo-100/70 dark:bg-indigo-900/50 border-t border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100 font-extrabold text-xs">
                  {columns.map((col, colIdx) => {
                    if (colIdx === 0) {
                      return (
                        <td key={colIdx} className="py-3.5 px-4 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>PROMEDIO MENSUAL</span>
                        </td>
                      );
                    }
                    if (col.isCurrency && averages[col.key] !== undefined) {
                      return (
                        <td key={colIdx} className="py-3.5 px-4 text-right text-xs font-black text-indigo-900 dark:text-indigo-200">
                          {formatCurrency(averages[col.key])}
                        </td>
                      );
                    }
                    return <td key={colIdx} className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500">-</td>;
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
