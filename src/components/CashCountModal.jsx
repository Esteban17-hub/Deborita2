import React, { useState } from 'react';
import { Calculator, Copy, RefreshCw, X, Coins, Banknote, Share2, Check, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-hot-toast';

export default function CashCountModal({ isOpen, onClose, onApplyTotal }) {
  // Denominaciones de Billetes Colombianos
  const [bills, setBills] = useState({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
  });

  // Denominaciones de Monedas Colombianas
  const [coins, setCoins] = useState({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });

  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleBillChange = (denomination, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setBills(prev => ({ ...prev, [denomination]: qty }));
  };

  const handleCoinChange = (denomination, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setCoins(prev => ({ ...prev, [denomination]: qty }));
  };

  const handleClear = () => {
    setBills({ 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0 });
    setCoins({ 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0 });
    setNotes('');
    toast.success('Valores reiniciados');
  };

  // Cálculos
  const billsTotal = Object.entries(bills).reduce((sum, [denom, qty]) => sum + (parseInt(denom) * qty), 0);
  const coinsTotal = Object.entries(coins).reduce((sum, [denom, qty]) => sum + (parseInt(denom) * qty), 0);
  const grandTotal = billsTotal + coinsTotal;

  const totalBillsCount = Object.values(bills).reduce((sum, qty) => sum + qty, 0);
  const totalCoinsCount = Object.values(coins).reduce((sum, qty) => sum + qty, 0);

  // Copiar resumen formateado para WhatsApp
  const handleCopyWhatsApp = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    let text = `💵 *ARQUEO Y CONTEO DE EFECTIVO*\n`;
    text += `📅 Fecha: ${dateStr} - ${timeStr}\n`;
    if (notes) text += `📝 Concepto: ${notes}\n`;
    text += `------------------------------------\n`;
    
    if (billsTotal > 0) {
      text += `*💵 BILLETES (${totalBillsCount} uds):*\n`;
      Object.entries(bills)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .forEach(([denom, qty]) => {
          if (qty > 0) {
            text += `• $${Number(denom).toLocaleString()} x ${qty} = ${formatCurrency(Number(denom) * qty)}\n`;
          }
        });
      text += `*Subtotal Billetes: ${formatCurrency(billsTotal)}*\n\n`;
    }

    if (coinsTotal > 0) {
      text += `*🪙 MONEDAS (${totalCoinsCount} uds):*\n`;
      Object.entries(coins)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .forEach(([denom, qty]) => {
          if (qty > 0) {
            text += `• $${Number(denom).toLocaleString()} x ${qty} = ${formatCurrency(Number(denom) * qty)}\n`;
          }
        });
      text += `*Subtotal Monedas: ${formatCurrency(coinsTotal)}*\n\n`;
    }

    text += `====================================\n`;
    text += `💰 *TOTAL GENERAL: ${formatCurrency(grandTotal)}*\n`;
    text += `====================================`;

    navigator.clipboard.writeText(text);
    toast.success('¡Resumen de arqueo copiado al portapapeles!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-auto max-h-[92vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Arqueo y Conteo de Efectivo</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Calculadora rápida de billetes y monedas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Totalizador Destacado Superior */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/20 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
              Total Conteo en Vivo
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-emerald-100">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
              💵 Billetes: <strong>{formatCurrency(billsTotal)}</strong> ({totalBillsCount})
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
              🪙 Monedas: <strong>{formatCurrency(coinsTotal)}</strong> ({totalCoinsCount})
            </div>
          </div>
        </div>

        {/* Contenido: Billetes y Monedas */}
        <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          
          {/* Concepto opcional */}
          <div>
            <input
              type="text"
              placeholder="Concepto / Detalle (Opcional, ej: Recaudación Culto Domingo Noche)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Columna Billetes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Billetes</span>
                </span>
                <span className="text-xs font-bold text-emerald-600">{formatCurrency(billsTotal)}</span>
              </div>

              <div className="space-y-2.5">
                {[100000, 50000, 20000, 10000, 5000, 2000].map(denom => {
                  const qty = bills[denom];
                  const subtotal = denom * qty;
                  return (
                    <div key={denom} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-white block">
                          ${denom.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Billetes de ${denom >= 1000 ? `${denom / 1000}k` : denom}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBillChange(denom, qty - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty === 0 ? '' : qty}
                            placeholder="0"
                            onChange={(e) => handleBillChange(denom, e.target.value)}
                            className="w-14 text-center py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleBillChange(denom, qty + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                          >
                            +
                          </button>
                        </div>

                        {/* Total calculado debajo de la cantidad */}
                        <div className="text-right">
                          <span className={`text-[11px] font-black transition-all ${
                            qty > 0 
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 inline-block' 
                              : 'text-slate-400 dark:text-slate-600 text-[10px]'
                          }`}>
                            = {formatCurrency(subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Monedas */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Monedas</span>
                </span>
                <span className="text-xs font-bold text-amber-600">{formatCurrency(coinsTotal)}</span>
              </div>

              <div className="space-y-2.5">
                {[1000, 500, 200, 100, 50].map(denom => {
                  const qty = coins[denom];
                  const subtotal = denom * qty;
                  return (
                    <div key={denom} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-white block">
                          ${denom.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Monedas de ${denom}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCoinChange(denom, qty - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty === 0 ? '' : qty}
                            placeholder="0"
                            onChange={(e) => handleCoinChange(denom, e.target.value)}
                            className="w-14 text-center py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleCoinChange(denom, qty + 1)}
                            className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                          >
                            +
                          </button>
                        </div>

                        {/* Total calculado debajo de la cantidad */}
                        <div className="text-right">
                          <span className={`text-[11px] font-black transition-all ${
                            qty > 0 
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 inline-block' 
                              : 'text-slate-400 dark:text-slate-600 text-[10px]'
                          }`}>
                            = {formatCurrency(subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer con Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Copiar para WhatsApp</span>
            </button>

            {onApplyTotal && (
              <button
                type="button"
                onClick={() => {
                  onApplyTotal(grandTotal);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Usar este Total ({formatCurrency(grandTotal)})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
