import React from 'react';
import { Wallet, TrendingUp, TrendingDown, HandHeart, PlusCircle, ArrowRightLeft, Users } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function DashboardView({
  committees,
  movements,
  offerings,
  userRole,
  congregationName,
  onOpenMovementModal,
  onOpenOfferingModal,
  onSelectTab
}) {
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

  return (
    <div className="space-y-6">
      
      {/* Botones de Acceso Rápido */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/50 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">¡Bienvenido a {congregationName}!</h2>
            <p className="text-sm text-slate-400 font-medium">Acceso rápido a operaciones financieras cotidianas</p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={onOpenMovementModal}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>
            <button
              onClick={onOpenOfferingModal}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(0,200,83,0.3)] active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Ofrenda</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas Principales del Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Saldo de Comités */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Consolidado actual
          </span>
        </div>

        {/* 2. Ofrendas del Mes */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ofrendas del mes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <HandHeart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">
            {formatCurrency(currentMonthOfferings)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Recaudado este mes
          </span>
        </div>

        {/* 3. Ingresos de Comités */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ingresos Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(currentMonthIncomes)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Entradas este mes
          </span>
        </div>

        {/* 4. Egresos de Comités */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Egresos Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-rose-400 tracking-tight">
            {formatCurrency(currentMonthExpenses)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Salidas este mes
          </span>
        </div>

      </div>

      {/* Lista Deslizable de Resumen por Comité */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl shadow-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-white">Resumen por Comités</h3>
          </div>
          <button
            onClick={() => onSelectTab('committees')}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Ver todos →
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {committees.map((com) => (
            <div
              key={com.id}
              onClick={() => onSelectTab('committees')}
              className="min-w-[200px] p-5 rounded-2xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-blue-500/50 transition-all"
            >
              <span className="text-[11px] font-bold text-slate-400 block truncate uppercase tracking-wider">
                {com.name}
              </span>
              <p className={`text-2xl font-black mt-1 ${com.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                {formatCurrency(com.balance)}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 font-medium truncate">
                Tesorero: <span className="text-slate-300">{com.treasurer || 'No asignado'}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
