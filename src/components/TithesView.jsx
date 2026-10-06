import React, { useState, useMemo, useRef } from 'react';
import { Calculator, History, TrendingUp, Lock, Pencil, Trash2, Search, Calendar, X, AlertCircle, Coins, Building2, UserCheck, BarChart3, Filter, Share2, Printer, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel, shareTitheWhatsApp, printOfficialReceipt, downloadChartImage, printChartReport } from '../utils/exportHelpers';
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

  // Año seleccionado para el gráfico de evolución
  const [chartYear, setChartYear] = useState(String(new Date().getFullYear()));
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
  
  // Datos para gráfico de evolución del Diezmo Bruto
  const chartDataValues = monthNames.map((_, index) => {
    const monthIndex = (index + 1).toString().padStart(2, '0');
    const found = tithes.find(t => String(t.month).padStart(2, '0') === monthIndex && String(t.year) === String(chartYear));
    return found ? (found.grossTithe ?? found.grossIncome ?? 0) : 0;
  });

  const chartData = {
    labels: monthNames,
    datasets: [
      {
        label: `Diezmo Bruto ${chartYear} ($)`,
        data: chartDataValues,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 6,
        pointBackgroundColor: '#4338ca',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  // Filtro y ordenamiento del historial (del más reciente al más antiguo)
  const filteredTithes = useMemo(() => {
    return tithes.filter(t => {
      // Filtro por Año
      if (historySelectedYear !== 'ALL' && String(t.year) !== historySelectedYear) {
        return false;
      }
      // Filtro por Mes
      if (historySelectedMonth !== 'ALL') {
        const tMonth = String(t.month).padStart(2, '0');
        if (tMonth !== historySelectedMonth) return false;
      }
      // Filtro por Búsqueda
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchPastor = (t.pastorName || t.balanceGroup || '').toLowerCase().includes(q);
        const matchGross = String(t.grossTithe ?? t.grossIncome ?? '').includes(q);
        const matchNet = String(t.netIncome || '').includes(q);
        const matchAlloc = String(t.pastorAllocation || '').includes(q);
        const matchDate = `${String(t.month).padStart(2, '0')}/${t.year}`.includes(q);
        if (!matchPastor && !matchGross && !matchNet && !matchAlloc && !matchDate) return false;
      }
      return true;
    }).sort((a, b) => {
      const yrDiff = Number(b.year) - Number(a.year);
      if (yrDiff !== 0) return yrDiff;
      return Number(b.month) - Number(a.month);
    });
  }, [tithes, historySelectedYear, historySelectedMonth, historySearchQuery]);

  // Totales sumados de cada ítem en el historial
  const count = filteredTithes.length;
  const totalFilteredGross = filteredTithes.reduce((acc, t) => acc + (t.grossTithe ?? t.grossIncome ?? 0), 0);
  const totalFilteredNational = filteredTithes.reduce((acc, t) => acc + (t.nationalTreasury ?? t.nationalShare ?? 0), 0);
  const totalFilteredNet = filteredTithes.reduce((acc, t) => acc + (t.netIncome || 0), 0);
  const totalFilteredLocalFund = filteredTithes.reduce((acc, t) => acc + (t.localFundAport || 0), 0);
  const totalFilteredPastor = filteredTithes.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0);

  // Promedios matemáticos de los datos mostrados (bien calculados)
  const avgFilteredGross = count > 0 ? Math.round(totalFilteredGross / count) : 0;
  const avgFilteredNational = count > 0 ? Math.round(totalFilteredNational / count) : 0;
  const avgFilteredNet = count > 0 ? Math.round(totalFilteredNet / count) : 0;
  const avgFilteredLocalFund = count > 0 ? Math.round(totalFilteredLocalFund / count) : 0;
  const avgFilteredPastor = count > 0 ? Math.round(totalFilteredPastor / count) : 0;

  // Cálculos de Resumen Anual para la pestaña de Gráfico
  const currentChartYearTithes = tithes.filter(t => String(t.year) === String(chartYear));
  
  const avgGrossIncome = currentChartYearTithes.length > 0
    ? currentChartYearTithes.reduce((acc, t) => acc + (t.grossTithe ?? t.grossIncome ?? 0), 0) / currentChartYearTithes.length
    : 0;
    
  const avgPastorAllocation = currentChartYearTithes.length > 0
    ? currentChartYearTithes.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0) / currentChartYearTithes.length
    : 0;

  const maxGrossMonth = currentChartYearTithes.length > 0
    ? currentChartYearTithes.reduce((max, t) => (((t.grossTithe ?? t.grossIncome ?? 0)) > ((max.grossTithe ?? max.grossIncome ?? 0)) ? t : max), currentChartYearTithes[0])
    : null;

  const minGrossMonth = currentChartYearTithes.length > 0
    ? currentChartYearTithes.reduce((min, t) => (((t.grossTithe ?? t.grossIncome ?? 0)) < ((min.grossTithe ?? min.grossIncome ?? 0)) ? t : min), currentChartYearTithes[0])
    : null;

  const maxGrossAmount = maxGrossMonth ? (maxGrossMonth.grossTithe ?? maxGrossMonth.grossIncome ?? 0) : 0;
  const minGrossAmount = minGrossMonth ? (minGrossMonth.grossTithe ?? minGrossMonth.grossIncome ?? 0) : 0;

  const getMonthName = (m) => monthNames[parseInt(m) - 1] || '-';

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

  const hasActiveFilters = historySearchQuery.trim() !== '' || historySelectedYear !== 'ALL' || historySelectedMonth !== 'ALL';

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
                        { label: `Fondo Nacional (${nationalPercentage}%)`, value: `-${formatCurrency(nationalTreasury)}`, color: '#dc2626' },
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
        <div className="space-y-6">
          
          {/* Tarjetas KPI de Resumen de Totales y Promedios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Total Diezmo Bruto
              </span>
              <p className="text-2xl font-black text-indigo-950 dark:text-white mt-2">
                {formatCurrency(totalFilteredGross)}
              </p>
              <div className="pt-2 mt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex justify-between items-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                <span>Promedio: {formatCurrency(avgFilteredGross)}</span>
                <span>{count} regs.</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Total Tesorería Nac.
              </span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {formatCurrency(totalFilteredNational)}
              </p>
              <div className="pt-2 mt-2 border-t border-rose-100 dark:border-rose-900/60 flex justify-between items-center text-[10px] font-bold text-rose-700 dark:text-rose-300">
                <span>Promedio: {formatCurrency(avgFilteredNational)}</span>
                <span>Aporte Nacional</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                🏛️ Total Fondo Local
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {formatCurrency(totalFilteredLocalFund)}
              </p>
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                <span>Promedio: {formatCurrency(avgFilteredLocalFund)}</span>
                <span>Fondo Local</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-100/90 via-indigo-50 to-blue-50 dark:from-indigo-950/60 dark:via-indigo-900/40 dark:to-slate-900 border-2 border-indigo-300 dark:border-indigo-700 shadow-md flex flex-col justify-between">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Total Asign. Pastoral
              </span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                {formatCurrency(totalFilteredPastor)}
              </p>
              <div className="pt-2 mt-2 border-t border-indigo-200 dark:border-indigo-800 flex justify-between items-center text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
                <span>Promedio: {formatCurrency(avgFilteredPastor)}</span>
                <span>Neto Pastoral</span>
              </div>
            </div>

          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Historial de Diezmos Liquidados</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Consulta, audita y edita las liquidaciones mensuales con cálculo de totales y promedios en vivo</p>
              </div>
            </div>

            {/* Barra de Filtros de Historial: Año, Mes y Búsqueda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
              
              {/* 1. Buscar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por pastor o valor..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* 2. Filtro por Año */}
              <div className="relative">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={historySelectedYear}
                  onChange={(e) => setHistorySelectedYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">📅 Todos los Años</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>Año {y}</option>
                  ))}
                </select>
              </div>

              {/* 3. Filtro por Mes */}
              <div className="relative">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={historySelectedMonth}
                  onChange={(e) => setHistorySelectedMonth(e.target.value)}
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

              {/* 4. Botón Limpiar */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setHistorySearchQuery('');
                    setHistorySelectedYear('ALL');
                    setHistorySelectedMonth('ALL');
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}

              {/* 5. Botón Exportar a Excel */}
              <button
                type="button"
                onClick={() => {
                  const exportData = filteredTithes.map(t => ({
                    'Período': `${String(t.month).padStart(2, '0')}/${t.year}`,
                    'Pastor': t.pastorName || pastorName || 'Pastor',
                    'Diezmo Bruto': t.grossTithe ?? t.grossIncome ?? 0,
                    'Tesorería Nacional': t.nationalTreasury ?? t.nationalShare ?? 0,
                    'Ingreso Neto': t.netIncome || 0,
                    'Puntos Asignación': t.correctedPoint ?? t.pastorAllocationPercentage ?? 0,
                    'Fondo Local': t.localFundAport || 0,
                    'Asignación Pastor': t.pastorAllocation || 0
                  }));
                  exportToExcel(exportData, 'Historial_Liquidacion_Diezmos');
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>
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
                                    { label: `Fondo Nacional (${t.nationalPercentage || 10}%)`, value: `-${formatCurrency(t.nationalTreasury ?? t.nationalShare ?? 0)}`, color: '#dc2626' },
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
                    <tr className="bg-indigo-50/90 dark:bg-indigo-950/80 border-t-2 border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-white font-black text-xs">
                      <td className="py-3.5 px-4 uppercase tracking-wider font-black text-indigo-950 dark:text-indigo-200">
                        TOTAL ({count} {count === 1 ? 'REG.' : 'REGS.'})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-400 dark:text-slate-500 text-center">-</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-950 dark:text-white text-sm">{formatCurrency(totalFilteredGross)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalFilteredNational)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-950 dark:text-white text-sm">{formatCurrency(totalFilteredNet)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 dark:text-slate-500">-</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-800 dark:text-slate-200">{formatCurrency(totalFilteredLocalFund)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrency(totalFilteredPastor)}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500">-</td>
                    </tr>

                    {/* FILA 2: PROMEDIOS CALCULADOS */}
                    <tr className="bg-indigo-100/70 dark:bg-indigo-900/50 border-t border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100 font-extrabold text-xs">
                      <td className="py-3.5 px-4 uppercase tracking-wider font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>PROMEDIO</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-400 dark:text-slate-500 text-center">-</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-indigo-950 dark:text-indigo-100">{formatCurrency(avgFilteredGross)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-700 dark:text-rose-300">{formatCurrency(avgFilteredNational)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-indigo-950 dark:text-indigo-100">{formatCurrency(avgFilteredNet)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 dark:text-slate-500">-</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(avgFilteredLocalFund)}</td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-700 dark:text-indigo-300">{formatCurrency(avgFilteredPastor)}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500">-</td>
                    </tr>
                  </tfoot>

                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 3: Gráfico y Resumen Anual */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          
          {/* Selector de Año del Gráfico y Botones de Exportación */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Evolución Anual del Diezmo Bruto</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comportamiento financiero mes a mes</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Año:</span>
                <select
                  value={chartYear}
                  onChange={(e) => setChartYear(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-black text-xs shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Botón Descargar PNG */}
              <button
                type="button"
                onClick={() => downloadChartImage(chartRef, `Grafico_Diezmo_Evolucion_${chartYear}.png`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
                title="Descargar gráfico como imagen PNG"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Imagen PNG</span>
              </button>

              {/* Botón Imprimir / PDF */}
              <button
                type="button"
                onClick={() => {
                  printChartReport({
                    title: 'Reporte de Evolución Anual de Diezmos',
                    subtitle: `Evolución financiera y análisis estadístico comparativo`,
                    congregationName: 'Gestión Local',
                    period: chartYear,
                    chartRef,
                    stats: [
                      { label: 'Ingreso Bruto Promedio', value: formatCurrency(avgGrossIncome) },
                      { label: 'Asignación Pastoral Promedio', value: formatCurrency(avgPastorAllocation) },
                      { label: 'Mes con Mayor Recaudo', value: maxGrossMonth ? `${getMonthName(maxGrossMonth.month)} (${formatCurrency(maxGrossAmount)})` : '-' },
                      { label: 'Mes con Menor Recaudo', value: minGrossMonth ? `${getMonthName(minGrossMonth.month)} (${formatCurrency(minGrossAmount)})` : '-' }
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

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Curva de Evolución ({chartYear})</h2>
            <div className="h-72">
              <Line ref={chartRef} data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Resumen Estadístico ({chartYear})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ingreso Bruto Promedio</span>
                <p className="text-lg font-black text-indigo-950 dark:text-white mt-1">{formatCurrency(avgGrossIncome)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Asign. Pastor Promedio</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(avgPastorAllocation)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mes Más Alto</span>
                <p className="text-lg font-black text-indigo-950 dark:text-white mt-1">
                  {maxGrossMonth ? `${getMonthName(maxGrossMonth.month)} (${formatCurrency(maxGrossAmount)})` : '-'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mes Más Bajo</span>
                <p className="text-lg font-black text-indigo-950 dark:text-white mt-1">
                  {minGrossMonth ? `${getMonthName(minGrossMonth.month)} (${formatCurrency(minGrossAmount)})` : '-'}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
