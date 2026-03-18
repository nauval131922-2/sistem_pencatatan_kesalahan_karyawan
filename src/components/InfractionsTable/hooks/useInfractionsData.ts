import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Infraction } from '../types';

const PAGE_SIZE = 50;

interface UseInfractionsDataProps {
  initial: Infraction[];
  initialStartDate?: Date;
  initialEndDate?: Date;
  onPeriodChange?: (start: string, end: string) => void;
}

export function useInfractionsData({
  initial,
  initialStartDate,
  initialEndDate,
  onPeriodChange,
}: UseInfractionsDataProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [infractions, setInfractions] = useState<Infraction[]>(initial);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadTime, setLoadTime] = useState<number | null>(null);


  const [startDate, setStartDate] = useState<Date>(() => {

    if (initialStartDate) return initialStartDate;
    // Default to today in local time
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    if (initialEndDate) return initialEndDate;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const initialMount = useRef(true);

  // Sync state when initial data changes (from parent refresh)
  useEffect(() => {
    setInfractions(initial);
  }, [initial]);


  // Fetch filtered data based on date range
  const fetchFilteredData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const start = formatDate(startDate);
      const end = formatDate(endDate);

      // Optimistically reset visible count for new data
      setVisibleCount(PAGE_SIZE);

      const startTime = performance.now();
      const res = await fetch(`/api/infractions?start=${start}&end=${end}`);
      if (res.ok) {
        const json = await res.json();
        const endTime = performance.now();
        setLoadTime(Math.round(endTime - startTime));
        setInfractions(json.data || []);
        if (onPeriodChange) onPeriodChange(start, end);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }

  }, [startDate, endDate, onPeriodChange]);

  // Auto-fetch when dates change (skip initial mount to avoid double-loading if parent matches)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetchFilteredData();
  }, [startDate, endDate, fetchFilteredData]);

  // Listen for cross-tab data updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        fetchFilteredData();
        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, fetchFilteredData]);

  return {
    infractions,
    isRefreshing,
    visibleCount,
    setVisibleCount,
    fetchFilteredData,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loadTime,
  };
}


