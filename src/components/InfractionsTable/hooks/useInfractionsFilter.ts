import { useState, useMemo, useDeferredValue, useCallback } from 'react';
import type { Infraction } from '../types';

export type SortConfig = {
  key: string | null;
  direction: 'asc' | 'desc' | null;
};

interface UseInfractionsFilterProps {
  infractions: Infraction[];
}

export function useInfractionsFilter({ infractions }: UseInfractionsFilterProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });

  const filtered = useMemo(() => {
    let result = infractions;

    // Apply search filter
    if (deferredQuery.trim()) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (inf) =>
          inf.employee_name?.toLowerCase().includes(q) ||
          inf.description?.toLowerCase().includes(q) ||
          inf.recorded_by?.toLowerCase().includes(q) ||
          inf.date?.includes(q) ||
          inf.faktur?.toLowerCase().includes(q) ||
          inf.order_name?.toLowerCase().includes(q) ||
          inf.nama_barang?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    const { key, direction } = sortConfig;
    if (key && direction) {
      result = [...result].sort((a: any, b: any) => {
        let aVal = a[key] ?? '';
        let bVal = b[key] ?? '';

        // Handle custom sorting keys
        if (key === 'employee') {
          aVal = a.employee_name;
          bVal = b.employee_name;
        } else if (key === 'item') {
          aVal = a.nama_barang_display || a.nama_barang || '';
          bVal = b.nama_barang_display || b.nama_barang || '';
        } else if (key === 'reference') {
          aVal = a.order_name_display || a.order_name || '';
          bVal = b.order_name_display || b.order_name || '';
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [infractions, deferredQuery, sortConfig]);

  const toggleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  return {
    query,
    setQuery,
    deferredQuery,
    sortConfig,
    setSortConfig,
    filtered,
    toggleSort,
  };
}
