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
