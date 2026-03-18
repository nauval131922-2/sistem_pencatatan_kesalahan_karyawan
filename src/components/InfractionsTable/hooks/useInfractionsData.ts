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

  // Date range state (with optional initial values)
  const [startDate, setStartDate] = useState<Date>(
    () => initialStartDate || new Date()
  );
  const [endDate, setEndDate] = useState<Date>(
    () => initialEndDate || new Date()
  );

  const initialMount = useRef(true);

  // Sync state when initial data changes (from parent refresh)
  useEffect(() => {
    setInfractions(initial);
  }, [initial]);

  // Fetch filtered data based on date range
  const fetchFilteredData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const d = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const start = formatDate(startDate);
      const end = formatDate(endDate);

      const res = await fetch(`/api/infractions?start=${start}&end=${end}`);
      if (res.ok) {
        const json = await res.json();
        setInfractions(json.data || []);
        if (onPeriodChange) onPeriodChange(start, end);
      }
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [startDate, endDate, onPeriodChange]);

  // Auto-fetch when dates change (skip initial mount)
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
  };
}
