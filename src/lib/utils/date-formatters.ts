/**
 * Date formatting utilities for InfractionsTable
 */

/**
 * Format Date object to YYYY-MM-DD string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date string (YYYY-MM-DD or DD-MM-YYYY) to Indonesian format: "DD MMM YYYY"
 * Example: "2026-03-18" -> "18 Mar 2026"
 */
export function formatIndoDateStr(tglStr: string): string {
  if (!tglStr) return '';
  const cleanStr = tglStr.slice(0, 10);
  const parts = cleanStr.includes('-') ? cleanStr.split('-') : [];

  if (parts.length === 3) {
    let d: Date;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    } else {
      // DD-MM-YYYY
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    }

    if (d && !isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }

  return tglStr;
}
