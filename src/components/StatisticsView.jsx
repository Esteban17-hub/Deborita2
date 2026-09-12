import React from 'react';
import { PieChart, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsView({
  movements,
  committees,
  tithes,
  offerings,
  userRole
}) {
  const currentYear = new Date().getFullYear().toString();

  // Acumulados Anuales
  const annualTithes = tithes
    .filter(t => t.year === currentYear)
    .reduce((acc, t) => acc + (t.grossTithe || 0), 0);

  const annualOfferings = offerings
    .filter(o => o.date && o.date.startsWith(currentYear))
    .reduce((acc, o) => acc + (o.amount || 0), 0);

  const activeMovements = movements.filter(m => !m.annulled && m.date && m.date.startsWith(currentYear));

  const annualIncomes = activeMovements
    .filter(m => m.type === 'INGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  const annualExpenses = activeMovements
    .filter(m => m.type === 'EGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  // Gráfico 1: Evolución de diezmos mes a mes
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const tithesMonthlyData = monthCodes.map(mc => {
    const found = tithes.find(t => t.month === mc && t.year === currentYear);
    return found ? found.grossTithe : 0;
  });

  const tithesLineChart = {
    labels: months,
    datasets: [
      {
        label: `Diezmos Recaudados ${currentYear} ($)`,
        data: tithesMonthlyData,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        tension: 0.3,
        pointRadius: 5
      }
    ]
  };

  // Gráfico 2: Total de ofrendas mes a mes
  const offeringsMonthlyData = monthCodes.map(mc => {
    const prefix = `${currentYear}-${mc}`;
    return offerings
      .filter(o => o.date && o.date.startsWith(prefix))
      .reduce((acc, o) => acc + (o.amount || 0), 0);
  });

  const offeringsBarChart = {
    labels: months,
    datasets: [
      {
        label: `Ofrendas Mensuales ${currentYear} ($)`,
        data: offeringsMonthlyData,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderRadius: 8
      }
    ]
  };

  // Gráfico 3: Lado a Lado - Ingresos vs Egresos por Comité
  const committeeNames = committees.map(c => c.name);
  const committeeIncomes = committees.map(c => {
    return activeMovements
      .filter(m => m.committeeId === c.id && m.type === 'INGRESO')
      .reduce((acc, m) => acc + (m.amount || 0), 0);
  });
  const committeeExpenses = committees.map(c => {
    return activeMovements
      .filter(m => m.committeeId === c.id && m.type === 'EGRESO')
      .reduce((acc, m) => acc + (m.amount || 0), 0);
  });

  const comparisonChartData = {
    labels: committeeNames,
    datasets: [
      {
        label: 'Ingresos ($)',
        data: committeeIncomes,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Egresos ($)',
        data: committeeExpenses,
        backgroundColor: 'rgba(244, 63, 94, 0.8)',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-7 h-7 text-purple-600" />
          Estadísticas Generales ({currentYear})
        </h2>
        <p className="text-xs text-slate-500">Métricas consolidadas de rendimiento financiero congregacional</p>
      </div>

      {/* Tarjetas Acumuladas Anuales con Fondos Suaves Tintados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {userRole !== 'VISITA' && (
          <div className="p-5 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/30 border-t-4 border-t-indigo-500 border-x border-b border-indigo-200/80 dark:border-indigo-900/50 shadow-lg shadow-indigo-500/10">
            <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Diezmos Acumulados</span>
            <p className="text-2xl font-black text-indigo-900 dark:text-white mt-1 tracking-tight">
              {formatCurrency(annualTithes)}
            </p>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">Año {currentYear}</span>
          </div>
        )}

        <div className="p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border-t-4 border-t-amber-500 border-x border-b border-amber-200/80 dark:border-amber-900/50 shadow-lg shadow-amber-500/10">
          <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">Ofrendas Acumuladas</span>
          <p className="text-2xl font-black text-amber-900 dark:text-white mt-1 tracking-tight">
            {formatCurrency(annualOfferings)}
          </p>
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1 block">Año {currentYear}</span>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border-t-4 border-t-emerald-500 border-x border-b border-emerald-200/80 dark:border-emerald-900/50 shadow-lg shadow-emerald-500/10">
          <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">Ingresos de Comités</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 tracking-tight">
            {formatCurrency(annualIncomes)}
          </p>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">Entradas globales</span>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50/80 dark:bg-rose-950/30 border-t-4 border-t-rose-500 border-x border-b border-rose-200/80 dark:border-rose-900/50 shadow-lg shadow-rose-500/10">
          <span className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider">Egresos de Comités</span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 tracking-tight">
            {formatCurrency(annualExpenses)}
          </p>
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 block">Salidas ejecutadas</span>
        </div>

      </div>

      {/* Gráficos en Rejilla con Contenedores Suavemente Tintados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Diezmos */}
        {userRole !== 'VISITA' && (
          <div className="bg-indigo-50/40 dark:bg-indigo-950/20 rounded-3xl p-6 border border-indigo-200/70 dark:border-indigo-900/40 shadow-sm">
            <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-200 mb-3 tracking-wide uppercase">Evolución de Diezmos Mes a Mes</h3>
            <div className="h-64">
              <Line data={tithesLineChart} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        {/* Gráfico 2: Ofrendas */}
        <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-200/70 dark:border-amber-900/40 shadow-sm">
          <h3 className="text-sm font-black text-amber-950 dark:text-amber-200 mb-3 tracking-wide uppercase">Total de Ofrendas Mes a Mes</h3>
          <div className="h-64">
            <Bar data={offeringsBarChart} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

      </div>

      {/* Gráfico 3: Lado a Lado Ingresos vs Egresos */}
      <div className="bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 tracking-wide uppercase">Comparativo Lado a Lado: Ingresos vs Egresos por Comité</h3>
        <div className="h-72">
          <Bar data={comparisonChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

    </div>
  );
}
