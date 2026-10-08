/**
 * Utilidades para formatear moneda, fechas y deducir día de la semana.
 */

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount) || amount === '') return '$ 0';
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(absNum);

  return isNegative ? `-$ ${formatted}` : `$ ${formatted}`;
}

export function parseCurrency(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  // Extraer números y signo menos
  const cleaned = str.toString().replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function deduceDayOfWeek(dateStr) {
  if (!dateStr) return '';
  // Separar fecha YYYY-MM-DD para evitar problemas de zona horaria local
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatLongDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const date = new Date(year, monthIdx, day);
  const dayName = days[date.getDay()] || '';
  const monthName = months[monthIdx] || '';

  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function getCurrentMonthYear() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return { month, year: String(year) };
}

/**
 * Convierte cualquier formato de fecha a un número comparable YYYYMMDD para ordenamiento exacto del día 1 al 31
 */
export function parseDateToNumber(dateStr) {
  if (!dateStr) return 0;
  if (typeof dateStr === 'number') return dateStr;
  const str = String(dateStr).trim();
  // Si formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.slice(0, 10).split('-');
    return parseInt(`${parts[0]}${parts[1]}${parts[2]}`, 10);
  }
  // Si formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].slice(0, 4);
    return parseInt(`${y}${m}${d}`, 10);
  }
  const timestamp = new Date(str).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Función de ordenamiento cronológico ascendente (Día 1 al 31)
 */
export function compareDatesAsc(dateA, dateB) {
  return parseDateToNumber(dateA) - parseDateToNumber(dateB);
}
