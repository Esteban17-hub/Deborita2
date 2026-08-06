import React, { useState, useEffect } from 'react';
import { Calculator, History, TrendingUp, Lock } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import MoneyInput from './MoneyInput';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TithesView({ tithes, userRole, onSaveTithe }) {
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

  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'history', 'chart'

  // Entradas de la calculadora
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [pastorName, setPastorName] = useState('Pastor David Morales');
  const [smlv, setSmlv] = useState(1750905);
  const [nationalPercentage, setNationalPercentage] = useState(21);
  const [grossTithe, setGrossTithe] = useState(5000000);
  const [correctedPointInput, setCorrectedPointInput] = useState('');
  const [isPointManuallyEdited, setIsPointManuallyEdited] = useState(false);

  // Cálculos reactivos en tiempo real
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!grossTithe || grossTithe <= 0) return;

    onSaveTithe({
      month,
      year,
      pastorName,
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
    });

    alert('✅ Liquidación de diezmos guardada correctamente.');
    setActiveTab('history');
  };

  // Datos para gráfico de evolución del Diezmo Bruto
  const monthsList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const chartDataValues = monthsList.map(m => {
    const found = tithes.find(t => t.month === m && t.year === year);
    return found ? found.grossTithe : 0;
  });

  const chartData = {
    labels: monthNames,
    datasets: [
      {
        label: `Diezmo Bruto ${year} ($)`,
        data: chartDataValues,
        borderColor: 'rgb(16, 185, 129)', // Emerald 500
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
        pointRadius: 6
      }
    ]
  };

  // Cálculos de Resumen Anual
  const currentYearTithes = tithes.filter(t => t.year === year);
  
  const avgGrossTithe = currentYearTithes.length > 0
    ? currentYearTithes.reduce((acc, t) => acc + t.grossTithe, 0) / currentYearTithes.length
    : 0;
    
  const avgPastorAllocation = currentYearTithes.length > 0
    ? currentYearTithes.reduce((acc, t) => acc + t.pastorAllocation, 0) / currentYearTithes.length
    : 0;

  const maxGrossMonth = currentYearTithes.length > 0
    ? currentYearTithes.reduce((max, t) => t.grossTithe > max.grossTithe ? t : max, currentYearTithes[0])
    : null;

  const minGrossMonth = currentYearTithes.length > 0
    ? currentYearTithes.reduce((min, t) => t.grossTithe < min.grossTithe ? t : min, currentYearTithes[0])
    : null;

  const getMonthName = (m) => monthNames[parseInt(m) - 1] || '-';

  return (
    <div className="space-y-6">
      
      {/* Selector de Pestañas del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'calculator'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Calculadora de Liquidación</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Liquidaciones ({tithes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'chart'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Gráfico Evolución Anual</span>
        </button>
      </div>

      {/* Pestaña 1: Calculadora Estricta de Diezmos */}
      {activeTab === 'calculator' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Liquidación de Diezmos
          </h2>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Columna Izquierda: Entradas de Formulario */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Datos de Entrada</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mes</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  >
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Año</label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Pastor</label>
                <input
                  type="text"
                  value={pastorName}
                  onChange={(e) => setPastorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                />
              </div>

              <MoneyInput
                label="Diezmo Bruto Recolectado"
                value={grossTithe}
                onChange={setGrossTithe}
                required
              />

              <MoneyInput
                label="Valor del SMLV (Salario Mínimo)"
                value={smlv}
                onChange={setSmlv}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Porcentaje Nacional (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={nationalPercentage}
                  onChange={(e) => setNationalPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                />
              </div>
            </div>

            {/* Columna Derecha: Resultados Matemáticos en Tiempo Real */}
            <div className="space-y-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700">
              <h3 className="text-xs font-bold uppercase text-blue-400 tracking-wider">Resultados en Tiempo Real</h3>

              <div className="space-y-3 divide-y divide-slate-700/50 text-xs">
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">1. Tesorería Nacional ({nationalPercentage}%):</span>
                  <span className="font-mono font-bold text-slate-300">{formatCurrency(nationalTreasury)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400 font-bold">2. Ingreso Neto:</span>
                  <span className="font-mono font-black text-blue-400 text-sm">{formatCurrency(netIncome)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">3. Punto Calculado (Ingreso Neto / SMLV):</span>
                  <span className="font-mono font-bold text-indigo-300 text-sm">{calculatedPoint.toFixed(3)} pts</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-bold">4. Punto Corregido (%):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPointManuallyEdited(!isPointManuallyEdited);
                        if (isPointManuallyEdited) setCorrectedPointInput('');
                      }}
                      className="text-[10px] text-blue-400 underline"
                    >
                      {isPointManuallyEdited ? 'Restablecer por defecto' : 'Editar manualmente'}
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    disabled={!isPointManuallyEdited}
                    value={isPointManuallyEdited ? correctedPointInput : calculatedPoint}
                    onChange={(e) => {
                      setIsPointManuallyEdited(true);
                      setCorrectedPointInput(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800/80 text-white font-mono font-bold text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">5. Aporte Fondo Local:</span>
                  <span className="font-mono font-bold text-indigo-200">{formatCurrency(localFundAport)}</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                  <span className="text-white font-black text-sm">6. Asignación Pastor:</span>
                  <span className="font-mono font-black text-blue-300 text-lg">{formatCurrency(pastorAllocation)}</span>
                </div>

              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all mt-4"
              >
                Guardar Liquidación de Diezmos
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Pestaña 2: Historial */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Historial de Diezmos Liquidados</h2>
          {tithes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No hay diezmos registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="pb-3">Mes/Año</th>
                    <th className="pb-3">Pastor</th>
                    <th className="pb-3 text-right">Diezmo Bruto</th>
                    <th className="pb-3 text-right">Tesor. Nac.</th>
                    <th className="pb-3 text-right">Ingreso Neto</th>
                    <th className="pb-3 text-right">Puntos</th>
                    <th className="pb-3 text-right">Asign. Pastor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tithes.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{t.month}/{t.year}</td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{t.pastorName}</td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(t.grossTithe)}</td>
                      <td className="py-3 text-right font-semibold text-rose-500">{formatCurrency(t.nationalTreasury)}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(t.netIncome)}</td>
                      <td className="py-3 text-right font-mono font-bold text-amber-600">{t.correctedPoint || t.calculatedPoint} pts</td>
                      <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(t.pastorAllocation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 3: Gráfico y Resumen Anual */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Evolución de Diezmo Bruto ({year})</h2>
            <div className="h-72">
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumen Anual ({year})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ingreso Bruto Promedio</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(avgGrossTithe)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Asignación Pastor Prom.</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(avgPastorAllocation)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mes Mayor Ingreso Bruto</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {maxGrossMonth ? `${getMonthName(maxGrossMonth.month)} (${formatCurrency(maxGrossMonth.grossTithe)})` : '-'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mes Menor Ingreso Bruto</span>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                  {minGrossMonth ? `${getMonthName(minGrossMonth.month)} (${formatCurrency(minGrossMonth.grossTithe)})` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
