import { useState, useCallback } from 'react';
import type { Infraction } from '../types';

export function useInfractionsSelection(filteredData: Infraction[]) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelect = useCallback(
    (id: number, e: React.MouseEvent) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (e.shiftKey && lastSelectedId !== null) {
          // Range selection with Shift+Click
          const currentIndex = filteredData.findIndex((d) => d.id === id);
          const lastIndex = filteredData.findIndex((d) => d.id === lastSelectedId);

          if (currentIndex !== -1 && lastIndex !== -1) {
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            for (let i = start; i <= end; i++) {
              next.add(filteredData[i].id);
            }
          }
        } else if (e.ctrlKey || e.metaKey) {
          // Toggle single with Ctrl/Cmd+Click
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        } else {
          // Single select (replace selection)
          if (next.has(id)) {
            // If already selected, deselect (toggle off)
            next.clear();
          } else {
            next.clear();
            next.add(id);
          }
        }


        setLastSelectedId(id);
        return next;
      });
    },
    [filteredData, lastSelectedId]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    lastSelectedId,
    isSelected,
    toggleSelect,
    clearSelection,
    setSelectedIds, // expose for external reset if needed
  };
}
