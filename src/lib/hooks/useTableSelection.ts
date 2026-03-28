import { useState, useCallback } from 'react';

export function useTableSelection<T extends { id: any }>(data: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<any>(null);

  const handleRowClick = useCallback((id: any, e: React.MouseEvent) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      
      // SHIFT + CLICK: Range selection
      if (e.shiftKey && lastSelectedId !== null) {
        const currentIndex = data.findIndex(d => d.id === id);
        const lastIndex = data.findIndex(d => d.id === lastSelectedId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          
          for (let i = start; i <= end; i++) {
            next.add(data[i].id);
          }
        }
      } 
      // CTRL / CMD + CLICK: Toggle individual selection
      else if (e.ctrlKey || e.metaKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } 
      // NORMAL CLICK: Toggle if single selection, otherwise focus single selection
      else {
        const isCurrentlySelected = next.has(id);
        const wasOnlyOneSelected = next.size === 1;

        if (isCurrentlySelected && wasOnlyOneSelected) {
          next.clear();
          setLastSelectedId(null);
        } else {
          next.clear();
          next.add(id);
          setLastSelectedId(id);
        }
      }
      
      return next;
    });
  }, [data, lastSelectedId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    handleRowClick,
    clearSelection
  };
}
