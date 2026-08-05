import React from 'react';
import { Wallet, TrendingUp, TrendingDown, HandHeart, PlusCircle, ArrowRightLeft, Users } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function DashboardView({
  committees,
  movements,
  offerings,
  userRole,
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
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 rounded-3xl text-white shadow-xl shadow-blue-500/10">
          <div>
            <h2 className="text-xl font-bold">¡Bienvenido a Deborita Gestión!</h2>
            <p className="text-xs text-blue-100 mt-0.5">Acceso rápido a operaciones financieras cotidianas</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMovementModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all shadow-md active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>
            <button
              onClick={onOpenOfferingModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Ofrenda</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas Principales del Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Saldo Total Consolidado */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo Consolidado
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalBalance)}
          </p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Suma de todos los comités
          </span>
        </div>

        {/* 2. Ingresos del Mes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ingresos del Mes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(currentMonthIncomes)}
          </p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Mes en curso
          </span>
        </div>

        {/* 3. Egresos del Mes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Egresos del Mes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(currentMonthExpenses)}
          </p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Gastos ejecutados
          </span>
        </div>

        {/* 4. Total de Ofrendas del Mes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ofrendas del Mes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <HandHeart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(currentMonthOfferings)}
          </p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Recaudación en reuniones
          </span>
        </div>

      </div>

      {/* Lista Deslizable de Resumen por Comité */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumen por Comités</h3>
          </div>
          <button
            onClick={() => onSelectTab('committees')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Ver todos los comités →
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {committees.map((com) => (
            <div
              key={com.id}
              onClick={() => onSelectTab('committees')}
              className="min-w-[220px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-[1.02]"
            >
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
                {com.name}
              </span>
              <p className={`text-xl font-bold mt-1 ${com.balance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {formatCurrency(com.balance)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 truncate">
                👤 Tesorero: {com.treasurer || 'No asignado'}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
