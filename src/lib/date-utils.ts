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
    if (!validStr.includes('Z') && !validStr.includes('+')) {
      validStr = validStr.replace(' ', 'T') + 'Z';
    }
    date = new Date(validStr);
  } else {
    date = dateInput;
  }
  
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}.${minutes}.${seconds}`;
}
