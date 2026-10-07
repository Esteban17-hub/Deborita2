import React, { useState, useMemo, useRef } from 'react';
import { HandHeart, BarChart2, PlusCircle, Pencil, Trash2, Search, Filter, X, Calendar, Layers, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Share2, Printer, FileSpreadsheet, Copy, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, formatDate, deduceDayOfWeek, compareDatesAsc } from '../utils/formatters';
import { exportToExcel, shareOfferingWhatsApp, printOfficialReceipt, printFilteredOfferingsReport, shareOfferingsReportWhatsApp, copyOfferingsSummaryText, downloadChartImage, printChartReport } from '../utils/exportHelpers';
import MoneyInput from './MoneyInput';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_DAYS = ['Domingo', 'Martes', 'Jueves', 'Sábado', 'Lunes', 'Miércoles', 'Viernes'];

export default function OfferingsView({
  offerings = [],
  committees = [],
  userRole = 'ADMIN',
  congregationName = 'Gestión Local',
  isMobile = false,
  onAddOffering,
  onUpdateOffering,
  onDeleteOffering,
  onCreateCommittee,
  onUpdateCommittee,
  onDeleteCommittee
}) {
  const safeOfferings = Array.isArray(offerings) ? offerings : [];
  const safeCommittees = Array.isArray(committees) ? committees : [];

  // Mes actual por defecto (YYYY-MM)
  const currentRealMonth = new Date().toISOString().slice(0, 7);
  
  // Si no hay ofrendas en el mes actual pero sí en meses previos, seleccionar el mes más reciente con datos
  const initialViewingMonth = useMemo(() => {
    const hasCurrent = safeOfferings.some(o => o?.date?.startsWith(currentRealMonth));
    if (hasCurrent || safeOfferings.length === 0) return currentRealMonth;
    const sortedDates = safeOfferings.map(o => o.date).filter(Boolean).sort().reverse();
    return sortedDates[0]?.slice(0, 7) || currentRealMonth;
  }, [safeOfferings, currentRealMonth]);

  // Estado del Navegador de Mes
  const [viewingMonth, setViewingMonth] = useState(initialViewingMonth);
  const monthlyChartRef = useRef(null);

  // Filtro de Año para el Consolidado Anual del final
  const currentYearStr = viewingMonth.slice(0, 4);
  const [selectedAnnualYear, setSelectedAnnualYear] = useState(currentYearStr);
  const annualChartRef = useRef(null);

  // Modal Registro / Edición de Ofrenda
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferingId, setEditingOfferingId] = useState(null);
  const [offeringDate, setOfferingDate] = useState(new Date().toISOString().slice(0, 10));
  const [destinationCommitteeId, setDestinationCommitteeId] = useState(safeCommittees[0]?.id || '');
  const [amount, setAmount] = useState(0);
  const [responsible, setResponsible] = useState('Tesorero General');
  const [notes, setNotes] = useState('');

  // Modal Gestión de Comités
  const [isManageCommitteesOpen, setIsManageCommitteesOpen] = useState(false);
  const [editingCommitteeId, setEditingCommitteeId] = useState(null);
  const [commNameInput, setCommNameInput] = useState('');
  const [commTreasurerInput, setCommTreasurerInput] = useState('');

  // Filtros de la Tabla Histórica
  const [searchQuery, setSearchQuery] = useState('');
  const [tableMonthFilter, setTableMonthFilter] = useState('ALL');
  const [selectedCommittee, setSelectedCommittee] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');

  const isReadOnly = userRole === 'VISITA';
  const autoDay = deduceDayOfWeek(offeringDate);

  // Navegación Mes a Mes
  const handlePrevMonth = () => {
    const [year, month] = viewingMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setViewingMonth(formatted);
  };

  const handleNextMonth = () => {
    const [year, month] = viewingMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setViewingMonth(formatted);
  };

  const [vYear, vMonthNum] = viewingMonth.split('-').map(Number);
  const viewingMonthLabel = `${MONTH_NAMES[vMonthNum - 1] || ''} ${vYear}`;

  // Ofrendas del Mes Seleccionado
  const monthlyOfferings = useMemo(() => {
    return safeOfferings.filter(o => o && o.date && o.date.startsWith(viewingMonth));
  }, [safeOfferings, viewingMonth]);

  const monthlyTotal = useMemo(() => {
    return monthlyOfferings.reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [monthlyOfferings]);

  // Estadísticas del Mes Seleccionado por Día
  const monthlyDayStats = useMemo(() => {
    const stats = {};
    const counts = {};
    monthlyOfferings.forEach(o => {
      const day = o.dayOfWeek || (o.date ? deduceDayOfWeek(o.date) : 'Otro');
      stats[day] = (stats[day] || 0) + (o.amount || 0);
      counts[day] = (counts[day] || 0) + 1;
    });
    return { stats, counts };
  }, [monthlyOfferings]);

  // Gráfico del Mes Seleccionado
  const monthlyChartData = {
    labels: WEEK_DAYS,
    datasets: [
      {
        label: `Recaudación en ${viewingMonthLabel} ($)`,
        data: WEEK_DAYS.map(d => monthlyDayStats.stats[d] || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderColor: 'rgb(217, 119, 6)',
        borderWidth: 2,
        borderRadius: 10,
        hoverBackgroundColor: 'rgba(217, 119, 6, 0.95)'
      }
    ]
  };

  // --- SECCIÓN CONSOLIDADO ANUAL / HISTÓRICO ---
  // Años disponibles en los datos
  const availableYears = useMemo(() => {
    const years = new Set(safeOfferings.map(o => o.date?.slice(0, 4)).filter(Boolean));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [safeOfferings]);

  // Ofrendas para el consolidado (filtradas por año o todas)
  const annualOfferings = useMemo(() => {
    if (selectedAnnualYear === 'ALL') return safeOfferings;
    return safeOfferings.filter(o => o?.date?.startsWith(selectedAnnualYear));
  }, [safeOfferings, selectedAnnualYear]);

  const annualTotal = useMemo(() => {
    return annualOfferings.reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [annualOfferings]);

  // Estadísticas acumuladas por día (Anual / Total)
  const annualDayStats = useMemo(() => {
    const stats = {};
    const counts = {};
    annualOfferings.forEach(o => {
      const day = o.dayOfWeek || (o.date ? deduceDayOfWeek(o.date) : 'Otro');
      stats[day] = (stats[day] || 0) + (o.amount || 0);
      counts[day] = (counts[day] || 0) + 1;
    });
    return { stats, counts };
  }, [annualOfferings]);

  // Gráfico Anual Acumulado
  const annualChartData = {
    labels: WEEK_DAYS,
    datasets: [
      {
        label: `Recaudación Acumulada (${selectedAnnualYear === 'ALL' ? 'Histórico' : selectedAnnualYear}) ($)`,
        data: WEEK_DAYS.map(d => annualDayStats.stats[d] || 0),
        backgroundColor: 'rgba(234, 88, 12, 0.85)',
        borderColor: 'rgb(194, 65, 12)',
        borderWidth: 2,
        borderRadius: 10,
        hoverBackgroundColor: 'rgba(194, 65, 12, 0.95)'
      }
    ]
  };

  // --- ORDEN DE TABLA HISTÓRICA: DEL MÁS RECIENTE AL MÁS ANTIGUO ---
  const sortedOfferings = useMemo(() => {
    return [...safeOfferings].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateDiff = dateB.localeCompare(dateA);
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [safeOfferings]);

  // Manejo de Creación / Edición
  const handleOpenCreate = () => {
    setEditingOfferingId(null);
    setOfferingDate(new Date().toISOString().slice(0, 10));
    setDestinationCommitteeId(safeCommittees[0]?.id || '');
    setAmount(0);
    setResponsible('Tesorero General');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (o) => {
    setEditingOfferingId(o.id);
    setOfferingDate(o.date || new Date().toISOString().slice(0, 10));
    setDestinationCommitteeId(o.destinationCommitteeId || safeCommittees[0]?.id || '');
    setAmount(o.amount || 0);
    setResponsible(o.responsible || 'Tesorero General');
    setNotes(o.notes || o.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    if (editingOfferingId) {
      if (onUpdateOffering) {
        onUpdateOffering({
          id: editingOfferingId,
          date: offeringDate,
          dayOfWeek: autoDay,
          destinationCommitteeId: destinationCommitteeId || (safeCommittees[0]?.id || ''),
          amount,
          responsible,
          notes
        });
      }
    } else {
      if (onAddOffering) {
        onAddOffering({
          date: offeringDate,
          dayOfWeek: autoDay,
          destinationCommitteeId: destinationCommitteeId || (safeCommittees[0]?.id || ''),
          amount,
          responsible,
          notes
        });
      }
    }

    setEditingOfferingId(null);
    setAmount(0);
    setNotes('');
    setIsModalOpen(false);
  };

  // Sub-Pestaña Activa ('summary', 'history', 'annual')
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-6 ${isMobile ? 'p-6' : 'p-8'} rounded-3xl text-white shadow-2xl relative overflow-hidden`}
        style={{ backgroundImage: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #ea580c 100%)', boxShadow: '0 20px 40px -15px rgba(245, 158, 11, 0.35)' }}
      >
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-100 bg-white/15 px-3 py-1 rounded-full inline-block mb-2 backdrop-blur-sm">
            Recaudación en Cultos
          </span>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white mb-1 tracking-tight`}>Ofrendas Locales</h2>
          <p className="text-xs sm:text-sm text-amber-100 font-medium opacity-90">Registro y estadísticas de recolecciones en cultos y reuniones congregacionales</p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3 relative z-10 flex-wrap">
            <button
              onClick={() => {
                setEditingCommitteeId(null);
                setCommNameInput('');
                setCommTreasurerInput('');
                setIsManageCommitteesOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 backdrop-blur-sm shadow-md transition-all active:scale-95 cursor-pointer"
              title="Añadir, editar o eliminar comités"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>Gestionar Comités</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-amber-800 hover:bg-amber-50 font-black text-xs shadow-lg shadow-black/10 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-600" />
              <span>Registrar Ofrenda</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Selector de Sub-Pestañas del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Recaudación del Mes</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Registro Histórico ({safeOfferings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('annual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'annual'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Consolidado Anual</span>
        </button>
      </div>

      {/* PESTAÑA 1: RECAUDACIÓN DEL MES */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra Navegadora de Mes (Mes en Curso con Flechas Interactivas) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-md">
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 font-bold transition-all hover:scale-105 active:scale-95"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-white font-black text-sm sm:text-base shadow-md shadow-amber-500/25">
                <Calendar className="w-4 h-4" />
                <span>{viewingMonthLabel}</span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 font-bold transition-all hover:scale-105 active:scale-95"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {viewingMonth !== currentRealMonth && (
                <button
                  onClick={() => setViewingMonth(currentRealMonth)}
                  className="text-xs font-black text-amber-700 dark:text-amber-400 hover:underline px-3 py-1.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 cursor-pointer"
                >
                  Ir a Mes Actual
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Recaudado en {viewingMonthLabel}
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 tracking-tight">
                  {formatCurrency(monthlyTotal)}
                </span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold text-xs border border-amber-300 dark:border-amber-800">
                {monthlyOfferings.length} cultos
              </span>
            </div>

          </div>

          {/* Tarjetas Estadísticas por Día del Mes en Curso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { day: 'Domingo', border: 'border-t-amber-500', cardBg: 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-200/80 dark:border-amber-900/50', textCol: 'text-amber-900 dark:text-amber-200', numCol: 'text-amber-900 dark:text-white', subCol: 'text-amber-700 dark:text-amber-400' },
              { day: 'Martes', border: 'border-t-blue-500', cardBg: 'bg-blue-50/90 dark:bg-blue-950/35 border-blue-200/80 dark:border-blue-900/50', textCol: 'text-blue-900 dark:text-blue-200', numCol: 'text-blue-900 dark:text-white', subCol: 'text-blue-700 dark:text-blue-400' },
              { day: 'Jueves', border: 'border-t-purple-500', cardBg: 'bg-purple-50/90 dark:bg-purple-950/35 border-purple-200/80 dark:border-purple-900/50', textCol: 'text-purple-900 dark:text-purple-200', numCol: 'text-purple-900 dark:text-white', subCol: 'text-purple-700 dark:text-purple-400' },
              { day: 'Sábado', border: 'border-t-emerald-500', cardBg: 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-200/80 dark:border-emerald-900/50', textCol: 'text-emerald-900 dark:text-emerald-200', numCol: 'text-emerald-900 dark:text-white', subCol: 'text-emerald-700 dark:text-emerald-400' }
            ].map((item) => {
              const totalDay = monthlyDayStats.stats[item.day] || 0;
              const count = monthlyDayStats.counts[item.day] || 0;
              const avg = count > 0 ? Math.round(totalDay / count) : 0;

              return (
                <div key={item.day} className={`p-5 rounded-2xl ${item.cardBg} border-t-4 ${item.border} border-x border-b shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 hover:scale-105 transition-all`}>
                  <span className={`text-[11px] font-black ${item.textCol} block uppercase tracking-wider`}>Cultos de {item.day}</span>
                  <p className={`text-2xl font-black ${item.numCol} mt-1 tracking-tight`}>
                    {formatCurrency(totalDay)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    Promedio: <span className={`font-black ${item.subCol}`}>{formatCurrency(avg)}</span> ({count} {count === 1 ? 'culto' : 'cultos'})
                  </p>
                </div>
              );
            })}
          </div>

          {/* Gráfico Comparativo por Día de Semana - Solo Mes en Curso */}
          <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-200/70 dark:border-amber-900/40 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-2 uppercase tracking-wide">
                <BarChart2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Comparativo de Recaudación por Día de la Semana ({viewingMonthLabel})
              </h3>
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                  Total Mes: {formatCurrency(monthlyTotal)}
                </span>

                {/* Botón Descargar PNG */}
                <button
                  type="button"
                  onClick={() => downloadChartImage(monthlyChartRef, `Grafico_Ofrendas_${viewingMonth}.png`)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-amber-300 dark:border-amber-800 shadow-xs hover:bg-amber-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Descargar gráfico del mes como imagen PNG"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>PNG</span>
                </button>

                {/* Botón Imprimir / PDF */}
                <button
                  type="button"
                  onClick={() => {
                    printChartReport({
                      title: 'Reporte de Recaudación de Ofrendas por Día',
                      subtitle: `Distribución de recaudo por días de culto en ${viewingMonthLabel}`,
                      congregationName,
                      period: viewingMonthLabel,
                      chartRef: monthlyChartRef,
                      stats: [
                        { label: 'Total Recaudado en el Mes', value: formatCurrency(monthlyTotal) },
                        { label: 'Total Cultos Realizados', value: `${monthlyOfferings.length} cultos` },
                        { label: 'Cultos Domingo', value: `${formatCurrency(monthlyDayStats.stats['Domingo'] || 0)} (${monthlyDayStats.counts['Domingo'] || 0} cultos)` },
                        { label: 'Cultos Martes', value: `${formatCurrency(monthlyDayStats.stats['Martes'] || 0)} (${monthlyDayStats.counts['Martes'] || 0} cultos)` },
                        { label: 'Cultos Jueves', value: `${formatCurrency(monthlyDayStats.stats['Jueves'] || 0)} (${monthlyDayStats.counts['Jueves'] || 0} cultos)` },
                        { label: 'Cultos Sábado', value: `${formatCurrency(monthlyDayStats.stats['Sábado'] || 0)} (${monthlyDayStats.counts['Sábado'] || 0} cultos)` }
                      ]
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Imprimir reporte o guardar como PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>
            <div className="h-56">
              <Bar 
                ref={monthlyChartRef}
                data={monthlyChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        font: { weight: 'bold', size: 11 }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: REGISTRO HISTÓRICO DE OFRENDAS */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          {(() => {
            const filteredOfferings = sortedOfferings.filter(o => {
              if (!o) return false;

              // Filtro por Comité
              if (selectedCommittee !== 'ALL' && o.destinationCommitteeId !== selectedCommittee) {
                return false;
              }

              // Filtro por Mes
              if (tableMonthFilter !== 'ALL') {
                const parts = (o.date || '').split('-');
                if (parts[1] !== tableMonthFilter) return false;
              }

              // Filtro por Día
              if (selectedDay !== 'ALL') {
                const day = o.dayOfWeek || deduceDayOfWeek(o.date);
                if (day !== selectedDay) return false;
              }

              // Búsqueda de texto
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const com = safeCommittees.find(c => c.id === o.destinationCommitteeId);
                const comName = (com?.name || '').toLowerCase();
                const notesText = (o.notes || o.description || '').toLowerCase();
                const resp = (o.responsible || '').toLowerCase();
                const amt = (o.amount || '').toString();
                const dateStr = (o.date || '');
                if (!notesText.includes(q) && !resp.includes(q) && !amt.includes(q) && !dateStr.includes(q) && !comName.includes(q)) {
                  return false;
                }
              }

              return true;
            });

            // Orden cronológico estricto del 1 al 31 para filtros y reportes
            const sortedFilteredOfferings = [...filteredOfferings].sort((a, b) => compareDatesAsc(a.date, b.date));
            const filteredTotal = sortedFilteredOfferings.reduce((sum, o) => sum + (o.amount || 0), 0);
            const hasActiveFilters = tableMonthFilter !== 'ALL' || selectedCommittee !== 'ALL' || selectedDay !== 'ALL' || searchQuery.trim() !== '';

            const monthsList = [
              { code: '01', name: 'Enero' },
              { code: '02', name: 'Febrero' },
              { code: '03', name: 'Marzo' },
              { code: '04', name: 'Abril' },
              { code: '05', name: 'Mayo' },
              { code: '06', name: 'Junio' },
              { code: '07', name: 'Julio' },
              { code: '08', name: 'Agosto' },
              { code: '09', name: 'Septiembre' },
              { code: '10', name: 'Octubre' },
              { code: '11', name: 'Noviembre' },
              { code: '12', name: 'Diciembre' }
            ];

            const committeeMap = {};
            safeCommittees.forEach(c => {
              committeeMap[c.id] = c.name;
            });

            return (
              <div className="bg-amber-50/30 dark:bg-amber-950/15 rounded-3xl p-6 border border-amber-200/70 dark:border-amber-900/40 shadow-sm space-y-4">
                
                {/* Cabecera y Resumen de Filtrado */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <Filter className="w-4 h-4 text-amber-600" />
                      Registro Histórico de Ofrendas ({sortedFilteredOfferings.length} de {safeOfferings.length})
                    </h3>
                    {tableMonthFilter !== 'ALL' && (
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                        🗓️ Mes filtrado: <strong className="uppercase">{monthsList.find(m => m.code === tableMonthFilter)?.name}</strong> (Orden del día 1 al 31)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-black text-xs border border-amber-300/80 dark:border-amber-800 shadow-xs">
                      💰 Suma Total: {formatCurrency(filteredTotal)}
                    </span>
                  </div>
                </div>

                {/* BARRA DESTACADA DE EXPORTACIÓN Y COMPARTIR */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800/90 dark:to-amber-950/40 p-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      📤 Exportar / Compartir (Orden 1 al 31):
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const exportData = sortedFilteredOfferings.map(o => {
                          const com = safeCommittees.find(c => c.id === o.destinationCommitteeId);
                          return {
                            'Fecha': formatDate(o.date),
                            'Día': o.dayOfWeek || deduceDayOfWeek(o.date),
                            'Comité Destino': com ? com.name : 'General',
                            'Monto': o.amount || 0,
                            'Responsable': o.responsible || 'Tesorero',
                            'Observaciones': (o.notes || o.description || '').replace(/^\[|\]$/g, '')
                          };
                        });
                        exportToExcel(exportData, 'Historial_Ofrendas');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Descargar reporte en Excel (.csv)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const monthObj = monthsList.find(m => m.code === tableMonthFilter);
                        printFilteredOfferingsReport({
                          congregationName,
                          monthName: monthObj ? monthObj.name : 'Historial Completo',
                          offerings: sortedFilteredOfferings,
                          totalAmount: filteredTotal,
                          committeeMap
                        });
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Imprimir reporte membretado / Guardar en PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const monthObj = monthsList.find(m => m.code === tableMonthFilter);
                        shareOfferingsReportWhatsApp({
                          congregationName,
                          monthName: monthObj ? monthObj.name : 'Historial Completo',
                          offerings: sortedFilteredOfferings,
                          totalAmount: filteredTotal,
                          committeeMap
                        });
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Compartir reporte por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const monthObj = monthsList.find(m => m.code === tableMonthFilter);
                        copyOfferingsSummaryText({
                          congregationName,
                          monthName: monthObj ? monthObj.name : 'Historial Completo',
                          offerings: sortedFilteredOfferings,
                          totalAmount: filteredTotal,
                          committeeMap
                        });
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Copiar resumen en texto al portapapeles"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Texto</span>
                    </button>

                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setTableMonthFilter('ALL');
                          setSelectedCommittee('ALL');
                          setSelectedDay('ALL');
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-200 font-bold text-xs border border-rose-300 dark:border-rose-800 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Limpiar Filtros</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de Filtros Interactivos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-inner">
                  
                  {/* 1. Buscar por Texto */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar notas, responsable, valor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  {/* 2. Filtro por Mes */}
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={tableMonthFilter}
                      onChange={(e) => setTableMonthFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="ALL">📅 Todos los Meses</option>
                      {monthsList.map(m => (
                        <option key={m.code} value={m.code}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Filtro por Comité */}
                  <div className="relative">
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedCommittee}
                      onChange={(e) => setSelectedCommittee(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="ALL">🏛️ Todos los Comités</option>
                      {safeCommittees.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Filtro por Día */}
                  <div>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="ALL">📆 Todos los Días</option>
                      <option value="Domingo">Domingo</option>
                      <option value="Martes">Martes</option>
                      <option value="Jueves">Jueves</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Lunes">Lunes</option>
                      <option value="Miércoles">Miércoles</option>
                      <option value="Viernes">Viernes</option>
                    </select>
                  </div>

                </div>

                {/* Lista y Tabla de Resultados */}
                {filteredOfferings.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/50">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      No se encontraron ofrendas con los filtros aplicados.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setTableMonthFilter('ALL');
                          setSelectedCommittee('ALL');
                          setSelectedDay('ALL');
                        }}
                        className="mt-3 text-xs font-black text-amber-600 hover:underline cursor-pointer"
                      >
                        Restablecer filtros de búsqueda
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 1. VISTA MÓVIL: Tarjetas compactas con botón EDITAR y ELIMINAR siempre visible (Celulares) */}
                    <div className="block sm:hidden space-y-3">
                      {sortedFilteredOfferings.map(o => {
                        const com = safeCommittees.find(c => c.id === o.destinationCommitteeId);
                        return (
                          <div 
                            key={o.id} 
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-200/80 dark:border-amber-900/50 shadow-sm space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
                                  {o.dayOfWeek || deduceDayOfWeek(o.date)}
                                </span>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                  📅 {formatDate(o.date)}
                                </h4>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                  🏛️ {com ? com.name : 'General'}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                                  Valor Ofrendado
                                </span>
                                <span className="text-lg font-black text-amber-900 dark:text-amber-200 tracking-tight">
                                  {formatCurrency(o.amount)}
                                </span>
                              </div>
                            </div>

                            {(o.responsible || o.notes || o.description) && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                                {o.responsible && (
                                  <p className="text-slate-600 dark:text-slate-400">
                                    👤 <strong>Resp:</strong> {o.responsible}
                                  </p>
                                )}
                                {(o.notes || o.description) && (
                                  <p className="text-amber-900 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                                    💬 {(o.notes || o.description).replace(/^\[|\]$/g, '')}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Botones de Acción Móvil */}
                            <div className="flex items-center gap-2 pt-2 border-t border-amber-100 dark:border-slate-800 flex-wrap">
                              <button
                                onClick={() => shareOfferingWhatsApp(o, com?.name || 'General')}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                title="Compartir por WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>

                              <button
                                onClick={() => {
                                  printOfficialReceipt({
                                    title: 'Comprobante de Ofrenda',
                                    subtitle: `Destino: ${com?.name || 'General'}`,
                                    congregationName,
                                    date: formatDate(o.date),
                                    details: [
                                      { label: 'Fecha de Recaudación', value: formatDate(o.date) },
                                      { label: 'Día del Culto', value: o.dayOfWeek || deduceDayOfWeek(o.date) },
                                      { label: 'Comité Destino', value: com?.name || 'General' },
                                      { label: 'Responsable de Entrega', value: o.responsible || 'Tesorero' },
                                      { label: 'Concepto / Notas', value: (o.notes || o.description || 'Ofrenda Ordinaria').replace(/^\[|\]$/g, '') }
                                    ],
                                    total: formatCurrency(o.amount),
                                    signatures: [
                                      { name: o.responsible || 'Responsable', role: 'Entrega' },
                                      { name: 'Tesorero(a)', role: 'Recibe en Tesorería' }
                                    ]
                                  });
                                }}
                                className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                                title="Imprimir Recibo"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {!isReadOnly && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(o)}
                                    className="flex items-center justify-center p-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                                    title="Editar"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {onDeleteOffering && (
                                    <button
                                      onClick={() => {
                                        if(window.confirm('¿Eliminar esta ofrenda?')) {
                                          onDeleteOffering(o);
                                        }
                                      }}
                                      className="flex items-center justify-center p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 active:scale-95 transition-all cursor-pointer"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Tarjeta de Suma Total en Vista Móvil */}
                      <div className="p-4 rounded-2xl bg-amber-100/90 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 shadow-md flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                            {tableMonthFilter !== 'ALL' ? `Suma Total Mes (${monthsList.find(m => m.code === tableMonthFilter)?.name})` : 'Suma Total Ofrendas'}
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {sortedFilteredOfferings.length} {sortedFilteredOfferings.length === 1 ? 'registro' : 'registros'}
                          </span>
                        </div>
                        <span className="text-xl font-black text-amber-950 dark:text-amber-100">
                          {formatCurrency(filteredTotal)}
                        </span>
                      </div>
                    </div>

                    {/* 2. VISTA ESCRITORIO / TABLET: Tabla Completa con Botones de Edición */}
                    <div className="hidden sm:block overflow-x-auto rounded-2xl border border-amber-200/80 dark:border-amber-900/50">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                          <tr className="bg-amber-100/70 dark:bg-amber-950/60 border-b-2 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-black uppercase text-[11px] tracking-wider">
                            <th className="py-3.5 px-4">Fecha</th>
                            <th className="py-3.5 px-4">Día Deducido</th>
                            <th className="py-3.5 px-4">Comité Destino</th>
                            <th className="py-3.5 px-4 text-right">Valor</th>
                            <th className="py-3.5 px-4">Responsable</th>
                            <th className="py-3.5 px-4">Observaciones</th>
                            <th className="py-3.5 px-4 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/80 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {sortedFilteredOfferings.map(o => {
                            const com = safeCommittees.find(c => c.id === o.destinationCommitteeId);
                            return (
                              <tr key={o.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{formatDate(o.date)}</td>
                                <td className="py-3.5 px-4 font-black text-amber-700 dark:text-amber-400">{o.dayOfWeek || deduceDayOfWeek(o.date)}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{com ? com.name : 'General'}</td>
                                <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white text-sm">{formatCurrency(o.amount)}</td>
                                <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">{o.responsible || 'Tesorero'}</td>
                                <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                  {(o.notes || o.description) ? (
                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-black">
                                      {(o.notes || o.description).replace(/^\[|\]$/g, '')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => shareOfferingWhatsApp(o, com?.name || 'General')}
                                      className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 transition-all hover:scale-105 cursor-pointer"
                                      title="Compartir por WhatsApp"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        printOfficialReceipt({
                                          title: 'Comprobante de Ofrenda',
                                          subtitle: `Destino: ${com?.name || 'General'}`,
                                          congregationName,
                                          date: formatDate(o.date),
                                          details: [
                                            { label: 'Fecha de Recaudación', value: formatDate(o.date) },
                                            { label: 'Día del Culto', value: o.dayOfWeek || deduceDayOfWeek(o.date) },
                                            { label: 'Comité Destino', value: com?.name || 'General' },
                                            { label: 'Responsable de Entrega', value: o.responsible || 'Tesorero' },
                                            { label: 'Concepto / Notas', value: (o.notes || o.description || 'Ofrenda Ordinaria').replace(/^\[|\]$/g, '') }
                                          ],
                                          total: formatCurrency(o.amount),
                                          signatures: [
                                            { name: o.responsible || 'Responsable', role: 'Entrega' },
                                            { name: 'Tesorero(a)', role: 'Recibe en Tesorería' }
                                          ]
                                        });
                                      }}
                                      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 cursor-pointer"
                                      title="Imprimir Recibo"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    {!isReadOnly && (
                                      <>
                                        <button
                                          onClick={() => handleOpenEdit(o)}
                                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-900/60 font-bold text-xs transition-all hover:scale-105 cursor-pointer shadow-xs"
                                          title="Editar ofrenda"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span>Editar</span>
                                        </button>

                                        {onDeleteOffering && (
                                          <button
                                            onClick={() => {
                                              if(window.confirm('¿Eliminar esta ofrenda?')) {
                                                onDeleteOffering(o);
                                              }
                                            }}
                                            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200/60 dark:border-rose-900/60 transition-all hover:scale-105 cursor-pointer"
                                            title="Eliminar registro"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-amber-100/90 dark:bg-amber-950/80 border-t-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 font-black text-xs">
                            <td className="py-3.5 px-4 uppercase tracking-wider font-black">
                              TOTAL ({filteredOfferings.length} {filteredOfferings.length === 1 ? 'OFRENDA' : 'OFRENDAS'})
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-400 text-center">-</td>
                            <td className="py-3.5 px-4 font-bold text-amber-900 dark:text-amber-300">
                              {tableMonthFilter !== 'ALL' ? `Suma Total Ofrendas (${monthsList.find(m => m.code === tableMonthFilter)?.name})` : 'Suma Total Recaudada'}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-amber-950 dark:text-amber-100 text-base">
                              {formatCurrency(filteredTotal)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-400 text-center">-</td>
                            <td className="py-3.5 px-4 font-bold text-slate-400 text-center">-</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-400 text-center">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* PESTAÑA 3: CONSOLIDADO ANUAL */}
      {activeTab === 'annual' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-amber-100/30 dark:from-slate-900 dark:via-slate-900/80 dark:to-amber-950/20 rounded-3xl p-6 sm:p-8 border border-amber-300/80 dark:border-amber-900/60 shadow-xl space-y-6">
            
            {/* Encabezado del Consolidado Anual */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-200 dark:border-amber-900/60">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-black text-amber-950 dark:text-amber-200 uppercase tracking-tight">
                    Consolidado Anual de Recaudación (Totales Acumulados)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Totales consolidados y estadísticas acumuladas por día de culto para todo el año
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Año:</span>
                <select
                  value={selectedAnnualYear}
                  onChange={(e) => setSelectedAnnualYear(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-amber-950 dark:text-amber-200 font-black text-xs shadow-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                  <option value="ALL">Histórico Total (Todos los Años)</option>
                </select>
              </div>
            </div>

            {/* Tarjetas de Totales Acumulados por Día */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { day: 'Domingo', border: 'border-t-amber-500', cardBg: 'bg-white dark:bg-slate-800/80 border-amber-200/80 dark:border-amber-900/50', textCol: 'text-amber-900 dark:text-amber-200', numCol: 'text-amber-950 dark:text-white', subCol: 'text-amber-700 dark:text-amber-400' },
                { day: 'Martes', border: 'border-t-blue-500', cardBg: 'bg-white dark:bg-slate-800/80 border-blue-200/80 dark:border-blue-900/50', textCol: 'text-blue-900 dark:text-blue-200', numCol: 'text-blue-950 dark:text-white', subCol: 'text-blue-700 dark:text-blue-400' },
                { day: 'Jueves', border: 'border-t-purple-500', cardBg: 'bg-white dark:bg-slate-800/80 border-purple-200/80 dark:border-purple-900/50', textCol: 'text-purple-900 dark:text-purple-200', numCol: 'text-purple-950 dark:text-white', subCol: 'text-purple-700 dark:text-purple-400' },
                { day: 'Sábado', border: 'border-t-emerald-500', cardBg: 'bg-white dark:bg-slate-800/80 border-emerald-200/80 dark:border-emerald-900/50', textCol: 'text-emerald-900 dark:text-emerald-200', numCol: 'text-emerald-950 dark:text-white', subCol: 'text-emerald-700 dark:text-emerald-400' }
              ].map((item) => {
                const totalDay = annualDayStats.stats[item.day] || 0;
                const count = annualDayStats.counts[item.day] || 0;
                const avg = count > 0 ? Math.round(totalDay / count) : 0;

                return (
                  <div key={item.day} className={`p-5 rounded-2xl ${item.cardBg} border-t-4 ${item.border} border-x border-b shadow-md hover:scale-105 transition-all`}>
                    <span className={`text-[11px] font-black ${item.textCol} block uppercase tracking-wider`}>
                      Total {item.day} ({selectedAnnualYear === 'ALL' ? 'Histórico' : selectedAnnualYear})
                    </span>
                    <p className={`text-2xl font-black ${item.numCol} mt-1 tracking-tight`}>
                      {formatCurrency(totalDay)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                      Promedio Anual: <span className={`font-black ${item.subCol}`}>{formatCurrency(avg)}</span> ({count} cultos)
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Gráfico de Totales Acumulados Anuales */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-amber-200/80 dark:border-amber-900/50 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-2 uppercase tracking-wide">
                  <BarChart2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  Comparativo de Recaudación Total por Día de la Semana ({selectedAnnualYear === 'ALL' ? 'Histórico' : `Año ${selectedAnnualYear}`})
                </h4>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white bg-amber-600 dark:bg-amber-700 px-3.5 py-1 rounded-full shadow-sm">
                    Total Acumulado: {formatCurrency(annualTotal)}
                  </span>

                  {/* Botón Descargar PNG */}
                  <button
                    type="button"
                    onClick={() => downloadChartImage(annualChartRef, `Grafico_Ofrendas_Consolidado_${selectedAnnualYear}.png`)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-600 shadow-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer"
                    title="Descargar gráfico consolidado como imagen PNG"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>PNG</span>
                  </button>

                  {/* Botón Imprimir / PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      printChartReport({
                        title: 'Consolidado de Recaudación de Ofrendas',
                        subtitle: `Totales y promedios consolidados por día de culto`,
                        congregationName,
                        period: selectedAnnualYear === 'ALL' ? 'Histórico Total' : `Año ${selectedAnnualYear}`,
                        chartRef: annualChartRef,
                        stats: [
                          { label: 'Total Acumulado', value: formatCurrency(annualTotal) },
                          { label: 'Total Cultos en el Período', value: `${annualOfferings.length} cultos` },
                          { label: 'Total Domingo', value: `${formatCurrency(annualDayStats.stats['Domingo'] || 0)} (${annualDayStats.counts['Domingo'] || 0} cultos)` },
                          { label: 'Total Martes', value: `${formatCurrency(annualDayStats.stats['Martes'] || 0)} (${annualDayStats.counts['Martes'] || 0} cultos)` },
                          { label: 'Total Jueves', value: `${formatCurrency(annualDayStats.stats['Jueves'] || 0)} (${annualDayStats.counts['Jueves'] || 0} cultos)` },
                          { label: 'Total Sábado', value: `${formatCurrency(annualDayStats.stats['Sábado'] || 0)} (${annualDayStats.counts['Sábado'] || 0} cultos)` }
                        ]
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    title="Imprimir reporte anual o guardar como PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir / PDF</span>
                  </button>
                </div>
              </div>
              <div className="h-60">
                <Bar 
                  ref={annualChartRef}
                  data={annualChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          font: { weight: 'bold', size: 11 }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR / EDITAR OFRENDA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HandHeart className="w-5 h-5 text-amber-500" />
                <span>{editingOfferingId ? '✏️ Editar Ofrenda' : 'Agregar Ofrenda Local'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha del Culto *</label>
                <input
                  type="date"
                  value={offeringDate}
                  onChange={(e) => setOfferingDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-bold">
                  🗓️ Día deducido automáticamente: {autoDay}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Comité / Destino *</label>
                  {!isReadOnly && userRole !== 'COMITE' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommitteeId(null);
                        setCommNameInput('');
                        setCommTreasurerInput('');
                        setIsManageCommitteesOpen(true);
                      }}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>+ Gestionar comités</span>
                    </button>
                  )}
                </div>
                <select
                  value={destinationCommitteeId}
                  onChange={(e) => setDestinationCommitteeId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {safeCommittees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <MoneyInput
                label="Valor Ofrendado"
                value={amount}
                onChange={setAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Responsable</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  required
                  placeholder="Nombre del tesorero o líder"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Observaciones / Motivo</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales del culto"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  {editingOfferingId ? '💾 Guardar Cambios' : 'Guardar Ofrenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GESTIÓN DE COMITÉS */}
      {isManageCommitteesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  Gestionar Comités
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Añade, renombra o elimina comités de la congregación
                </p>
              </div>
              <button
                onClick={() => {
                  setIsManageCommitteesOpen(false);
                  setEditingCommitteeId(null);
                  setCommNameInput('');
                  setCommTreasurerInput('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario Añadir / Renombrar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commNameInput.trim()) return;

                if (editingCommitteeId) {
                  if (onUpdateCommittee) {
                    onUpdateCommittee(editingCommitteeId, {
                      name: commNameInput.trim(),
                      treasurer: commTreasurerInput.trim()
                    });
                  }
                } else {
                  if (onCreateCommittee) {
                    onCreateCommittee({
                      name: commNameInput.trim(),
                      treasurer: commTreasurerInput.trim()
                    });
                  }
                }

                setEditingCommitteeId(null);
                setCommNameInput('');
                setCommTreasurerInput('');
              }}
              className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-3"
            >
              <h4 className="text-xs font-black uppercase text-amber-950 dark:text-amber-200">
                {editingCommitteeId ? '✏️ Renombrar / Editar Comité' : '➕ Añadir Nuevo Comité'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre del Comité *"
                  value={commNameInput}
                  onChange={(e) => setCommNameInput(e.target.value)}
                  required
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Tesorero / Responsable"
                  value={commTreasurerInput}
                  onChange={(e) => setCommTreasurerInput(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                {editingCommitteeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommitteeId(null);
                      setCommNameInput('');
                      setCommTreasurerInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {editingCommitteeId ? 'Guardar Cambios' : '+ Agregar Comité'}
                </button>
              </div>
            </form>

            {/* Lista de Comités Existentes */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Comités Actuales ({safeCommittees.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {safeCommittees.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</span>
                      {c.treasurer && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Tesorero: {c.treasurer}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingCommitteeId(c.id);
                          setCommNameInput(c.name);
                          setCommTreasurerInput(c.treasurer || '');
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/60"
                        title="Editar nombre"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteCommittee && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar el comité "${c.name}"?`)) {
                              onDeleteCommittee(c.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60"
                          title="Eliminar comité"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsManageCommitteesOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
