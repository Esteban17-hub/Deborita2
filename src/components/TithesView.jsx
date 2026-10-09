import React, { useState, useMemo, useRef } from 'react';
import { Calculator, History, TrendingUp, Lock, Pencil, Trash2, Search, Calendar, X, AlertCircle, Coins, Building2, UserCheck, BarChart3, Filter, Share2, Printer, FileSpreadsheet, Download, Copy, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  exportToExcel, 
  exportTithesToExcel, 
  printFilteredTithesReport, 
  shareTithesHistoryWhatsApp, 
  copyTithesHistoryText, 
  shareTitheWhatsApp, 
  printOfficialReceipt, 
  downloadChartImage, 
  printChartReport 
} from '../utils/exportHelpers';
import MoneyInput from './MoneyInput';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export default function TithesView({ 
  tithes = [], 
  userRole = 'ADMIN', 
  isMobile = false, 
  pastorName: initialPastorName = 'Pastor', 
  congregationName = 'Deborita Gestión Local',
  onSaveTithe, 
  onUpdateTithe, 
  onDeleteTithe 
}) {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'history', 'chart'

  // Modo edición
  const [editingTitheId, setEditingTitheId] = useState(null);

  // Entradas de la calculadora
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [pastorName, setPastorName] = useState(initialPastorName || 'Pastor');
  const [smlv, setSmlv] = useState(1750905);
  const [nationalPercentage, setNationalPercentage] = useState(21);
  const [grossTithe, setGrossTithe] = useState(5000000);
  const [correctedPointInput, setCorrectedPointInput] = useState('');
  const [isPointManuallyEdited, setIsPointManuallyEdited] = useState(false);

  // Filtros del historial
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySelectedYear, setHistorySelectedYear] = useState('ALL');
  const [historySelectedMonth, setHistorySelectedMonth] = useState('ALL');
  const [historyRangeFrom, setHistoryRangeFrom] = useState(''); // ej. "2025-09"
  const [historyRangeTo, setHistoryRangeTo] = useState('');     // ej. "2026-09"

  // Filtros para el gráfico de evolución
  const [chartYear, setChartYear] = useState(String(new Date().getFullYear()));
  const [chartRangeFrom, setChartRangeFrom] = useState(''); // ej. "2025-09"
  const [chartRangeTo, setChartRangeTo] = useState('');     // ej. "2026-09"
  const chartRef = useRef(null);

  // Años disponibles en el historial
  const availableYears = useMemo(() => {
    const yrs = new Set(tithes.map(t => String(t.year)).filter(Boolean));
    yrs.add(String(new Date().getFullYear()));
    return Array.from(yrs).sort().reverse();
  }, [tithes]);

  // Cálculos reactivos en tiempo real para la calculadora
  const nationalTreasury = Math.round(grossTithe * (nationalPercentage / 100));
  const netIncome = grossTithe - nationalTreasury;
  
  // Punto Calculado = Ingreso Neto / SMLV (con 3 decimales)
  const calculatedPoint = smlv > 0 ? parseFloat((netIncome / smlv).toFixed(3)) : 0;

  // Si no se ha editado manualmente, Punto Corregido toma el valor exacto de Punto Calculado
  const activeCorrectedPoint = isPointManuallyEdited 
    ? (correctedPointInput === '' ? 0 : parseFloat(correctedPointInput) || 0) 
    : calculatedPoint;

  const localFundAport = Math.round(netIncome * (activeCorrectedPoint / 100));
  const pastorAllocation = netIncome - localFundAport;

  // Iniciar edición de una liquidación
  const handleStartEdit = (t) => {
    setEditingTitheId(t.id);
    setMonth(String(t.month).padStart(2, '0'));
    setYear(String(t.year));
    setPastorName(t.pastorName || t.balanceGroup || 'Pastor');
    setSmlv(Number(t.smlv) || 1750905);
    setNationalPercentage(t.nationalPercentage !== undefined ? Number(t.nationalPercentage) : 21);
    setGrossTithe(Number(t.grossTithe ?? t.grossIncome ?? 0));

    const cp = t.correctedPoint !== undefined ? Number(t.correctedPoint) : undefined;
    const calcP = t.calculatedPoint !== undefined ? Number(t.calculatedPoint) : undefined;

    if (cp !== undefined && calcP !== undefined && Math.abs(cp - calcP) > 0.001) {
      setIsPointManuallyEdited(true);
      setCorrectedPointInput(String(cp));
    } else {
      setIsPointManuallyEdited(false);
      setCorrectedPointInput('');
    }

    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancelar edición y resetear
  const handleCancelEdit = () => {
    setEditingTitheId(null);
    setGrossTithe(5000000);
    setIsPointManuallyEdited(false);
    setCorrectedPointInput('');
    setMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
    setYear(String(new Date().getFullYear()));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!grossTithe || grossTithe <= 0) {
      toast.error('Por favor ingresa un monto válido de diezmo bruto.');
      return;
    }

    const payload = {
      month,
      year,
      pastorName: pastorName.trim() || 'Pastor',
      smlv,
      nationalPercentage,
      grossTithe,
      nationalTreasury,
      netIncome,
      calculatedPoint,
      correctedPoint: activeCorrectedPoint,
      localFundAport,
      pastorAllocation,
      date: `${year}-${month}-28`
    };

    if (editingTitheId) {
      if (onUpdateTithe) {
        onUpdateTithe(editingTitheId, payload);
      }
      setEditingTitheId(null);
      setGrossTithe(0);
      setActiveTab('history');
    } else {
      if (onSaveTithe) {
        onSaveTithe(payload);
      }
      setGrossTithe(0);
      setActiveTab('history');
    }
  };

  // Nombres de los meses
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fullMonthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const getMonthName = (m) => monthNames[parseInt(m, 10) - 1] || '-';
  const getFullMonthName = (m) => fullMonthNames[parseInt(m, 10) - 1] || '-';

  const formatMonthYearLabel = (myStr) => {
    if (!myStr) return '';
    const parts = myStr.split('-');
    if (parts.length < 2) return myStr;
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${fullMonthNames[mIdx] || parts[1]} de ${y}`;
  };

  const getMonthRangeList = (fromKey, toKey) => {
    if (!fromKey || !toKey) return [];
    let [startY, startM] = fromKey.split('-').map(Number);
    const [endY, endM] = toKey.split('-').map(Number);
    if (startY > endY || (startY === endY && startM > endM)) {
      return [];
    }
    const result = [];
    while (startY < endY || (startY === endY && startM <= endM)) {
      result.push({
        key: `${startY}-${String(startM).padStart(2, '0')}`,
        year: String(startY),
        month: String(startM).padStart(2, '0'),
        shortLabel: `${monthNames[startM - 1]} ${startY}`,
        fullLabel: `${fullMonthNames[startM - 1]} ${startY}`
      });
      startM++;
      if (startM > 12) {
        startM = 1;
        startY++;
      }
    }
    return result;
  };

  // Filtro y ordenamiento del historial (del más reciente al más antiguo)
  const filteredTithes = useMemo(() => {
    return tithes.filter(t => {
      const tYear = String(t.year || (t.date ? t.date.slice(0, 4) : ''));
      const tMonth = String(t.month || (t.date ? t.date.slice(5, 7) : '')).padStart(2, '0');
      const tMonthKey = `${tYear}-${tMonth}`;

      // 1. Filtro por Rango de Meses (Desde / Hasta)
      if (historyRangeFrom && tMonthKey < historyRangeFrom) return false;
      if (historyRangeTo && tMonthKey > historyRangeTo) return false;

      // 2. Filtro por Año
      if (historySelectedYear !== 'ALL' && tYear !== historySelectedYear) {
        return false;
      }
      // 3. Filtro por Mes
      if (historySelectedMonth !== 'ALL' && tMonth !== historySelectedMonth) {
        return false;
      }
      // 4. Filtro por Búsqueda
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchPastor = (t.pastorName || t.balanceGroup || '').toLowerCase().includes(q);
        const matchGross = String(t.grossTithe ?? t.grossIncome ?? '').includes(q);
        const matchNet = String(t.netIncome || '').includes(q);
        const matchAlloc = String(t.pastorAllocation || '').includes(q);
        const matchDate = `${tMonth}/${tYear}`.includes(q);
        if (!matchPastor && !matchGross && !matchNet && !matchAlloc && !matchDate) return false;
      }
      return true;
    }).sort((a, b) => {
      const yrDiff = Number(b.year) - Number(a.year);
      if (yrDiff !== 0) return yrDiff;
      return Number(b.month) - Number(a.month);
    });
  }, [tithes, historySelectedYear, historySelectedMonth, historySearchQuery, historyRangeFrom, historyRangeTo]);

  // Totales sumados de cada ítem en el historial
  const count = filteredTithes.length;
  const totalFilteredGross = filteredTithes.reduce((acc, t) => acc + (t.grossTithe ?? t.grossIncome ?? 0), 0);
  const totalFilteredNational = filteredTithes.reduce((acc, t) => acc + (t.nationalTreasury ?? t.nationalShare ?? 0), 0);
  const totalFilteredNet = filteredTithes.reduce((acc, t) => acc + (t.netIncome || 0), 0);
  const totalFilteredLocalFund = filteredTithes.reduce((acc, t) => acc + (t.localFundAport || 0), 0);
  const totalFilteredPastor = filteredTithes.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0);

  // Promedios matemáticos de los datos mostrados
  const avgFilteredGross = count > 0 ? Math.round(totalFilteredGross / count) : 0;
  const avgFilteredNational = count > 0 ? Math.round(totalFilteredNational / count) : 0;
  const avgFilteredNet = count > 0 ? Math.round(totalFilteredNet / count) : 0;
  const avgFilteredLocalFund = count > 0 ? Math.round(totalFilteredLocalFund / count) : 0;
  const avgFilteredPastor = count > 0 ? Math.round(totalFilteredPastor / count) : 0;

  const getHistoryPeriodLabel = () => {
    if (historyRangeFrom || historyRangeTo) {
      if (historyRangeFrom && historyRangeTo) {
        return `${formatMonthYearLabel(historyRangeFrom)} a ${formatMonthYearLabel(historyRangeTo)}`;
      }
      if (historyRangeFrom) return `Desde ${formatMonthYearLabel(historyRangeFrom)}`;
      return `Hasta ${formatMonthYearLabel(historyRangeTo)}`;
    }
    if (historySelectedYear !== 'ALL') {
      return historySelectedMonth !== 'ALL' ? `${historySelectedMonth}/${historySelectedYear}` : `Año ${historySelectedYear}`;
    }
    if (historySelectedMonth !== 'ALL') {
      return `Mes ${historySelectedMonth}`;
    }
    return 'Historial Consolidado';
  };

  // Gráfico de Evolución: Configuración Dinámica por Año o por Rango de Meses
  const isChartRangeActive = Boolean(chartRangeFrom && chartRangeTo);

  const chartTimeline = useMemo(() => {
    if (isChartRangeActive) {
      const list = getMonthRangeList(chartRangeFrom, chartRangeTo);
      return list.length > 0 ? list : [];
    }
    // Por defecto, los 12 meses del año seleccionado
    return monthNames.map((name, index) => {
      const mStr = String(index + 1).padStart(2, '0');
      return {
        key: `${chartYear}-${mStr}`,
        year: String(chartYear),
        month: mStr,
        shortLabel: name,
        fullLabel: `${fullMonthNames[index]} ${chartYear}`
      };
    });
  }, [isChartRangeActive, chartRangeFrom, chartRangeTo, chartYear]);

  const chartGrossDataValues = chartTimeline.map(item => {
    const found = tithes.find(t => {
      const tYear = String(t.year || (t.date ? t.date.slice(0, 4) : ''));
      const tMonth = String(t.month || (t.date ? t.date.slice(5, 7) : '')).padStart(2, '0');
      return tYear === item.year && tMonth === item.month;
    });
    return found ? (found.grossTithe ?? found.grossIncome ?? 0) : 0;
  });

  const chartPastorDataValues = chartTimeline.map(item => {
    const found = tithes.find(t => {
      const tYear = String(t.year || (t.date ? t.date.slice(0, 4) : ''));
      const tMonth = String(t.month || (t.date ? t.date.slice(5, 7) : '')).padStart(2, '0');
      return tYear === item.year && tMonth === item.month;
    });
    return found ? (found.pastorAllocation || 0) : 0;
  });

  const chartData = {
    labels: chartTimeline.map(item => isChartRangeActive ? item.shortLabel : item.shortLabel),
    datasets: [
      {
        label: `Diezmo Bruto Recaudado ($)`,
        data: chartGrossDataValues,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: isChartRangeActive ? 4 : 6,
        pointBackgroundColor: '#4338ca',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      },
      {
        label: `Asignación Pastoral ($)`,
        data: chartPastorDataValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.35,
        pointRadius: isChartRangeActive ? 4 : 5,
        pointBackgroundColor: '#059669',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  // Liquidaciones activas para el cálculo de estadísticas del Gráfico
  const currentChartTithes = useMemo(() => {
    return tithes.filter(t => {
      const tYear = String(t.year || (t.date ? t.date.slice(0, 4) : ''));
      const tMonth = String(t.month || (t.date ? t.date.slice(5, 7) : '')).padStart(2, '0');
      const tKey = `${tYear}-${tMonth}`;

      if (chartRangeFrom && tKey < chartRangeFrom) return false;
      if (chartRangeTo && tKey > chartRangeTo) return false;
      if (!chartRangeFrom && !chartRangeTo && tYear !== String(chartYear)) return false;
      return true;
    });
  }, [tithes, chartRangeFrom, chartRangeTo, chartYear]);

  const chartCount = currentChartTithes.length;
  const chartTotGross = currentChartTithes.reduce((acc, t) => acc + (t.grossTithe ?? t.grossIncome ?? 0), 0);
  const chartTotPastor = currentChartTithes.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0);
  const chartTotNational = currentChartTithes.reduce((acc, t) => acc + (t.nationalTreasury ?? t.nationalShare ?? 0), 0);
  const chartTotLocal = currentChartTithes.reduce((acc, t) => acc + (t.localFundAport || 0), 0);

  const avgGrossIncome = chartCount > 0 ? Math.round(chartTotGross / chartCount) : 0;
  const avgPastorAllocation = chartCount > 0 ? Math.round(chartTotPastor / chartCount) : 0;
  const avgNationalAllocation = chartCount > 0 ? Math.round(chartTotNational / chartCount) : 0;
  const avgLocalAllocation = chartCount > 0 ? Math.round(chartTotLocal / chartCount) : 0;

  const maxGrossMonth = chartCount > 0
    ? currentChartTithes.reduce((max, t) => (((t.grossTithe ?? t.grossIncome ?? 0)) > ((max.grossTithe ?? max.grossIncome ?? 0)) ? t : max), currentChartTithes[0])
    : null;

  const minGrossMonth = chartCount > 0
    ? currentChartTithes.reduce((min, t) => (((t.grossTithe ?? t.grossIncome ?? 0)) < ((min.grossTithe ?? min.grossIncome ?? 0)) ? t : min), currentChartTithes[0])
    : null;

  const maxGrossAmount = maxGrossMonth ? (maxGrossMonth.grossTithe ?? maxGrossMonth.grossIncome ?? 0) : 0;
  const minGrossAmount = minGrossMonth ? (minGrossMonth.grossTithe ?? minGrossMonth.grossIncome ?? 0) : 0;

  const getChartPeriodLabel = () => {
    if (chartRangeFrom && chartRangeTo) {
      return `${formatMonthYearLabel(chartRangeFrom)} a ${formatMonthYearLabel(chartRangeTo)}`;
    }
    if (chartRangeFrom) return `Desde ${formatMonthYearLabel(chartRangeFrom)}`;
    if (chartRangeTo) return `Hasta ${formatMonthYearLabel(chartRangeTo)}`;
    return `Año ${chartYear}`;
  };

  // Ocultar módulo si es rol VISITA
  if (userRole === 'VISITA') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 p-8 rounded-3xl border border-amber-200 dark:border-amber-900 text-center max-w-lg mx-auto">
        <Lock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Módulo de Diezmos Restringido</h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Su rol actual (Visita - Solo Lectura) no tiene privilegios para consultar o gestionar la liquidación de diezmos congregacionales.
        </p>
      </div>
    );
  }

  const hasActiveFilters = historySearchQuery.trim() !== '' || historySelectedYear !== 'ALL' || historySelectedMonth !== 'ALL' || historyRangeFrom !== '' || historyRangeTo !== '';

  return (
    <div className="space-y-6">
      
      {/* Selector de Pestañas del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{editingTitheId ? '✏️ Editando Liquidación' : 'Calculadora de Liquidación'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Liquidaciones ({tithes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'chart'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Gráfico Evolución Anual</span>
        </button>
      </div>

      {/* Pestaña 1: Calculadora Estricta de Diezmos */}
      {activeTab === 'calculator' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Banner de Modo Edición si está activo */}
          {editingTitheId && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-600 shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                  ✏️
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                    Modo Edición Activo: Liquidación {month}/{year}
                  </h4>
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    Modifica cualquier parámetro y se recalcularán automáticamente los saldos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Cancelar Edición
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* 1. Barra Ejecutiva Superior: Parámetros del Período y Pastor (Azul Claro) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 text-slate-800 border-2 border-blue-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-blue-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">
                      Parámetros de Liquidación
                    </h3>
                    <p className="text-[10px] text-blue-700 font-medium">Configuración base del período</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 bg-white/90 border border-blue-300 px-3 py-1 rounded-full shadow-xs">
                  Módulo Contable
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Mes */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-blue-950 uppercase tracking-wider">
                    📅 Mes
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-xs"
                  >
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

                {/* Año */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-blue-950 uppercase tracking-wider">
                    📆 Año
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>

                {/* Pastor */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-blue-950 uppercase tracking-wider">
                    👤 Pastor Titular
                  </label>
                  <input
                    type="text"
                    value={pastorName}
                    onChange={(e) => setPastorName(e.target.value)}
                    required
                    placeholder="Nombre del pastor"
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>

                {/* SMLV */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-blue-950 uppercase tracking-wider">
                    ⚖️ SMLV Legal Vigente
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(smlv)}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                      setSmlv(num);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-blue-950 font-black text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>

              </div>
            </div>

            {/* 2. Tarjetas Gemelas: Diezmo Bruto y Deducción Estatutaria (Azul Claro) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tarjeta Diezmo Bruto */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/70 border-2 border-blue-200 text-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-800 bg-purple-100 border border-purple-300 px-3 py-1 rounded-full">
                      Entrada Principal
                    </span>
                    <span className="text-xs font-bold text-slate-600">Total Recaudado</span>
                  </div>
                  
                  <h4 className="text-xs font-black uppercase text-purple-950 tracking-wider mb-2">
                    Diezmo Bruto Recaudado
                  </h4>

                  <div className="relative">
                    <input
                      type="text"
                      value={grossTithe ? formatCurrency(grossTithe) : ''}
                      onChange={(e) => {
                        const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        setGrossTithe(num);
                      }}
                      placeholder="$ 0"
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-purple-200 text-purple-900 font-black text-2xl sm:text-3xl tracking-tight focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-blue-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>Base bruta de diezmos</span>
                  <span className="text-purple-800 font-black">100% Recaudo</span>
                </div>
              </div>

              {/* Tarjeta Deducción Estatutaria (% Tesorería Nacional) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-50 via-sky-50 to-rose-50/50 border-2 border-blue-200 text-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
                      Deducción Estatutaria
                    </span>
                    
                    {/* Selector de Porcentaje Pequeño */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-rose-300 shadow-xs">
                      <span className="text-[11px] font-bold text-slate-700">Aporte:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={nationalPercentage}
                        onChange={(e) => setNationalPercentage(Number(e.target.value) || 0)}
                        className="w-12 px-1 py-0.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 font-black text-xs text-center focus:ring-1 focus:ring-rose-500 outline-none"
                      />
                      <span className="text-xs font-black text-rose-800">%</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-black uppercase text-rose-950 tracking-wider mb-2">
                    Envío Tesorería Nacional
                  </h4>
                  
                  {/* Valor de Deducción Grande */}
                  <div className="px-4 py-3 rounded-2xl bg-white border-2 border-rose-200 flex items-center justify-between shadow-sm">
                    <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                      {formatCurrency(nationalTreasury)}
                    </span>
                    <span className="text-[11px] font-extrabold text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-lg uppercase">
                      Envío {nationalPercentage}%
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 mt-3 border-t border-blue-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>Aporte reglamentario nacional</span>
                  <span className="text-rose-700 font-black">{nationalPercentage}% Deducido</span>
                </div>
              </div>

            </div>

            {/* 3. Tarjetas de Distribución Contable (Azul Claro) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tarjeta 1: Ingreso Neto */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-sky-100/80 border-2 border-blue-200 text-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full inline-block mb-2.5">
                    Base Neta
                  </span>
                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    Ingreso Neto
                  </h4>
                  <p className="text-3xl font-black text-blue-800 mt-2 tracking-tight">
                    {formatCurrency(netIncome)}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-blue-200 text-[10px] font-bold text-slate-600 flex justify-between">
                  <span>Base de Liquidación</span>
                  <span className="text-blue-800 font-black">100% Neto</span>
                </div>
              </div>

              {/* Tarjeta 2: Puntos SMLV & Punto Porcentual */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-amber-50/70 border-2 border-blue-200 text-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                      Puntos SMLV
                    </span>
                    {isPointManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsPointManuallyEdited(false);
                          setCorrectedPointInput('');
                        }}
                        className="text-[10px] font-black text-amber-900 hover:underline bg-white px-2 py-0.5 rounded-md border border-amber-300 cursor-pointer shadow-xs"
                        title="Restablecer al punto calculado automático"
                      >
                        ↺ Auto ({calculatedPoint.toFixed(3)})
                      </button>
                    )}
                  </div>

                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide mb-1.5">
                    Punto Porcentual (%)
                  </h4>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.001"
                      value={isPointManuallyEdited ? correctedPointInput : (calculatedPoint ? calculatedPoint.toFixed(3) : '0')}
                      onChange={(e) => {
                        setIsPointManuallyEdited(true);
                        setCorrectedPointInput(e.target.value);
                      }}
                      className="w-full pl-3.5 pr-12 py-2 rounded-2xl bg-white border-2 border-amber-300 font-black text-amber-950 text-xl font-mono outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                      placeholder={calculatedPoint.toFixed(3)}
                    />
                    <span className="absolute right-3.5 font-mono font-black text-xs text-amber-800 pointer-events-none">
                      pts
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-blue-200 text-[10px] font-bold text-slate-600 flex justify-between">
                  <span>Calculado: {calculatedPoint.toFixed(3)} pts</span>
                  <span className={isPointManuallyEdited ? 'text-amber-800 font-black' : 'text-slate-600'}>
                    {isPointManuallyEdited ? '✏️ Editado' : 'Automático'}
                  </span>
                </div>
              </div>

              {/* Tarjeta 3: Fondo Local */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-orange-50/70 border-2 border-blue-200 text-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-900 bg-orange-100 border border-orange-300 px-3 py-1 rounded-full inline-block mb-2.5">
                    Fondo Local
                  </span>
                  <h4 className="text-xs font-black text-orange-950 uppercase tracking-wide">
                    Retención Local
                  </h4>
                  <p className="text-3xl font-black text-orange-600 mt-2 tracking-tight">
                    {formatCurrency(localFundAport)}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-blue-200 text-[10px] font-bold text-slate-600 flex justify-between">
                  <span>Reserva Congregacional</span>
                  <span className="text-orange-600 font-black">{activeCorrectedPoint.toFixed(3)}%</span>
                </div>
              </div>

            </div>

            {/* 4. Tarjeta Ejecutiva Principal (Resumen Oficial con Fondo Degradado Índigo Elegante) */}
            <div 
              className="p-6 sm:p-7 rounded-3xl text-white shadow-2xl relative overflow-hidden space-y-5"
              style={{ backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)', boxShadow: '0 25px 50px -12px rgba(67, 56, 202, 0.45)', border: '1px solid rgba(129, 140, 248, 0.3)' }}
            >
              <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 bg-white/15 px-3 py-1 rounded-full inline-block backdrop-blur-sm mb-1.5">
                    Resumen Oficial de Liquidación
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Asignación Pastoral Definitiva
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium">
                    Beneficiario: <strong className="text-white">{pastorName || 'Pastor Titular'}</strong> • Período: <strong className="text-white">{month}/{year}</strong>
                  </p>
                </div>

                {/* Monto de Asignación Pastor (Único y destacado en Blanco Brillante) */}
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block mb-0.5">
                    Total Asignación Pastor
                  </span>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                    {formatCurrency(pastorAllocation)}
                  </p>
                </div>
              </div>

              {/* Fila de los 2 Desgloses: Envío 21% (Color ROJO) y Fondo Local (Color NARANJA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-indigo-400/30">
                
                {/* 1. Envío 21% (Color ROJO) */}
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 block">
                      Envío 21%:
                    </span>
                    <span className="text-[11px] text-white/70">Tesorería Nacional</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-red-400 tracking-tight">
                    {formatCurrency(nationalTreasury)}
                  </p>
                </div>

                {/* 2. Fondo Local (Color NARANJA) */}
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 block">
                      Fondo Local:
                    </span>
                    <span className="text-[11px] text-white/70">Reserva Congregación</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-orange-400 tracking-tight">
                    {formatCurrency(localFundAport)}
                  </p>
                </div>

              </div>

            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    shareTitheWhatsApp({
                      date,
                      grossTithe,
                      nationalPercentage,
                      nationalTreasury,
                      localFundAport,
                      netIncome,
                      correctedPoint: activeCorrectedPoint,
                      pastorAllocation
                    }, pastorName);
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  title="Compartir Comprobante por WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printOfficialReceipt({
                      title: 'Comprobante de Liquidación de Diezmos',
                      subtitle: `Período: ${month}/${year}`,
                      congregationName: 'Gestión Local',
                      date: formatDate(date || new Date()),
                      details: [
                        { label: 'Pastor Titular', value: pastorName || 'Pastor' },
                        { label: 'Diezmo Bruto Recaudado', value: formatCurrency(grossTithe) },
                        { label: `Fondo Nacional (${nationalPercentage}%)`, value: `${formatCurrency(nationalTreasury)}`, color: '#dc2626' },
                        { label: 'Fondo Local Congregacional', value: `-${formatCurrency(localFundAport)}`, color: '#ea580c' },
                        { label: 'Ingreso Neto Distribuible', value: formatCurrency(netIncome), color: '#1e3a8a' },
                        { label: 'Porcentaje Asignación', value: `${activeCorrectedPoint}%` }
                      ],
                      total: formatCurrency(pastorAllocation),
                      signatures: [
                        { name: pastorName || 'Pastor', role: 'Pastor Titular' },
                        { name: 'Tesorero(a)', role: 'Tesorería Local' }
                      ]
                    });
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                  title="Imprimir Comprobante Oficial"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {editingTitheId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                )}
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Coins className="w-5 h-5" />
                  <span>{editingTitheId ? '💾 Guardar Cambios de la Liquidación' : 'Registrar Liquidación de Diezmos'}</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Pestaña 2: Historial */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Tarjetas KPI de Resumen de Totales y Promedios (Ultra Notables) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Diezmo Bruto Total */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 via-indigo-50/70 to-indigo-100/50 dark:from-indigo-950/60 dark:via-indigo-950/40 dark:to-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Total Diezmo Bruto
              </span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-950 dark:text-white mt-2">
                {formatCurrency(totalFilteredGross)}
              </p>
              <div className="pt-2.5 mt-2.5 border-t border-indigo-200/80 dark:border-indigo-800/80 flex justify-between items-center text-xs font-black text-indigo-800 dark:text-indigo-300">
                <span>Promedio Mensual:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-100">{formatCurrency(avgFilteredGross)}</span>
              </div>
            </div>

            {/* 2. Tesorería Nacional */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-rose-50/70 to-rose-100/50 dark:from-rose-950/60 dark:via-rose-950/40 dark:to-rose-900/30 border-2 border-rose-200 dark:border-rose-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Total Tesorería Nac. (21%)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {formatCurrency(totalFilteredNational)}
              </p>
              <div className="pt-2.5 mt-2.5 border-t border-rose-200/80 dark:border-rose-800/80 flex justify-between items-center text-xs font-black text-rose-800 dark:text-rose-300">
                <span>Promedio Mensual:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-200/80 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100">{formatCurrency(avgFilteredNational)}</span>
              </div>
            </div>

            {/* 3. Fondo Local */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-slate-50/70 to-slate-100/50 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-slate-900/40 border-2 border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                🏛️ Total Fondo Local
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {formatCurrency(totalFilteredLocalFund)}
              </p>
              <div className="pt-2.5 mt-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-black text-slate-700 dark:text-slate-300">
                <span>Promedio Mensual:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">{formatCurrency(avgFilteredLocalFund)}</span>
              </div>
            </div>

            {/* 4. Asignación Pastoral */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-emerald-100/50 dark:from-emerald-950/60 dark:via-emerald-950/40 dark:to-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700 shadow-md flex flex-col justify-between">
              <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total Asign. Pastoral
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
                {formatCurrency(totalFilteredPastor)}
              </p>
              <div className="pt-2.5 mt-2.5 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs font-black text-emerald-800 dark:text-emerald-300">
                <span>Promedio Mensual:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100">{formatCurrency(avgFilteredPastor)}</span>
              </div>
            </div>

          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Historial de Diezmos Liquidados ({getHistoryPeriodLabel()})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consulta, audita y edita las liquidaciones mensuales con cálculo automático de totales y promedios en vivo
                </p>
              </div>
            </div>

            {/* Barra de Filtros de Historial: Búsqueda, Año, Mes, Rango de Meses y Exportaciones */}
            <div className="space-y-3.5 p-4.5 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/30 border-2 border-indigo-200/80 dark:border-indigo-900/60 shadow-sm">
              
              <div className="flex items-center justify-between pb-1 border-b border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Filtros Disponibles
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearchQuery('');
                      setHistorySelectedYear('ALL');
                      setHistorySelectedMonth('ALL');
                      setHistoryRangeFrom('');
                      setHistoryRangeTo('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 font-black text-[11px] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpiar Filtros</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Buscar */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">Buscar</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Pastor, valor o fecha..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. Filtro por Año */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">Año</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={historySelectedYear}
                      onChange={(e) => {
                        setHistorySelectedYear(e.target.value);
                        if (e.target.value !== 'ALL') {
                          setHistoryRangeFrom('');
                          setHistoryRangeTo('');
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="ALL">📅 Todos los Años</option>
                      {availableYears.map(y => (
                        <option key={y} value={y}>Año {y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Filtro por Mes */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">Mes</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={historySelectedMonth}
                      onChange={(e) => {
                        setHistorySelectedMonth(e.target.value);
                        if (e.target.value !== 'ALL') {
                          setHistoryRangeFrom('');
                          setHistoryRangeTo('');
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="ALL">🗓️ Todos los Meses</option>
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
                </div>

                {/* 4. Filtro por Rango: Desde (Mes/Año) */}
                <div>
                  <label className="block text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase mb-1">
                    Desde (Mes/Año)
                  </label>
                  <input
                    type="month"
                    value={historyRangeFrom}
                    onChange={(e) => {
                      setHistoryRangeFrom(e.target.value);
                      if (e.target.value) {
                        setHistorySelectedYear('ALL');
                        setHistorySelectedMonth('ALL');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* 5. Filtro por Rango: Hasta (Mes/Año) */}
                <div>
                  <label className="block text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase mb-1">
                    Hasta (Mes/Año)
                  </label>
                  <input
                    type="month"
                    value={historyRangeTo}
                    onChange={(e) => {
                      setHistoryRangeTo(e.target.value);
                      if (e.target.value) {
                        setHistorySelectedYear('ALL');
                        setHistorySelectedMonth('ALL');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Barra de Acciones de Exportación */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                {/* 1. Botón Exportar PDF (Elegante y sin firmas) */}
                <button
                  type="button"
                  onClick={() => {
                    printFilteredTithesReport({
                      congregationName,
                      pastorName,
                      period: getHistoryPeriodLabel(),
                      tithes: filteredTithes,
                      totals: {
                        grossIncome: totalFilteredGross,
                        nationalShare: totalFilteredNational,
                        netIncome: totalFilteredNet,
                        localFundAport: totalFilteredLocalFund,
                        pastorAllocation: totalFilteredPastor
                      },
                      averages: {
                        avgGross: avgFilteredGross,
                        avgNational: avgFilteredNational,
                        avgNet: avgFilteredNet,
                        avgLocal: avgFilteredLocalFund,
                        avgPastor: avgFilteredPastor
                      }
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
                  title="Exportar Reporte a PDF con Totales y Promedios (Sin firmas)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar PDF</span>
                </button>

                {/* 2. Botón Exportar Excel (.xlsx con totales y promedios) */}
                <button
                  type="button"
                  onClick={() => {
                    exportTithesToExcel({
                      tithes: filteredTithes,
                      pastorName,
                      period: getHistoryPeriodLabel(),
                      congregationName,
                      fileName: `Liquidacion_Diezmos_${getHistoryPeriodLabel().replace(/[^a-zA-Z0-9_-]/g, '_')}`
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                  title="Exportar a Libro de Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>

                {/* 3. Compartir por WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    shareTithesHistoryWhatsApp({
                      congregationName,
                      pastorName,
                      period: getHistoryPeriodLabel(),
                      tithes: filteredTithes,
                      totals: {
                        grossIncome: totalFilteredGross,
                        nationalShare: totalFilteredNational,
                        netIncome: totalFilteredNet,
                        localFundAport: totalFilteredLocalFund,
                        pastorAllocation: totalFilteredPastor
                      },
                      averages: {
                        avgGross: avgFilteredGross,
                        avgNational: avgFilteredNational,
                        avgNet: avgFilteredNet,
                        avgLocal: avgFilteredLocalFund,
                        avgPastor: avgFilteredPastor
                      }
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer"
                  title="Compartir resumen por WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                {/* 4. Copiar Texto del Resumen */}
                <button
                  type="button"
                  onClick={() => {
                    copyTithesHistoryText({
                      congregationName,
                      pastorName,
                      period: getHistoryPeriodLabel(),
                      tithes: filteredTithes,
                      totals: {
                        grossIncome: totalFilteredGross,
                        nationalShare: totalFilteredNational,
                        netIncome: totalFilteredNet,
                        localFundAport: totalFilteredLocalFund,
                        pastorAllocation: totalFilteredPastor
                      },
                      averages: {
                        avgGross: avgFilteredGross,
                        avgNational: avgFilteredNational,
                        avgNet: avgFilteredNet,
                        avgLocal: avgFilteredLocalFund,
                        avgPastor: avgFilteredPastor
                      }
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                  title="Copiar texto resumen al portapapeles"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copiar</span>
                </button>
              </div>

            </div>

            {filteredTithes.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                No se encontraron diezmos liquidados con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-indigo-50/70 dark:bg-indigo-950/60 border-b-2 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 font-black uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Mes/Año</th>
                      <th className="py-3.5 px-4">Pastor</th>
                      <th className="py-3.5 px-4 text-right">Diezmo Bruto</th>
                      <th className="py-3.5 px-4 text-right">Tesor. Nac.</th>
                      <th className="py-3.5 px-4 text-right">Ingreso Neto</th>
                      <th className="py-3.5 px-4 text-center">Puntos</th>
                      <th className="py-3.5 px-4 text-right">Fondo Local</th>
                      <th className="py-3.5 px-4 text-right">Asign. Pastor</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
                    {filteredTithes.map((t) => (
                      <tr key={t.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          {String(t.month).padStart(2, '0')}/{t.year}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{t.pastorName || t.balanceGroup || pastorName || 'Pastor'}</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(t.grossTithe ?? t.grossIncome ?? 0)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(t.nationalTreasury ?? t.nationalShare ?? 0)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-indigo-950 dark:text-white">{formatCurrency(t.netIncome || 0)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-mono font-black text-[11px]">
                            {t.correctedPoint ?? t.pastorAllocationPercentage ?? 0} pts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">{formatCurrency(t.localFundAport || 0)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrency(t.pastorAllocation || 0)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => shareTitheWhatsApp(t, t.pastorName || pastorName)}
                              className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 transition-all hover:scale-105 cursor-pointer"
                              title="Compartir por WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                printOfficialReceipt({
                                  title: 'Comprobante de Liquidación de Diezmos',
                                  subtitle: `Período: ${t.month}/${t.year}`,
                                  congregationName: 'Gestión Local',
                                  date: formatDate(t.date || new Date()),
                                  details: [
                                    { label: 'Pastor Titular', value: t.pastorName || pastorName || 'Pastor' },
                                    { label: 'Diezmo Bruto Recaudado', value: formatCurrency(t.grossTithe ?? t.grossIncome ?? 0) },
                                    { label: `Fondo Nacional (${t.nationalPercentage || 10}%)`, value: `${formatCurrency(t.nationalTreasury ?? t.nationalShare ?? 0)}`, color: '#dc2626' },
                                    { label: 'Fondo Local Congregacional', value: `-${formatCurrency(t.localFundAport || 0)}`, color: '#ea580c' },
                                    { label: 'Ingreso Neto Distribuible', value: formatCurrency(t.netIncome || 0), color: '#1e3a8a' },
                                    { label: 'Porcentaje Asignación', value: `${t.correctedPoint ?? t.pastorAllocationPercentage ?? 50}%` }
                                  ],
                                  total: formatCurrency(t.pastorAllocation || 0),
                                  signatures: [
                                    { name: t.pastorName || pastorName || 'Pastor', role: 'Pastor Titular' },
                                    { name: 'Tesorero(a)', role: 'Tesorería Local' }
                                  ]
                                });
                              }}
                              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 cursor-pointer"
                              title="Imprimir Recibo"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => handleStartEdit(t)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/60 p-2 rounded-xl border border-blue-200/60 dark:border-blue-900/60 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                title="Editar liquidación"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {userRole === 'ADMIN' && onDeleteTithe && (
                              <button
                                onClick={() => {
                                  if(window.confirm(`¿Estás seguro de eliminar la liquidación de diezmo de ${t.month}/${t.year}?`)) {
                                    onDeleteTithe(t);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                title="Eliminar liquidación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  
                  {/* Fila de Totales y Fila de Promedios */}
                  <tfoot>
                    {/* FILA 1: TOTALES */}
                    <tr className="bg-indigo-100/90 dark:bg-indigo-950/90 border-t-3 border-indigo-400 dark:border-indigo-600 text-slate-900 dark:text-white font-black text-xs">
                      <td className="py-4 px-4 uppercase tracking-wider font-black text-indigo-950 dark:text-indigo-200 text-sm">
                        TOTAL GENERAL ({count} {count === 1 ? 'REG.' : 'REGS.'})
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-400 dark:text-slate-500 text-center">-</td>
                      <td className="py-4 px-4 text-right font-black text-slate-950 dark:text-white text-base">{formatCurrency(totalFilteredGross)}</td>
                      <td className="py-4 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-base">{formatCurrency(totalFilteredNational)}</td>
                      <td className="py-4 px-4 text-right font-black text-indigo-950 dark:text-white text-base">{formatCurrency(totalFilteredNet)}</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-400 dark:text-slate-500">-</td>
                      <td className="py-4 px-4 text-right font-black text-slate-800 dark:text-slate-200 text-base">{formatCurrency(totalFilteredLocalFund)}</td>
                      <td className="py-4 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(totalFilteredPastor)}</td>
                      <td className="py-4 px-4 text-center text-slate-400 dark:text-slate-500">-</td>
                    </tr>

                    {/* FILA 2: PROMEDIOS CALCULADOS */}
                    <tr className="bg-indigo-50/80 dark:bg-indigo-900/60 border-t-2 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100 font-black text-xs">
                      <td className="py-3.5 px-4 uppercase tracking-wider font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>PROMEDIO MENSUAL</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-400 dark:text-slate-500 text-center">-</td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-950 dark:text-indigo-100 text-sm">{formatCurrency(avgFilteredGross)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-700 dark:text-rose-300 text-sm">{formatCurrency(avgFilteredNational)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-950 dark:text-indigo-100 text-sm">{formatCurrency(avgFilteredNet)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 dark:text-slate-500">-</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-800 dark:text-slate-200 text-sm">{formatCurrency(avgFilteredLocalFund)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 dark:text-emerald-300 text-sm">{formatCurrency(avgFilteredPastor)}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500">-</td>
                    </tr>
                  </tfoot>

                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 3: Gráfico y Resumen Anual / Rango de Meses */}
      {activeTab === 'chart' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Selector de Período del Gráfico y Botones de Exportación */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200/80 dark:border-indigo-900/60 shadow-sm">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Evolución Temporal de Diezmos ({getChartPeriodLabel()})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualiza el comportamiento financiero por año o por rango personalizado de meses con cálculo de totales y promedios
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Selector por Año */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Año:</span>
                <select
                  value={chartYear}
                  onChange={(e) => {
                    setChartYear(e.target.value);
                    setChartRangeFrom('');
                    setChartRangeTo('');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-black text-xs shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Rango de Meses en Gráfico */}
              <div className="flex items-center gap-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-300">Rango:</span>
                <input
                  type="month"
                  value={chartRangeFrom}
                  onChange={(e) => setChartRangeFrom(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                  title="Mes inicial"
                />
                <span className="text-xs font-bold text-slate-400">a</span>
                <input
                  type="month"
                  value={chartRangeTo}
                  onChange={(e) => setChartRangeTo(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                  title="Mes final"
                />
                {(chartRangeFrom || chartRangeTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setChartRangeFrom('');
                      setChartRangeTo('');
                    }}
                    className="p-1 text-rose-600 hover:text-rose-800 dark:text-rose-400 cursor-pointer"
                    title="Restablecer a vista anual"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botón Descargar PNG */}
              <button
                type="button"
                onClick={() => downloadChartImage(chartRef, `Grafico_Diezmo_Evolucion_${getChartPeriodLabel().replace(/[^a-zA-Z0-9_-]/g, '_')}.png`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
                title="Descargar gráfico como imagen PNG"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>PNG</span>
              </button>

              {/* Botón Imprimir / PDF */}
              <button
                type="button"
                onClick={() => {
                  printChartReport({
                    title: 'Reporte de Evolución Temporal de Diezmos',
                    subtitle: `Evolución financiera y análisis estadístico comparativo`,
                    congregationName,
                    period: getChartPeriodLabel(),
                    chartRef,
                    stats: [
                      { label: 'Diezmo Bruto Total', value: formatCurrency(chartTotGross) },
                      { label: 'Diezmo Bruto Promedio', value: `${formatCurrency(avgGrossIncome)}/mes` },
                      { label: 'Total Asignación Pastoral', value: formatCurrency(chartTotPastor) },
                      { label: 'Asignación Pastoral Promedio', value: `${formatCurrency(avgPastorAllocation)}/mes` },
                      { label: 'Total Tesorería Nac. (21%)', value: formatCurrency(chartTotNational) },
                      { label: 'Total Fondo Local', value: formatCurrency(chartTotLocal) },
                      { label: 'Mes con Mayor Recaudo', value: maxGrossMonth ? `${getMonthName(maxGrossMonth.month)}/${maxGrossMonth.year} (${formatCurrency(maxGrossAmount)})` : '-' },
                      { label: 'Mes con Menor Recaudo', value: minGrossMonth ? `${getMonthName(minGrossMonth.month)}/${minGrossMonth.year} (${formatCurrency(minGrossAmount)})` : '-' }
                    ]
                  });
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                title="Imprimir reporte del gráfico o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* Gráfico Canvas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Curva de Evolución Temporal ({getChartPeriodLabel()})</h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isChartRangeActive ? 'Vista por Rango de Meses' : 'Vista Anual Completa (12 Meses)'}
              </span>
            </div>
            <div className="h-80">
              <Line ref={chartRef} data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          {/* Resumen Estadístico Completo, Totales y Promedios (Ultra Notables) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Resumen Financiero, Totales y Promedios ({getChartPeriodLabel()})
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {chartCount} {chartCount === 1 ? 'mes registrado' : 'meses registrados'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Diezmo Bruto */}
              <div className="p-5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Diezmo Bruto Total
                </span>
                <p className="text-2xl lg:text-3xl font-black text-indigo-950 dark:text-white mt-2">
                  {formatCurrency(chartTotGross)}
                </p>
                <div className="pt-2 mt-2 border-t border-indigo-200 dark:border-indigo-800/80 flex justify-between items-center text-xs font-black text-indigo-800 dark:text-indigo-300">
                  <span>Promedio:</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-100">{formatCurrency(avgGrossIncome)}/mes</span>
                </div>
              </div>

              {/* 2. Asignación Pastoral */}
              <div className="p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Asignación Pastoral Total
                </span>
                <p className="text-2xl lg:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
                  {formatCurrency(chartTotPastor)}
                </p>
                <div className="pt-2 mt-2 border-t border-emerald-200 dark:border-emerald-800/80 flex justify-between items-center text-xs font-black text-emerald-800 dark:text-emerald-300">
                  <span>Promedio:</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100">{formatCurrency(avgPastorAllocation)}/mes</span>
                </div>
              </div>

              {/* 3. Tesorería Nacional */}
              <div className="p-5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-black text-rose-950 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Tesorería Nacional (21%)
                </span>
                <p className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                  {formatCurrency(chartTotNational)}
                </p>
                <div className="pt-2 mt-2 border-t border-rose-200 dark:border-rose-800/80 flex justify-between items-center text-xs font-black text-rose-800 dark:text-rose-300">
                  <span>Promedio:</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-200/80 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100">{formatCurrency(avgNationalAllocation)}/mes</span>
                </div>
              </div>

              {/* 4. Fondo Local */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  🏛️ Fondo Local Total
                </span>
                <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2">
                  {formatCurrency(chartTotLocal)}
                </p>
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-black text-slate-700 dark:text-slate-300">
                  <span>Promedio:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">{formatCurrency(avgLocalAllocation)}/mes</span>
                </div>
              </div>
            </div>

            {/* Extremos del Período: Mes Mayor y Menor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">🏆 Mes con Mayor Recaudo</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {maxGrossMonth ? `${getMonthName(maxGrossMonth.month)} de ${maxGrossMonth.year}` : 'Sin datos'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-900 dark:text-amber-300">{formatCurrency(maxGrossAmount)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider">📉 Mes con Menor Recaudo</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {minGrossMonth ? `${getMonthName(minGrossMonth.month)} de ${minGrossMonth.year}` : 'Sin datos'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-300">{formatCurrency(minGrossAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
