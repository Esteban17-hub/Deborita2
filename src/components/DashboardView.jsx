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
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-6 rounded-[2rem] text-white shadow-2xl shadow-indigo-500/20">
          <div>
            <h2 className="text-2xl font-black mb-1">¡Bienvenido a {congregationName}!</h2>
            <p className="text-sm text-blue-100 font-medium">Acceso rápido a operaciones financieras cotidianas</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMovementModal}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>
            <button
              onClick={onOpenOfferingModal}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Ofrenda</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas Principales del Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Saldo de Comités (Fondo Suave Azul) */}
        <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Saldo Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
            {formatCurrency(totalBalance)}
          </p>
          <span className="text-[11px] font-semibold text-indigo-600/70 dark:text-indigo-400/70 mt-2 block">
            Consolidado actual
          </span>
        </div>

        {/* 2. Ofrendas del Mes (Fondo Suave Ámbar) */}
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Ofrendas del mes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/80 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HandHeart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-700 dark:text-amber-300">
            {formatCurrency(currentMonthOfferings)}
          </p>
          <span className="text-[11px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-2 block">
            Recaudado este mes
          </span>
        </div>

        {/* 3. Ingresos de Comités (Fondo Verde) */}
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Ingresos Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {formatCurrency(currentMonthIncomes)}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-2 block">
            Entradas este mes
          </span>
        </div>

        {/* 4. Egresos de Comités (Fondo Rojo) */}
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Egresos Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-700 dark:text-rose-300">
            {formatCurrency(currentMonthExpenses)}
          </p>
          <span className="text-[11px] font-semibold text-rose-600/70 dark:text-rose-400/70 mt-2 block">
            Salidas este mes
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
