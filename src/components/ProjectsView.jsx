import React, { useState } from 'react';
import { Target, PlusCircle, HeartHandshake, CheckCircle2, TrendingUp, Pencil, Trash2, Search, Calendar, Filter, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import MoneyInput from './MoneyInput';

// Paleta de temas de color por proyecto
const PROJECT_THEMES = [
  {
    id: 'indigo',
    dot: 'bg-indigo-500',
    tabActive: 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 scale-105',
    tabInactive: 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 bg-indigo-50/20',
    cardBorder: 'border-indigo-200/80 dark:border-indigo-900/50',
    headerBadge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    btnGradient: 'from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-500/25',
    metaBg: 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-900/50',
    metaText: 'text-indigo-900 dark:text-indigo-200',
    metaNum: 'text-indigo-950 dark:text-white',
    filterBg: 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/40'
  },
  {
    id: 'rose',
    dot: 'bg-rose-500',
    tabActive: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/30 scale-105',
    tabInactive: 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 bg-rose-50/20',
    cardBorder: 'border-rose-200/80 dark:border-rose-900/50',
    headerBadge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    btnGradient: 'from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/25',
    metaBg: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50',
    metaText: 'text-rose-900 dark:text-rose-200',
    metaNum: 'text-rose-950 dark:text-white',
    filterBg: 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
  },
  {
    id: 'amber',
    dot: 'bg-amber-500',
    tabActive: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105',
    tabInactive: 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 bg-amber-50/20',
    cardBorder: 'border-amber-200/80 dark:border-amber-900/50',
    headerBadge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    btnGradient: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25',
    metaBg: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50',
    metaText: 'text-amber-900 dark:text-amber-200',
    metaNum: 'text-amber-950 dark:text-white',
    filterBg: 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
  },
  {
    id: 'teal',
    dot: 'bg-teal-500',
    tabActive: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/30 scale-105',
    tabInactive: 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 hover:border-teal-400 bg-teal-50/20',
    cardBorder: 'border-teal-200/80 dark:border-teal-900/50',
    headerBadge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    btnGradient: 'from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-500/25',
    metaBg: 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-200/80 dark:border-teal-900/50',
    metaText: 'text-teal-900 dark:text-teal-200',
    metaNum: 'text-teal-950 dark:text-white',
    filterBg: 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/40'
  },
  {
    id: 'blue',
    dot: 'bg-blue-500',
    tabActive: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105',
    tabInactive: 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:border-blue-400 bg-blue-50/20',
    cardBorder: 'border-blue-200/80 dark:border-blue-900/50',
    headerBadge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    btnGradient: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25',
    metaBg: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50',
    metaText: 'text-blue-900 dark:text-blue-200',
    metaNum: 'text-blue-950 dark:text-white',
    filterBg: 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40'
  },
  {
    id: 'violet',
    dot: 'bg-purple-500',
    tabActive: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30 scale-105',
    tabInactive: 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:border-purple-400 bg-purple-50/20',
    cardBorder: 'border-purple-200/80 dark:border-purple-900/50',
    headerBadge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    btnGradient: 'from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-purple-500/25',
    metaBg: 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-900/50',
    metaText: 'text-purple-900 dark:text-purple-200',
    metaNum: 'text-purple-950 dark:text-white',
    filterBg: 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40'
  }
];

export default function ProjectsView({
  projects = [],
  votes = [],
  userRole = 'ADMIN',
  isMobile = false,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onAddVote,
  onUpdateVote,
  onDeleteVote
}) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeVotes = Array.isArray(votes) ? votes : [];

  const [selectedProjectId, setSelectedProjectId] = useState(safeProjects[0]?.id || '');
  const activeProjectIndex = Math.max(0, safeProjects.findIndex(p => p.id === selectedProjectId));
  const activeProject = safeProjects[activeProjectIndex] || safeProjects[0];
  const currentProjectId = activeProject?.id;

  // Tema del proyecto activo
  const activeTheme = PROJECT_THEMES[activeProjectIndex % PROJECT_THEMES.length];

  // Modales
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [editingVoteId, setEditingVoteId] = useState(null);

  // Form Proyecto
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [financialGoal, setFinancialGoal] = useState(10000000);

  // Form Voto
  const [memberName, setMemberName] = useState('');
  const [voteAmount, setVoteAmount] = useState(0);
  const [voteDate, setVoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [voteNotes, setVoteNotes] = useState('');

  // Filtros en la tabla de votos
  const [voteSearchQuery, setVoteSearchQuery] = useState('');
  const [voteSelectedMonth, setVoteSelectedMonth] = useState('ALL');

  const isReadOnly = userRole === 'VISITA';

  // Votos del proyecto activo
  const activeProjectVotes = safeVotes.filter(v => v.projectId === currentProjectId);
  const totalRaised = activeProjectVotes.reduce((acc, v) => acc + (v.amount || 0), 0);
  const goal = activeProject?.financialGoal ?? activeProject?.targetAmount ?? 0;
  const progressPercent = goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 100;
  const remaining = Math.max(0, goal - totalRaised);

  // Votos filtrados en tabla
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

  const filteredVotes = activeProjectVotes.filter(v => {
    if (voteSearchQuery.trim()) {
      const q = voteSearchQuery.toLowerCase();
      const matchName = (v.memberName || v.voterName || '').toLowerCase().includes(q);
      const matchNotes = (v.notes || '').toLowerCase().includes(q);
      const matchAmount = String(v.amount || '').includes(q);
      if (!matchName && !matchNotes && !matchAmount) return false;
    }
    if (voteSelectedMonth !== 'ALL') {
      const vMonth = v.date ? v.date.slice(5, 7) : '';
      if (vMonth !== voteSelectedMonth) return false;
    }
    return true;
  });

  const totalFilteredVotes = filteredVotes.reduce((acc, v) => acc + (v.amount || 0), 0);

  // Handlers Proyecto
  const handleOpenCreateProject = () => {
    setEditingProjectId(null);
    setProjectName('');
    setProjectDescription('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setHasEndDate(false);
    setEndDate('');
    setFinancialGoal(10000000);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setEditingProjectId(proj.id);
    setProjectName(proj.name || '');
    setProjectDescription(proj.description || '');
    setStartDate(proj.startDate || new Date().toISOString().slice(0, 10));
    setHasEndDate(!!proj.endDate);
    setEndDate(proj.endDate || '');
    setFinancialGoal(proj.financialGoal ?? proj.targetAmount ?? 0);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const finalEndDate = hasEndDate && endDate ? endDate : null;

    if (editingProjectId) {
      if (onUpdateProject) {
        onUpdateProject(editingProjectId, {
          name: projectName.trim(),
          description: projectDescription.trim(),
          startDate,
          endDate: finalEndDate,
          financialGoal: Number(financialGoal) || 0,
          targetAmount: Number(financialGoal) || 0
        });
      }
    } else {
      if (onCreateProject) {
        onCreateProject({
          name: projectName.trim(),
          description: projectDescription.trim(),
          startDate,
          endDate: finalEndDate,
          financialGoal: Number(financialGoal) || 0,
          targetAmount: Number(financialGoal) || 0
        });
      }
    }
    setIsProjectModalOpen(false);
  };

  // Handlers Voto
  const handleOpenCreateVote = () => {
    setEditingVoteId(null);
    setMemberName('');
    setVoteAmount(0);
    setVoteDate(new Date().toISOString().slice(0, 10));
    setVoteNotes('');
    setIsVoteModalOpen(true);
  };

  const handleOpenEditVote = (v) => {
    setEditingVoteId(v.id);
    setMemberName(v.memberName || v.voterName || '');
    setVoteAmount(v.amount || 0);
    setVoteDate(v.date || new Date().toISOString().slice(0, 10));
    setVoteNotes(v.notes || '');
    setIsVoteModalOpen(true);
  };

  const handleSaveVote = (e) => {
    e.preventDefault();
    if (!voteAmount || voteAmount <= 0) return;

    const targetProjId = currentProjectId || safeProjects[0]?.id;
    if (!targetProjId) return;

    if (editingVoteId) {
      if (onUpdateVote) {
        onUpdateVote({
          id: editingVoteId,
          projectId: targetProjId,
          memberName: memberName.trim() || 'Anónimo',
          voterName: memberName.trim() || 'Anónimo',
          amount: Number(voteAmount),
          date: voteDate,
          notes: voteNotes.trim()
        });
      }
    } else {
      if (onAddVote) {
        onAddVote({
          projectId: targetProjId,
          memberName: memberName.trim() || 'Anónimo',
          voterName: memberName.trim() || 'Anónimo',
          amount: Number(voteAmount),
          date: voteDate,
          notes: voteNotes.trim()
        });
      }
    }
    setIsVoteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Proyectos */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-6 ${isMobile ? 'p-6' : 'p-8'} rounded-3xl text-white shadow-2xl relative overflow-hidden`}
        style={{ backgroundImage: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)', boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.35)' }}
      >
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-200 bg-white/15 px-3 py-1 rounded-full inline-block mb-2 backdrop-blur-sm">
            Recaudación y Metas
          </span>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white mb-1 tracking-tight`}>Proyectos en Curso</h2>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium opacity-90">Gestión de metas de recaudación y control transparente de votos congregacionales</p>
        </div>

        {!isReadOnly && (
          <button
            onClick={handleOpenCreateProject}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm shadow-lg shadow-black/10 transition-all active:scale-95 relative z-10"
          >
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <span>Nuevo Proyecto</span>
          </button>
        )}
      </div>

      {/* Selector de Proyecto Activo con Colores Distintos */}
      {safeProjects.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {safeProjects.map((p, idx) => {
            const isSel = (currentProjectId === p.id);
            const pTheme = PROJECT_THEMES[idx % PROJECT_THEMES.length];

            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
                  isSel
                    ? pTheme.tabActive
                    : pTheme.tabInactive
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${pTheme.dot} ${isSel ? 'ring-2 ring-white' : ''}`}></span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Ficha y Métricas del Proyecto Activo */}
      {activeProject ? (
        <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border ${activeTheme.cardBorder} shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 space-y-6`}>
          
          {/* Cabecera del Proyecto con Botones de Edición y Eliminación */}
          <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${activeTheme.dot}`}></div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeProject.name}
                </h3>
                {!isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditProject(activeProject)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all"
                      title="Editar Proyecto"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {onDeleteProject && safeProjects.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar el proyecto "${activeProject.name}" y todos sus votos?`)) {
                            onDeleteProject(activeProject.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 hover:scale-105 transition-all"
                        title="Eliminar Proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                {activeProject.description || 'Sin descripción adicional'}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 flex items-center gap-1.5 flex-wrap">
                <span>🗓️ Periodo:</span> 
                {activeProject.endDate ? (
                  <span className="font-extrabold text-slate-900 dark:text-white">{formatDate(activeProject.startDate)} hasta {formatDate(activeProject.endDate)}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-white">Desde {formatDate(activeProject.startDate)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${activeTheme.headerBadge} font-black uppercase tracking-wider`}>
                      🔓 Abierto / Continuo
                    </span>
                  </span>
                )}
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={handleOpenCreateVote}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r ${activeTheme.btnGradient} text-white font-black text-xs shadow-lg transition-all active:scale-95`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Registrar Voto / Aporte</span>
              </button>
            )}
          </div>

          {/* Tarjetas resumen con TOTAL RECAUDADO Grande y Notorio */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            
            {/* Meta Económica */}
            <div className={`md:col-span-3 p-5 rounded-2xl ${activeTheme.metaBg} flex flex-col justify-center shadow-sm`}>
              <span className={`text-[11px] font-black ${activeTheme.metaText} uppercase tracking-wider block`}>
                🎯 Meta Económica
              </span>
              <p className={`text-xl sm:text-2xl font-black ${activeTheme.metaNum} mt-2`}>
                {goal > 0 ? formatCurrency(goal) : 'Recaudación Libre'}
              </p>
              {goal <= 0 && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  Sin límite económico fijo
                </span>
              )}
            </div>

            {/* ⭐ TOTAL RECAUDADO (Gigante y Notorio) */}
            <div className="md:col-span-6 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100/70 to-teal-50 dark:from-emerald-950/50 dark:via-emerald-900/30 dark:to-teal-950/40 border-2 border-emerald-400 dark:border-emerald-500 shadow-xl shadow-emerald-500/15 flex flex-col justify-between relative overflow-hidden transform hover:scale-[1.01] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  TOTAL RECAUDADO
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  {activeProjectVotes.length} {activeProjectVotes.length === 1 ? 'voto' : 'votos'}
                </span>
              </div>
              <div className="my-3">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight drop-shadow-sm">
                  {formatCurrency(totalRaised)}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                <span>{goal > 0 ? 'Progreso alcanzado' : 'Estado de recaudación'}</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {goal > 0 ? `${progressPercent}%` : '🔓 Activo Continuo'}
                </span>
              </div>
            </div>

            {/* Faltante para la Meta */}
            <div className="md:col-span-3 p-5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 flex flex-col justify-center shadow-sm">
              <span className="text-[11px] font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider block">
                ⏳ Faltante Meta
              </span>
              <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {goal > 0 ? formatCurrency(remaining) : 'No Aplica'}
              </p>
              {goal <= 0 && (
                <span className="text-[10px] font-bold text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                  Fondo abierto sin techo
                </span>
              )}
            </div>

          </div>

          {/* Barra de Progreso Porcentual */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs font-black mb-2">
              <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {goal > 0 ? 'Barra de Cumplimiento de Meta' : 'Progreso del Proyecto'}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                {goal > 0 ? `${progressPercent}%` : '100% Activo'}
              </span>
            </div>
            <div className="w-full h-5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-300/80 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${goal > 0 ? progressPercent : 100}%` }}
              ></div>
            </div>
          </div>

          {/* Historial de Votos con Barra de Filtros Interactiva */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                Historial de Votos ({filteredVotes.length})
              </h4>
              <span className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm">
                Total Filtrado: {formatCurrency(totalFilteredVotes)}
              </span>
            </div>

            {/* Barra de Filtros */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl ${activeTheme.filterBg}`}>
              
              {/* Buscador */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar miembro o nota..."
                  value={voteSearchQuery}
                  onChange={(e) => setVoteSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Selector de Mes */}
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={voteSelectedMonth}
                  onChange={(e) => setVoteSelectedMonth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">📅 Todos los Meses</option>
                  {monthsList.map(m => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Limpiar Filtros */}
              {(voteSearchQuery || voteSelectedMonth !== 'ALL') && (
                <button
                  onClick={() => {
                    setVoteSearchQuery('');
                    setVoteSelectedMonth('ALL');
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}

            </div>

            {/* Tabla de Votos */}
            {filteredVotes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  No se encontraron votos para este proyecto con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase text-[11px]">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Miembro / Creyente</th>
                      <th className="py-3 px-4 text-right">Monto del Voto</th>
                      <th className="py-3 px-4">Notas</th>
                      {!isReadOnly && <th className="py-3 px-4 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filteredVotes.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{formatDate(v.date)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{v.memberName || v.voterName || 'Anónimo'}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(v.amount)}</td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{v.notes || '-'}</td>
                        {!isReadOnly && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditVote(v)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 p-1.5 rounded-lg border border-blue-200/60 transition-all hover:scale-105"
                                title="Editar Voto"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteVote && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Estás seguro de eliminar el voto de $${(v.amount || 0).toLocaleString('es-CO')} de "${v.memberName || v.voterName}"?`)) {
                                      onDeleteVote(v);
                                    }
                                  }}
                                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-lg border border-rose-200/60 transition-all hover:scale-105"
                                  title="Eliminar Voto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Target className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay proyectos registrados</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Crea el primer proyecto de la congregación para comenzar a registrar votos y aportes.</p>
          {!isReadOnly && (
            <button
              onClick={handleOpenCreateProject}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-lg hover:bg-indigo-500 transition-all"
            >
              + Crear Primer Proyecto
            </button>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Proyecto */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              {editingProjectId ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
            </h3>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  placeholder="Ej: Remodelación Templo, Aire Acondicionado"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Descripción</label>
                <input
                  type="text"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Propósito de la recaudación"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <MoneyInput
                label="Meta Económica ($)"
                value={financialGoal}
                onChange={setFinancialGoal}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha de Inicio *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Definir fecha límite estimada de finalización
                  </span>
                </label>

                {hasEndDate ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Fecha Estimada Fin *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={hasEndDate}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">
                    ℹ️ El proyecto quedará como <strong>Abierto / Continuo</strong> sin fecha límite fija.
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {editingProjectId ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Voto */}
      {isVoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              {editingVoteId ? 'Editar Voto' : `Registrar Voto - ${activeProject?.name}`}
            </h3>
            <form onSubmit={handleSaveVote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Miembro / Creyente</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Nombre o Anónimo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <MoneyInput
                label="Monto del Voto / Aporte"
                value={voteAmount}
                onChange={setVoteAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={voteDate}
                  onChange={(e) => setVoteDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={voteNotes}
                  onChange={(e) => setVoteNotes(e.target.value)}
                  placeholder="Detalles adicionales"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsVoteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {editingVoteId ? 'Guardar Cambios' : 'Guardar Voto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
