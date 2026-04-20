export interface DateRange {
  start: string;
  end: string;
}

/**
 * Splits a date range into monthly chunks.
 * Format: YYYY-MM-DD
 */
export function splitDateRangeIntoMonths(startDate: string, endDate: string): DateRange[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const chunks: DateRange[] = [];

  let currentStart = new Date(start);

  while (currentStart <= end) {
    const currentEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0);
    
    const chunkEnd = currentEnd > end ? end : currentEnd;
    
    chunks.push({
      start: formatDate(currentStart),
      end: formatDate(chunkEnd)
    });

    // Move to first day of next month
    currentStart = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1);
  }

  return chunks;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Standardized format for "Diperbarui" timestamp.
 * Example: 27 Mar 2026, 00.31.32
 */
export function formatLastUpdate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  
  let date: Date;
  if (typeof dateInput === 'string') {
    let validStr = dateInput;
    // Handle cases where SQLite/libsql might return space instead of T, and lack timezone
    // Libsql/SQLite CURRENT_TIMESTAMP is UTC.
    if (!validStr.includes('Z') && !validStr.includes('+')) {
      validStr = validStr.replace(' ', 'T') + 'Z';
    }
    date = new Date(validStr);
  } else {
    date = dateInput;
  }
  
  if (isNaN(date.getTime())) return '';

  try {
    // Use Intl.DateTimeFormat to force Asia/Jakarta timezone (WIB)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('id-ID', options);
    const parts = formatter.formatToParts(date);
    const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    const day = findPart('day').padStart(2, '0');
    const monthVal = findPart('month');
    const year = findPart('year');
    const hours = findPart('hour').padStart(2, '0');
    const minutes = findPart('minute').padStart(2, '0');
    const seconds = findPart('second').padStart(2, '0');

    // Robust month name resolution
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    let monthName = monthVal;
    
    if (/^\d+$/.test(monthVal)) {
      const monthIdx = parseInt(monthVal, 10) - 1;
      monthName = MONTHS[monthIdx] || monthVal;
    } else if (monthVal.length > 3) {
      const lower = monthVal.toLowerCase();
      if (lower.includes('jan')) monthName = 'Jan';
      else if (lower.includes('feb')) monthName = 'Feb';
      else if (lower.includes('mar')) monthName = 'Mar';
      else if (lower.includes('apr')) monthName = 'Apr';
      else if (lower.includes('mei') || lower.includes('may')) monthName = 'Mei';
      else if (lower.includes('jun')) monthName = 'Jun';
      else if (lower.includes('jul')) monthName = 'Jul';
      else if (lower.includes('agu') || lower.includes('aug')) monthName = 'Agu';
      else if (lower.includes('sep')) monthName = 'Sep';
      else if (lower.includes('okt') || lower.includes('oct')) monthName = 'Okt';
      else if (lower.includes('nov')) monthName = 'Nov';
      else if (lower.includes('des') || lower.includes('dec')) monthName = 'Des';
    }

    return `${day} ${monthName} ${year}, ${hours}.${minutes}.${seconds}`;
  } catch (e) {
    // Fallback to manual UTC+7 shift if Intl fails
    const wibDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    const day = String(wibDate.getUTCDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[wibDate.getUTCMonth()];
    const year = wibDate.getUTCFullYear();
    const hours = String(wibDate.getUTCHours()).padStart(2, '0');
    const minutes = String(wibDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(wibDate.getUTCSeconds()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}.${minutes}.${seconds}`;
  }
}
