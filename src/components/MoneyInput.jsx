import React from 'react';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { numeroALetras } from '../utils/numberToWords';

export default function MoneyInput({
  label,
  value,
  onChange,
  placeholder = '$ 0',
  disabled = false,
  required = false,
  id
}) {
  const numericVal = typeof value === 'number' ? value : parseCurrency(value);
  const formattedDisplay = value !== '' && value !== null && value !== undefined 
    ? formatCurrency(numericVal) 
    : '';

  const handleChange = (e) => {
    const rawInput = e.target.value;
    const parsed = parseCurrency(rawInput);
    onChange(parsed);
  };

  const words = numericVal > 0 ? numeroALetras(numericVal) : '';

  return (
    <div className="money-input-container">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={formattedDisplay}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-60"
      />
      {words && (
        <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-900/50 italic">
          🗣️ {words}
        </p>
      )}
    </div>
  );
}
