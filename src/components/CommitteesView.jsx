import React, { useState, useEffect } from 'react';
import { Plus, ArrowRightLeft, Ban, CheckCircle, ShieldAlert, Pencil, Trash2, ArrowLeft, Search, Filter, X, Calendar, Layers, Palette, Check, Share2, Printer, FileSpreadsheet, Copy } from 'lucide-react';
import { formatCurrency, formatDate, compareDatesAsc } from '../utils/formatters';
import { exportToExcel, printFilteredCommitteeReport, shareCommitteeReportWhatsApp, copyCommitteeSummaryText } from '../utils/exportHelpers';
import MoneyInput from './MoneyInput';

// Paleta cromática disponible para los comités
export const COMMITTEE_COLOR_THEMES = {
  emerald: {
    id: 'emerald',
    name: 'Verde Esmeralda',
    dot: 'bg-emerald-500',
    bg: 'from-emerald-600 to-teal-600',
    border: 'border-t-emerald-500',
    cardBg: 'bg-emerald-50/90 dark:bg-emerald-950/35 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60',
    shadow: 'shadow-emerald-500/20',
    badge: 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-800',
    btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25',
    detailHeader: 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60'
  },
  blue: {
    id: 'blue',
    name: 'Azul Rey',
    dot: 'bg-blue-500',
    bg: 'from-blue-600 to-indigo-600',
    border: 'border-t-blue-500',
    cardBg: 'bg-blue-50/90 dark:bg-blue-950/35 hover:bg-blue-100/70 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-900/60',
    shadow: 'shadow-blue-500/20',
    badge: 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-800',
    btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25',
    detailHeader: 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60'
  },
  purple: {
    id: 'purple',
    name: 'Púrpura / Morado',
    dot: 'bg-purple-500',
    bg: 'from-purple-600 to-pink-600',
    border: 'border-t-purple-500',
    cardBg: 'bg-purple-50/90 dark:bg-purple-950/35 hover:bg-purple-100/70 dark:hover:bg-purple-950/50 border-purple-200 dark:border-purple-900/60',
    shadow: 'shadow-purple-500/20',
    badge: 'text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 border-purple-300 dark:border-purple-800',
    btnGradient: 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25',
    detailHeader: 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60'
  },
  amber: {
    id: 'amber',
    name: 'Ámbar / Dorado',
    dot: 'bg-amber-500',
    bg: 'from-amber-500 to-orange-600',
    border: 'border-t-amber-500',
    cardBg: 'bg-amber-50/90 dark:bg-amber-950/35 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-900/60',
    shadow: 'shadow-amber-500/20',
    badge: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-800',
    btnGradient: 'from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-500/25',
    detailHeader: 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60'
  },
  rose: {
    id: 'rose',
    name: 'Rosa / Carmesí',
    dot: 'bg-rose-500',
    bg: 'from-rose-600 to-red-600',
    border: 'border-t-rose-500',
    cardBg: 'bg-rose-50/90 dark:bg-rose-950/35 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900/60',
    shadow: 'shadow-rose-500/20',
    badge: 'text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 border-rose-300 dark:border-rose-800',
    btnGradient: 'from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/25',
    detailHeader: 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60'
  },
  cyan: {
    id: 'cyan',
    name: 'Cian / Celeste',
    dot: 'bg-cyan-500',
    bg: 'from-cyan-600 to-blue-600',
    border: 'border-t-cyan-500',
    cardBg: 'bg-cyan-50/90 dark:bg-cyan-950/35 hover:bg-cyan-100/70 dark:hover:bg-cyan-950/50 border-cyan-200 dark:border-cyan-900/60',
    shadow: 'shadow-cyan-500/20',
    badge: 'text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/60 border-cyan-300 dark:border-cyan-800',
    btnGradient: 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/25',
    detailHeader: 'bg-cyan-50/60 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-900/60'
  },
  violet: {
    id: 'violet',
    name: 'Violeta / Índigo',
    dot: 'bg-violet-500',
    bg: 'from-violet-600 to-purple-600',
    border: 'border-t-violet-500',
    cardBg: 'bg-violet-50/90 dark:bg-violet-950/35 hover:bg-violet-100/70 dark:hover:bg-violet-950/50 border-violet-200 dark:border-violet-900/60',
    shadow: 'shadow-violet-500/20',
    badge: 'text-violet-800 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/60 border-violet-300 dark:border-violet-800',
    btnGradient: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-500/25',
    detailHeader: 'bg-violet-50/60 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-900/60'
  },
  teal: {
    id: 'teal',
    name: 'Teal / Azul Marino',
    dot: 'bg-teal-500',
    bg: 'from-teal-600 to-emerald-600',
    border: 'border-t-teal-500',
    cardBg: 'bg-teal-50/90 dark:bg-teal-950/35 hover:bg-teal-100/70 dark:hover:bg-teal-950/50 border-teal-200 dark:border-teal-900/60',
    shadow: 'shadow-teal-500/20',
    badge: 'text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 border-teal-300 dark:border-teal-800',
    btnGradient: 'from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/25',
    detailHeader: 'bg-teal-50/60 dark:bg-teal-950/40 border-teal-200/80 dark:border-teal-900/60'
  }
};

const THEME_KEYS = Object.keys(COMMITTEE_COLOR_THEMES);

export default function CommitteesView({
  committees = [],
  movements = [],
  userRole = 'ADMIN',
  congregationName = 'Gestión Local',
  isMobile = false,
  onCreateCommittee,
  onUpdateCommittee,
  onDeleteCommittee,
  onAddMovement,
  onUpdateMovement,
  onAnnulMovement
}) {
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'detail'
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);

  // Mapa de colores personalizados por comité guardados en localStorage
  const [committeeColors, setCommitteeColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deborita_committee_colors') || '{}');
    } catch {
      return {};
    }
  });

  // Modal Gestión / Edición de Comités
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState(null); // null = creando, objeto = editando

  // Form Comité (Crear / Editar)
  const [formName, setFormName] = useState('');
  const [formTreasurer, setFormTreasurer] = useState('');
  const [formColor, setFormColor] = useState('emerald');

  // Modal Movimiento (Crear / Editar)
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [editingMovementId, setEditingMovementId] = useState(null);
  const [annulModalState, setAnnulModalState] = useState({ isOpen: false, movementId: null, reason: '' });

  // Filtros para la tabla de transacciones de comités
  const [movSearchQuery, setMovSearchQuery] = useState('');
  const [movSelectedMonth, setMovSelectedMonth] = useState('ALL');
  const [movSelectedType, setMovSelectedType] = useState('ALL');
  const [movSelectedStatus, setMovSelectedStatus] = useState('ALL');

  // Formulario Movimiento
  const [movementType, setMovementType] = useState('INGRESO');
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementDescription, setMovementDescription] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));

  const isReadOnly = userRole === 'VISITA';
  const activeCommittee = committees.find(c => c.id === selectedCommitteeId);
  const committeeMovements = selectedCommitteeId ? movements.filter(m => m.committeeId === selectedCommitteeId) : [];

  // Obtener tema visual para un comité
  const getCommitteeTheme = (committee, index) => {
    const savedColorKey = committeeColors[committee.id] || committee.color;
    if (savedColorKey && COMMITTEE_COLOR_THEMES[savedColorKey]) {
      return COMMITTEE_COLOR_THEMES[savedColorKey];
    }
    const fallbackKey = THEME_KEYS[index % THEME_KEYS.length];
    return COMMITTEE_COLOR_THEMES[fallbackKey];
  };

  // Abrir modal para crear nuevo comité
  const handleOpenCreateCommittee = () => {
    setEditingCommittee(null);
    setFormName('');
    setFormTreasurer('');
    setFormColor('emerald');
    setIsManageModalOpen(true);
  };

  // Abrir modal para editar comité existente
  const handleOpenEditCommittee = (comm, e) => {
    if (e) e.stopPropagation();
    setEditingCommittee(comm);
    setFormName(comm.name || '');
    setFormTreasurer(comm.treasurer || '');
    const currentTheme = committeeColors[comm.id] || comm.color || 'emerald';
    setFormColor(currentTheme);
    setIsManageModalOpen(true);
  };

  // Guardar comité (Crear o Editar)
  const handleSaveCommittee = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCommittee) {
      // Guardar color en mapa local
      const updatedColors = { ...committeeColors, [editingCommittee.id]: formColor };
      setCommitteeColors(updatedColors);
      localStorage.setItem('deborita_committee_colors', JSON.stringify(updatedColors));

      if (onUpdateCommittee) {
        onUpdateCommittee(editingCommittee.id, {
          name: formName.trim(),
          treasurer: formTreasurer.trim(),
          color: formColor
        });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const updatedColors = { ...committeeColors, [tempId]: formColor };
      setCommitteeColors(updatedColors);
      localStorage.setItem('deborita_committee_colors', JSON.stringify(updatedColors));

      if (onCreateCommittee) {
        onCreateCommittee({
          name: formName.trim(),
          treasurer: formTreasurer.trim(),
          color: formColor
        });
      }
    }

    setIsManageModalOpen(false);
  };

  // Eliminar comité
  const handleDeleteCommitteeAction = (comm, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar el comité "${comm.name}"? Esta acción es irreversible.`)) {
      if (onDeleteCommittee) {
        onDeleteCommittee(comm.id);
      }
      if (selectedCommitteeId === comm.id) {
        setViewMode('list');
        setSelectedCommitteeId(null);
      }
    }
  };

  const handleSelectCommittee = (committeeId) => {
    setSelectedCommitteeId(committeeId);
    setViewMode('detail');
    setMovSearchQuery('');
    setMovSelectedMonth('ALL');
    setMovSelectedType('ALL');
    setMovSelectedStatus('ALL');
  };

  // Movimientos
  const handleOpenCreateMovement = () => {
    setEditingMovementId(null);
    setMovementType('INGRESO');
    setMovementAmount(0);
    setMovementDescription('');
    setMovementDate(new Date().toISOString().slice(0, 10));
    setIsNewMovementOpen(true);
  };

  const handleOpenEditMovement = (mov) => {
    setEditingMovementId(mov.id);
    setMovementType(mov.type || 'INGRESO');
    setMovementAmount(mov.amount || 0);
    setMovementDescription(mov.description || '');
    setMovementDate(mov.date || new Date().toISOString().slice(0, 10));
    setIsNewMovementOpen(true);
  };

  const handleSubmitMovement = (e) => {
    e.preventDefault();
    if (!movementAmount || movementAmount <= 0) return;

    if (editingMovementId) {
      if (onUpdateMovement) {
        onUpdateMovement({
          id: editingMovementId,
          committeeId: selectedCommitteeId,
          type: movementType,
          amount: movementAmount,
          description: movementDescription,
          date: movementDate
        });
      }
    } else {
      if (onAddMovement) {
        onAddMovement({
          committeeId: selectedCommitteeId,
          type: movementType,
          amount: movementAmount,
          description: movementDescription,
          date: movementDate
        });
      }
    }

    setEditingMovementId(null);
    setMovementAmount(0);
    setMovementDescription('');
    setIsNewMovementOpen(false);
  };

  const handleConfirmAnnul = () => {
    if (!annulModalState.reason) return;
    if (onAnnulMovement) {
      onAnnulMovement(annulModalState.movementId, annulModalState.reason);
    }
    setAnnulModalState({ isOpen: false, movementId: null, reason: '' });
  };

  const sortedCommittees = [...committees].sort((a, b) => (b.balance || 0) - (a.balance || 0));
  const activeIndex = sortedCommittees.findIndex(c => c.id === selectedCommitteeId);
  const activeTheme = activeCommittee ? getCommitteeTheme(activeCommittee, activeIndex >= 0 ? activeIndex : 0) : COMMITTEE_COLOR_THEMES.blue;

  return (
    <div className="space-y-6">

      {/* VISTA 1: LISTADO DE COMITÉS */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div 
            className={`flex flex-wrap items-center justify-between gap-6 ${isMobile ? 'p-6' : 'p-8'} rounded-3xl text-white shadow-2xl relative overflow-hidden`}
            style={{ backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)', boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.35)' }}
          >
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 bg-white/15 px-3 py-1 rounded-full inline-block mb-2 backdrop-blur-sm">
                Fondos Internos
              </span>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white mb-1 tracking-tight`}>Comités</h2>
              <p className="text-xs sm:text-sm text-blue-100 font-medium opacity-90">Gestión de tesorerías, balances en vivo, asignación de responsables y personalización</p>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2.5 relative z-10 flex-wrap">
                <button
                  onClick={handleOpenCreateCommittee}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs shadow-lg shadow-black/10 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Crear Comité</span>
                </button>
              </div>
            )}
          </div>

          {/* Grid de Tarjetas de Comités */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCommittees.map((c, index) => {
              const commBalance = c.balance || 0;
              const themeStyle = getCommitteeTheme(c, index);

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCommittee(c.id)}
                  className={`p-6 rounded-3xl ${themeStyle.cardBg} border-t-4 ${themeStyle.border} border-x border-b shadow-lg hover:shadow-xl ${themeStyle.shadow} transition-all cursor-pointer flex flex-col gap-5 group relative overflow-hidden hover:scale-[1.02] active:scale-[0.99]`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${themeStyle.bg} text-white flex items-center justify-center shadow-md ${themeStyle.shadow} group-hover:scale-110 transition-transform font-black text-xl`}>
                       <span>{c.name.charAt(0)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isReadOnly && (
                        <button
                          onClick={(e) => handleOpenEditCommittee(c, e)}
                          className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:scale-110 shadow-sm transition-all"
                          title="Editar nombre, tesorero y color del comité"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                      <span className={`text-[10px] font-bold ${themeStyle.badge} px-2.5 py-1 rounded-full border`}>
                        Detalles →
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight mb-2 flex items-center gap-2">
                      <span>{c.name}</span>
                    </h3>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      Saldo Disponible
                    </span>
                    <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      commBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {formatCurrency(commBalance)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center mt-auto relative z-10">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-[190px]">
                      Tesorero: <span className="text-slate-900 dark:text-slate-200 font-bold">{c.treasurer || 'Sin asignar'}</span>
                    </p>
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors font-bold text-xs">
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: DETALLE DEL COMITÉ SELECCIONADO */}
      {viewMode === 'detail' && activeCommittee && (() => {
        const activeBalance = activeCommittee.balance || 0;

        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 space-y-8" id="committee-detail-panel">
            
            <button
              onClick={() => setViewMode('list')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors flex items-center gap-2 mb-2"
            >
              ← Volver al listado de comités
            </button>

            {/* Header del Comité Seleccionado con Botones de Edición y Eliminación */}
            <div className={`flex flex-wrap items-center justify-between gap-6 p-6 rounded-3xl ${activeTheme.detailHeader} border shadow-sm`}>
              <div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${activeTheme.bg} text-white flex items-center justify-center font-black text-lg shadow-md`}>
                    {activeCommittee.name.charAt(0)}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeCommittee.name}
                  </h2>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={(e) => handleOpenEditCommittee(activeCommittee, e)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all shadow-sm"
                        title="Editar nombre, tesorero y color del comité"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {onDeleteCommittee && (
                        <button
                          onClick={(e) => handleDeleteCommitteeAction(activeCommittee, e)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:scale-105 transition-all shadow-sm"
                          title="Eliminar comité"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2">
                  Tesorero a cargo: <span className="font-extrabold text-slate-900 dark:text-slate-200">{activeCommittee.treasurer || 'Sin asignar'}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block uppercase tracking-wider mb-1">Saldo Actual Disponible</span>
                  <p className={`text-3xl sm:text-4xl font-black tracking-tight ${activeBalance < 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(activeBalance)}
                  </p>
                  {activeBalance < 0 && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full inline-block mt-1">
                      ⚠️ Saldo Negativo Permitido
                    </span>
                  )}
                </div>

                {!isReadOnly && (
                  <button
                    onClick={handleOpenCreateMovement}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r ${activeTheme.btnGradient} font-black text-xs shadow-lg transition-all active:scale-95`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Nuevo Movimiento</span>
                  </button>
                )}
              </div>
            </div>

            {/* Historial de Transacciones del Comité con Filtros */}
            {(() => {
              const filteredMovements = committeeMovements.filter((mov) => {
                if (!mov) return false;

                if (movSelectedMonth !== 'ALL') {
                  const parts = (mov.date || '').split('-');
                  if (parts[1] !== movSelectedMonth) return false;
                }

                if (movSelectedType !== 'ALL' && mov.type !== movSelectedType) {
                  return false;
                }

                if (movSelectedStatus === 'ACTIVE' && mov.annulled) return false;
                if (movSelectedStatus === 'ANNULLED' && !mov.annulled) return false;

                if (movSearchQuery.trim()) {
                  const q = movSearchQuery.toLowerCase().trim();
                  const desc = (mov.description || '').toLowerCase();
                  const amt = (mov.amount || '').toString();
                  const dt = (mov.date || '');
                  const reason = (mov.annulReason || '').toLowerCase();
                  if (!desc.includes(q) && !amt.includes(q) && !dt.includes(q) && !reason.includes(q)) {
                    return false;
                  }
                }

                return true;
              });

              const filteredIngresos = filteredMovements.filter(m => !m.annulled && m.type === 'INGRESO').reduce((sum, m) => sum + (m.amount || 0), 0);
              const filteredEgresos = filteredMovements.filter(m => !m.annulled && m.type === 'EGRESO').reduce((sum, m) => sum + (m.amount || 0), 0);
              const filteredNeto = filteredIngresos - filteredEgresos;
              const hasActiveMovFilters = movSearchQuery.trim() !== '' || movSelectedMonth !== 'ALL' || movSelectedType !== 'ALL' || movSelectedStatus !== 'ALL';

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

              // Ordenar movimientos por fecha del día 1 al 31 (Ascendente estricto)
              const sortedMovements = [...filteredMovements].sort((a, b) => {
                const cmp = compareDatesAsc(a.date, b.date);
                if (cmp !== 0) return cmp;
                return (a.createdAt || 0) - (b.createdAt || 0);
              });

              return (
                <div className="space-y-4">
                  
                  {/* Encabezado y Métricas del Filtro */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Historial de Transacciones ({sortedMovements.length} de {committeeMovements.length})
                      </h3>
                      {movSelectedMonth !== 'ALL' && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                          🗓️ Período filtrado: <strong className="uppercase">{monthsList.find(m => m.code === movSelectedMonth)?.name}</strong> (Orden del 1 al 31)
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 font-black text-xs border border-emerald-300 dark:border-emerald-800 shadow-xs">
                        💰 Suma Aportes / Ingresos: +{formatCurrency(filteredIngresos)}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800">
                        Egresos: -{formatCurrency(filteredEgresos)}
                      </span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-950 dark:text-blue-200 font-black text-xs border border-blue-300 dark:border-blue-800 shadow-xs">
                        Neto: {formatCurrency(filteredNeto)}
                      </span>

                      {/* Botones de Exportación: Excel, PDF, WhatsApp y Copiar Texto */}
                      <button
                        type="button"
                        onClick={() => {
                          const exportData = sortedMovements.map(m => ({
                            'Fecha': formatDate(m.date),
                            'Tipo': m.type,
                            'Descripción': m.description || '',
                            'Monto': m.type === 'INGRESO' ? m.amount : -m.amount,
                            'Estado': m.annulled ? `Anulado (${m.annulReason || ''})` : 'Activo'
                          }));
                          exportToExcel(exportData, `Reporte_${activeCommittee.name.replace(/\s+/g, '_')}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Descargar reporte en Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Excel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const monthObj = monthsList.find(m => m.code === movSelectedMonth);
                          printFilteredCommitteeReport({
                            congregationName,
                            committeeName: activeCommittee.name,
                            treasurerName: activeCommittee.treasurer || 'Tesorero(a)',
                            monthName: monthObj ? monthObj.name : 'Período Completo',
                            movements: sortedMovements,
                            totals: { income: filteredIngresos, expense: filteredEgresos, net: filteredNeto }
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                        title="Imprimir reporte / PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const monthObj = monthsList.find(m => m.code === movSelectedMonth);
                          shareCommitteeReportWhatsApp({
                            congregationName,
                            committeeName: activeCommittee.name,
                            treasurerName: activeCommittee.treasurer || 'Tesorero(a)',
                            monthName: monthObj ? monthObj.name : 'Período Completo',
                            movements: sortedMovements,
                            totals: { income: filteredIngresos, expense: filteredEgresos, net: filteredNeto }
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Compartir reporte por WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const monthObj = monthsList.find(m => m.code === movSelectedMonth);
                          copyCommitteeSummaryText({
                            congregationName,
                            committeeName: activeCommittee.name,
                            treasurerName: activeCommittee.treasurer || 'Tesorero(a)',
                            monthName: monthObj ? monthObj.name : 'Período Completo',
                            movements: sortedMovements,
                            totals: { income: filteredIngresos, expense: filteredEgresos, net: filteredNeto }
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Copiar o compartir resumen en texto al portapapeles"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Texto</span>
                      </button>

                      {hasActiveMovFilters && (
                        <button
                          onClick={() => {
                            setMovSearchQuery('');
                            setMovSelectedMonth('ALL');
                            setMovSelectedType('ALL');
                            setMovSelectedStatus('ALL');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Limpiar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de Filtros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar concepto o valor..."
                        value={movSearchQuery}
                        onChange={(e) => setMovSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={movSelectedMonth}
                        onChange={(e) => setMovSelectedMonth(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="ALL">📅 Todos los Meses</option>
                        {monthsList.map(m => (
                          <option key={m.code} value={m.code}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={movSelectedType}
                        onChange={(e) => setMovSelectedType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="ALL">⚖️ Todos los Tipos</option>
                        <option value="INGRESO">🟢 Solo Ingresos (+)</option>
                        <option value="EGRESO">🔴 Solo Egresos (-)</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={movSelectedStatus}
                        onChange={(e) => setMovSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="ALL">🛡️ Todos los Estados</option>
                        <option value="ACTIVE">✅ Solo Activos</option>
                        <option value="ANNULLED">🚫 Solo Anulados</option>
                      </select>
                    </div>

                  </div>

                  {/* Tabla de Movimientos */}
                  {filteredMovements.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      No se encontraron movimientos con los filtros aplicados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-3">Fecha</th>
                            <th className="py-3 px-3">Tipo</th>
                            <th className="py-3 px-3">Descripción</th>
                            <th className="py-3 px-3 text-right">Monto</th>
                            <th className="py-3 px-3 text-center">Estado</th>
                            {!isReadOnly && <th className="py-3 px-3 text-right">Acción</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {sortedMovements.map((mov) => (
                            <tr key={mov.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${mov.annulled ? 'opacity-60' : ''}`}>
                              <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                                {formatDate(mov.date)}
                              </td>
                              <td className="py-3.5 px-3 font-extrabold">
                                <span className={`px-3 py-1 rounded-full text-[11px] tracking-wide font-black ${
                                  mov.type === 'INGRESO'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                }`}>
                                  {mov.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                                <span className={mov.annulled ? 'line-through text-slate-400' : ''}>
                                  {mov.description || 'Sin descripción'}
                                </span>
                                {mov.annulled && (
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold italic mt-0.5">
                                    Motivo anulación: {mov.annulReason}
                                  </p>
                                )}
                              </td>
                              <td className={`py-3.5 px-3 font-black text-right text-sm tracking-tight ${
                                mov.annulled 
                                    ? 'line-through text-slate-400' 
                                    : mov.type === 'INGRESO' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                              }`}>
                                {mov.type === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.amount)}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {mov.annulled ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-full">
                                    <Ban className="w-3 h-3 text-rose-600" /> Anulado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 px-2.5 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3 text-blue-600" /> Activo
                                  </span>
                                )}
                              </td>
                              {!isReadOnly && (
                                <td className="py-3.5 px-3 text-right">
                                  {!mov.annulled && (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditMovement(mov)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 p-2 rounded-xl border border-blue-200/60 dark:border-blue-900/60 transition-all hover:scale-105"
                                        title="Editar movimiento"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => setAnnulModalState({ isOpen: true, movementId: mov.id, reason: '' })}
                                        className="text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200/60 dark:border-rose-900/60 transition-all hover:scale-105"
                                        title="Anular movimiento"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-xs">
                            <td className="py-3.5 px-3 uppercase tracking-wider font-black text-slate-800 dark:text-slate-200">
                              TOTAL ({sortedMovements.length} {sortedMovements.length === 1 ? 'REG.' : 'REGS.'})
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-400 text-center">-</td>
                            <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                              {movSelectedMonth !== 'ALL' ? `Suma Total (${monthsList.find(m => m.code === movSelectedMonth)?.name})` : 'Suma Total Período'}
                            </td>
                            <td className={`py-3.5 px-3 text-right font-black text-sm ${filteredNeto >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                              {formatCurrency(filteredNeto)}
                              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                (Ing: +{formatCurrency(filteredIngresos)} / Egr: -{formatCurrency(filteredEgresos)})
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                            {!isReadOnly && <td className="py-3.5 px-3 text-right text-slate-400">-</td>}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* MODAL 1: CREAR O EDITAR COMITÉ CON SELECTOR DE COLOR */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingCommittee ? `Editar Comité: ${editingCommittee.name}` : 'Crear Nuevo Comité'}
                </h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommittee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre del Comité *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Ej: Damas Dorcas, Alabanza, Jóvenes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tesorero(a) o Responsable a Cargo
                </label>
                <input
                  type="text"
                  value={formTreasurer}
                  onChange={(e) => setFormTreasurer(e.target.value)}
                  placeholder="Nombre de la persona encargada"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Selector Visual de Colores */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Color y Tema Visual del Comité
                </label>
                <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {THEME_KEYS.map((key) => {
                    const theme = COMMITTEE_COLOR_THEMES[key];
                    const isSelected = formColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormColor(key)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-md scale-105 ring-2 ring-blue-400'
                            : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/60'
                        }`}
                        title={theme.name}
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${theme.bg} shadow-sm flex items-center justify-center text-white`}>
                          {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  {editingCommittee ? '💾 Guardar Cambios' : 'Crear Comité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR / EDITAR MOVIMIENTO */}
      {isNewMovementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingMovementId ? '✏️ Editar Movimiento' : `Registrar Movimiento - ${activeCommittee?.name}`}
              </h3>
              <button
                onClick={() => setIsNewMovementOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('INGRESO')}
                  className={`py-2.5 rounded-xl font-bold text-xs border ${
                    movementType === 'INGRESO'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent'
                  }`}
                >
                  🟢 Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('EGRESO')}
                  className={`py-2.5 rounded-xl font-bold text-xs border ${
                    movementType === 'EGRESO'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent'
                  }`}
                >
                  🔴 Egreso (-)
                </button>
              </div>

              <MoneyInput
                label="Monto del Movimiento"
                value={movementAmount}
                onChange={setMovementAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Descripción / Concepto *</label>
                <input
                  type="text"
                  value={movementDescription}
                  onChange={(e) => setMovementDescription(e.target.value)}
                  required
                  placeholder="Ej: Aporte actividad, compra de suministros"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewMovementOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  {editingMovementId ? '💾 Guardar Cambios' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ANULAR MOVIMIENTO */}
      {annulModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Anular Movimiento Contable</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esta acción no borra el registro, pero descontará el saldo del comité y marcará el movimiento como anulado para mantener la trazabilidad.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Motivo de Anulación *</label>
              <textarea
                value={annulModalState.reason}
                onChange={(e) => setAnnulModalState({ ...annulModalState, reason: e.target.value })}
                required
                rows={3}
                placeholder="Explique la razón de la anulación..."
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAnnulModalState({ isOpen: false, movementId: null, reason: '' })}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAnnul}
                disabled={!annulModalState.reason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
