import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, HandHeart, PlusCircle, ArrowRightLeft, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, deduceDayOfWeek } from '../utils/formatters';
import MoneyInput from './MoneyInput';

export default function DashboardView({
  committees,
  allCommittees = committees,
  movements,
  offerings,
  userRole,
  congregationName,
  onSelectTab,
  onAddMovement,
  onAddOffering
}) {
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState('INGRESO');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [movementDescription, setMovementDescription] = useState('');
  const [movementCommitteeId, setMovementCommitteeId] = useState('');

  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [offeringDate, setOfferingDate] = useState(new Date().toISOString().slice(0, 10));
  const [offeringDay, setOfferingDay] = useState(deduceDayOfWeek(new Date().toISOString().slice(0, 10)));
  const [offeringAmount, setOfferingAmount] = useState('');
  const [offeringCommitteeId, setOfferingCommitteeId] = useState('');

  const handleCreateMovement = (e) => {
    e.preventDefault();
    if (!movementCommitteeId || !movementAmount || movementAmount <= 0) {
      toast.error("Por favor complete todos los campos correctamente.");
      return;
    }
    onAddMovement({
      committeeId: movementCommitteeId,
      type: movementType,
      amount: movementAmount,
      description: movementDescription,
      date: movementDate
    });
    setIsMovementModalOpen(false);
    setMovementAmount('');
    setMovementDescription('');
    toast.success("Movimiento registrado con éxito.");
  };

  const handleCreateOffering = (e) => {
    e.preventDefault();
    if (!offeringCommitteeId || !offeringAmount || offeringAmount <= 0) {
      toast.error("Por favor complete todos los campos correctamente.");
      return;
    }
    onAddOffering({
      destinationCommitteeId: offeringCommitteeId,
      date: offeringDate,
      day: offeringDay,
      amount: offeringAmount
    });
    setIsOfferingModalOpen(false);
    setOfferingAmount('');
    toast.success("Ofrenda registrada con éxito.");
  };
  const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Saldo total consolidado
  const totalBalance = committees.reduce((acc, c) => acc + (c.balance || 0), 0);

  // Movimientos del mes actual (no anulados)
  const currentMonthMovements = movements.filter(
    m => !m.annulled && m.date && m.date.startsWith(currentMonthYear)
  );

  const currentMonthIncomes = currentMonthMovements
    .filter(m => m.type === 'INGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  const currentMonthExpenses = currentMonthMovements
    .filter(m => m.type === 'EGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  // Ofrendas del mes actual
  const currentMonthOfferings = offerings
    .filter(o => o.date && o.date.startsWith(currentMonthYear))
    .reduce((acc, o) => acc + (o.amount || 0), 0);

  const isReadOnly = userRole === 'VISITA';

  // Ordenar comités por fecha del movimiento más reciente (de más reciente a más antiguo)
  const sortedCommittees = [...committees].sort((a, b) => {
    const movsA = movements.filter(m => m.committeeId === a.id);
    const movsB = movements.filter(m => m.committeeId === b.id);

    const latestA = movsA.length > 0 ? movsA.reduce((max, m) => (m.date > max ? m.date : max), '') : '';
    const latestB = movsB.length > 0 ? movsB.reduce((max, m) => (m.date > max ? m.date : max), '') : '';

    if (latestA && latestB) {
      if (latestA !== latestB) return latestB.localeCompare(latestA);
      return movsB.length - movsA.length;
    }
    if (latestA) return -1;
    if (latestB) return 1;
    return (b.balance || 0) - (a.balance || 0);
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Botones de Acceso Rápido */}
      {/* Botones de Acceso Rápido - Banner Ejecutivo Vibrante */}
      {!isReadOnly && (
        <div 
          className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)', boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.35)' }}
        >
          {/* Subtle background tech glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 bg-white/15 px-3 py-1 rounded-full inline-block mb-2 backdrop-blur-sm">
              Panel Administrativo
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">¡Bienvenido a {congregationName}!</h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium opacity-90">Gestión financiera centralizada, en tiempo real y 100% en la nube</p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg shadow-black/10 active:scale-95 transition-all"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span>Registrar Movimiento</span>
            </button>
            <button
              onClick={() => setIsOfferingModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-600/30 active:scale-95 transition-all border border-amber-400/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Ofrenda</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas Principales del Resumen Financiero con Acentos Vibrantes y Fondos Tintados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* 1. Saldo de Comités (Clickable) */}
        <div
          onClick={() => onSelectTab('committees')}
          className="p-6 rounded-3xl bg-blue-50/80 dark:bg-blue-950/30 border-t-4 border-t-blue-500 border-x border-b border-blue-200/80 dark:border-blue-900/50 shadow-lg hover:shadow-xl shadow-blue-500/10 dark:shadow-slate-950/60 relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
          title="Ver Módulo de Comités"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
              Saldo Comités
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
              Consolidado actual
            </span>
            <span className="text-xs font-black text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              Ver detalles →
            </span>
          </div>
        </div>

        {/* 2. Ofrendas del Mes (Clickable) */}
        <div
          onClick={() => onSelectTab('offerings')}
          className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border-t-4 border-t-amber-500 border-x border-b border-amber-200/80 dark:border-amber-900/50 shadow-lg hover:shadow-xl shadow-amber-500/10 dark:shadow-slate-950/60 relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
          title="Ver Módulo de Ofrendas"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Ofrendas del mes
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <HandHeart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(currentMonthOfferings)}
          </p>
          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              Recaudado este mes
            </span>
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              Ver detalles →
            </span>
          </div>
        </div>

        {/* 3. Ingresos de Comités (Clickable) */}
        <div
          onClick={() => onSelectTab('committees')}
          className="p-6 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border-t-4 border-t-emerald-500 border-x border-b border-emerald-200/80 dark:border-emerald-900/50 shadow-lg hover:shadow-xl shadow-emerald-500/10 dark:shadow-slate-950/60 relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
          title="Ver Módulo de Comités"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Ingresos Comités
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
            {formatCurrency(currentMonthIncomes)}
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              Entradas del mes
            </span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              Ver detalles →
            </span>
          </div>
        </div>

        {/* 4. Egresos de Comités (Clickable) */}
        <div
          onClick={() => onSelectTab('committees')}
          className="p-6 rounded-3xl bg-rose-50/80 dark:bg-rose-950/30 border-t-4 border-t-rose-500 border-x border-b border-rose-200/80 dark:border-rose-900/50 shadow-lg hover:shadow-xl shadow-rose-500/10 dark:shadow-slate-950/60 relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
          title="Ver Módulo de Comités"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
              Egresos Comités
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
            {formatCurrency(currentMonthExpenses)}
          </p>
          <div className="mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
              Salidas del mes
            </span>
            <span className="text-xs font-black text-rose-700 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
              Ver detalles →
            </span>
          </div>
        </div>

      </div>

      {/* Lista Deslizable de Resumen por Comité */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Resumen por Comités</h3>
              <p className="text-xs text-slate-500">Distribución de saldos activos por departamento</p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('committees')}
            className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline transition-colors flex items-center gap-1"
          >
            Ver todos los comités →
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {sortedCommittees.map((com, index) => {
            // Colores vibrantes y fondos suaves dinámicos por comité
            const colorThemes = [
              { gradient: 'from-blue-600 to-indigo-600', cardBg: 'bg-blue-50/50 dark:bg-blue-950/25 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/40' },
              { gradient: 'from-emerald-600 to-teal-600', cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/25 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/40' },
              { gradient: 'from-purple-600 to-pink-600', cardBg: 'bg-purple-50/50 dark:bg-purple-950/25 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 border-purple-200/70 dark:border-purple-900/40' },
              { gradient: 'from-amber-500 to-orange-600', cardBg: 'bg-amber-50/50 dark:bg-amber-950/25 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/40' },
              { gradient: 'from-rose-600 to-red-600', cardBg: 'bg-rose-50/50 dark:bg-rose-950/25 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40' },
              { gradient: 'from-cyan-600 to-blue-600', cardBg: 'bg-cyan-50/50 dark:bg-cyan-950/25 hover:bg-cyan-50/80 dark:hover:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-900/40' },
              { gradient: 'from-violet-600 to-purple-600', cardBg: 'bg-violet-50/50 dark:bg-violet-950/25 hover:bg-violet-50/80 dark:hover:bg-violet-950/40 border-violet-200/70 dark:border-violet-900/40' },
              { gradient: 'from-teal-600 to-emerald-600', cardBg: 'bg-teal-50/50 dark:bg-teal-950/25 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 border-teal-200/70 dark:border-teal-900/40' }
            ];
            const theme = colorThemes[index % colorThemes.length];

            return (
              <div
                key={com.id}
                onClick={() => onSelectTab('committees')}
                className={`min-w-[220px] p-5 rounded-2xl ${theme.cardBg} border cursor-pointer hover:shadow-lg hover:scale-105 transition-all group`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center font-black text-sm shadow-sm`}>
                    {com.name.charAt(0)}
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate flex-1">
                    {com.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  Saldo
                </span>
                <p className={`text-2xl font-black mt-0.5 tracking-tight ${com.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(com.balance)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium truncate">
                  Tesorero: <span className="text-slate-700 dark:text-slate-300 font-semibold">{com.treasurer || 'No asignado'}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nuevo Movimiento desde Dashboard */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 lg:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Registrar Movimiento</span>
            </h3>
            <form onSubmit={handleCreateMovement} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Seleccionar Comité <span className="text-rose-500">*</span>
                </label>
                <select
                  value={movementCommitteeId}
                  onChange={(e) => setMovementCommitteeId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="">Seleccione un comité...</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('INGRESO')}
                  className={`py-3 rounded-2xl font-black text-xs border transition-all ${
                    movementType === 'INGRESO'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  🟢 Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('EGRESO')}
                  className={`py-3 rounded-2xl font-black text-xs border transition-all ${
                    movementType === 'EGRESO'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={movementDescription}
                  onChange={(e) => setMovementDescription(e.target.value)}
                  placeholder="Detalle de la transacción, responsable..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Ofrenda desde Dashboard */}
      {isOfferingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 lg:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <HandHeart className="w-6 h-6 text-amber-500" />
              <span>Agregar Ofrenda</span>
            </h3>
            <form onSubmit={handleCreateOffering} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    value={offeringDate}
                    onChange={(e) => {
                      setOfferingDate(e.target.value);
                      setOfferingDay(deduceDayOfWeek(e.target.value));
                    }}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Día</label>
                  <input
                    type="text"
                    value={offeringDay}
                    onChange={(e) => setOfferingDay(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Destino / Comité <span className="text-rose-500">*</span>
                </label>
                <select
                  value={offeringCommitteeId}
                  onChange={(e) => setOfferingCommitteeId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                >
                  <option value="">Seleccione un destino...</option>
                  {allCommittees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <MoneyInput
                label="Valor de Ofrenda"
                value={offeringAmount}
                onChange={setOfferingAmount}
                required
              />

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOfferingModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all active:scale-95"
                >
                  Registrar Ofrenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
