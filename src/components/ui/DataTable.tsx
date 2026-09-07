'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnSizingState,
  VisibilityState,
  SortingState,
  OnChangeFn,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUp, ArrowDown, ArrowUpDown, AlertCircle, SlidersHorizontal, Check } from 'lucide-react';

export const ScrollContext = React.createContext<React.RefObject<HTMLDivElement | null> | null>(null);

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  totalCount?: number;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  selectedIds?: Set<number | string>;
  onRowClick?: (id: any, event: React.MouseEvent) => void;
  onRowDoubleClick?: (id: any, event: React.MouseEvent) => void;
  columnWidths?: Record<string, number>;
  onColumnWidthChange?: (widths: Record<string, number>) => void;
  height?: string;
  className?: string;
  rowHeight?: string;
  hideSorting?: boolean;
  disableHover?: boolean;
  rowCursor?: string;
  getRowClassName?: (row: TData) => string;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  manualSorting?: boolean;
  enableHiding?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  resetScrollOnDataChange?: boolean;
}

function DataTableInner<TData extends { id: number | string }>({
  columns,
  data,
  isLoading = false,
  totalCount = 0,
  onScroll,
  selectedIds = new Set(),
  onRowClick,
  onRowDoubleClick,
  columnWidths: initialColumnWidths,
  onColumnWidthChange,
  height = 'flex-1',
  className = '',
  rowHeight = 'h-10',
  hideSorting = false,
  disableHover = false,
  rowCursor = 'cursor-pointer',
  getRowClassName,
  sorting,
  onSortingChange,
  manualSorting = false,
  enableHiding = false,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  resetScrollOnDataChange = true,
}: DataTableProps<TData>) {
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const activeSorting = sorting !== undefined ? sorting : localSorting;
  const activeOnSortingChange = onSortingChange !== undefined ? onSortingChange : setLocalSorting;
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const activeVisibility = controlledVisibility !== undefined ? controlledVisibility : columnVisibility;
  const activeOnVisibilityChange = onColumnVisibilityChange !== undefined ? onColumnVisibilityChange : setColumnVisibility;
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(() =>
    initialColumnWidths 
      ? Object.entries(initialColumnWidths).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      : {}
  );
  const columnSizingRef = React.useRef(columnSizing);
  columnSizingRef.current = columnSizing;
  const initialWidthsRef = React.useRef(initialColumnWidths);

  React.useEffect(() => {
    if (initialColumnWidths && initialColumnWidths !== initialWidthsRef.current) {
      initialWidthsRef.current = initialColumnWidths;
      setColumnSizing(prev => ({ ...prev, ...initialColumnWidths }));
    }
  }, [initialColumnWidths]);
  
  // To avoid hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isPointerDown, setIsPointerDown] = React.useState(false);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const scrollTop = React.useRef(0);
  const dragThreshold = 8;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!parentRef.current) return;
    if (e.button !== 0) return;
    // Jangan aktifkan drag-scroll kalau klik dimulai dari dalam sel (td/th) —
    // biarkan browser handle text selection secara normal
    if ((e.target as HTMLElement).closest('td, th')) return;

    setIsPointerDown(true);
    startX.current = e.pageX - parentRef.current.offsetLeft;
    startY.current = e.pageY - parentRef.current.offsetTop;
    scrollLeft.current = parentRef.current.scrollLeft;
    scrollTop.current = parentRef.current.scrollTop;
  };

  const onMouseLeave = () => {
    setIsPointerDown(false);
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsPointerDown(false);
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDown || !parentRef.current) return;
    const x = e.pageX - parentRef.current.offsetLeft;
    const y = e.pageY - parentRef.current.offsetTop;

    if (!isDragging) {
      const movedX = Math.abs(x - startX.current);
      const movedY = Math.abs(y - startY.current);
      if (movedX < dragThreshold && movedY < dragThreshold) return;
      setIsDragging(true);
      // Clear any accidental text selection that might have started
      window.getSelection()?.removeAllRanges();
    }

    e.preventDefault();
    const walkX = (x - startX.current) * 1.5; // Multiplier for speed
    const walkY = (y - startY.current) * 1.5;
    parentRef.current.scrollLeft = scrollLeft.current - walkX;
    parentRef.current.scrollTop = scrollTop.current - walkY;
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: activeSorting,
      columnSizing,
      columnVisibility: activeVisibility,
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onSortingChange: activeOnSortingChange,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: activeOnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    enableMultiSort: true,
    isMultiSortEvent: () => true,
  });

  const isResizingColumn = table.getState().columnSizingInfo.isResizingColumn;
  const parentRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  // Reset scroll ke paling atas HANYA jika data diganti secara total (misal ganti filter/halaman baru yang bukan append infinite scroll)
  const prevDataLengthRef = React.useRef(data.length);
  const prevFirstIdRef = React.useRef(data[0]?.id);

  React.useEffect(() => {
    const currentFirstId = data[0]?.id;
    const isAppended = data.length > prevDataLengthRef.current && currentFirstId === prevFirstIdRef.current;
    // ponytail: update in-place (edit keterangan 1 baris) panjang + id pertama sama — jangan reset scroll
    const isInPlaceUpdate = data.length === prevDataLengthRef.current && currentFirstId === prevFirstIdRef.current;

    if (resetScrollOnDataChange && !isAppended && !isInPlaceUpdate && parentRef.current) {
      parentRef.current.scrollTop = 0;
    }

    prevDataLengthRef.current = data.length;
    prevFirstIdRef.current = currentFirstId;
  }, [data, resetScrollOnDataChange]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  const headers = table.getFlatHeaders();
  const totalWidth = table.getTotalSize();

  // Pre-calculate sticky left offsets once per table render
  const stickyOffsets = React.useMemo(() => {
    let left = 6;
    const map: Record<string, number> = {};
    for (const header of headers) {
      const meta = header.column.columnDef.meta as any;
      if (meta?.sticky) {
        map[header.id] = left;
        left += header.getSize();
      }
    }
    return map;
  }, [headers, columnSizing]);

  if (!isMounted) return <div className={`bg-white border border-gray-100 shadow-sm rounded-[12px] overflow-hidden flex flex-col min-h-0 relative ${height} animate-pulse`} />;

  return (
    <ScrollContext.Provider value={parentRef}>
      <div className={`bg-white border border-gray-100 shadow-sm rounded-[12px] overflow-hidden flex flex-col min-h-0 relative ${height} ${className} ${isResizingColumn ? 'is-resizing' : ''} ${isDragging ? 'is-dragging' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: `.is-resizing { user-select: none !important; cursor: col-resize !important; } .is-resizing * { cursor: col-resize !important; } .is-dragging * { user-select: none !important; cursor: grabbing !important; }` }} />
        <div
          ref={parentRef}
          className={`overflow-auto custom-scrollbar flex-1 min-h-0 relative bg-white ${isDragging ? 'cursor-grabbing select-none' : ''}`} 
          onScroll={onScroll}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
        <div style={{ width: totalWidth }}>
          <table 
            className="text-left relative border-separate border-spacing-0"
            style={{ tableLayout: 'fixed', width: totalWidth }}
          >
            <colgroup>
                <col style={{ width: 6 }} />
                {headers.map((header) => (<col key={header.id} style={{ width: header.getSize() }} />))}
            </colgroup>
            <thead className="sticky top-0 z-[40] shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => {
                let stickyLeft = 6; // starts after the 6px left indicator column
                return (
                <tr key={headerGroup.id}>
                  <th 
                    className="sticky left-0 w-[6px] p-0 z-[45] border-b border-gray-100" 
                    style={{ backgroundColor: (headerGroup.headers[0]?.column.columnDef.meta as any)?.headerBg || '#f8fafc' }}
                  />
                  {headerGroup.headers.map((header) => {
                    const sortingState = activeSorting.find((s) => s.id === header.id);
                    const sortIndex = activeSorting.findIndex((s) => s.id === header.id);
                    const meta = header.column.columnDef.meta as any;
                    const colWidth = header.getSize();
                    const isSticky = meta?.sticky;
                    const leftOffset = stickyLeft;
                    if (isSticky) stickyLeft += colWidth;
                    return (<th 
                      key={header.id} 
                      className={`p-0 border-b border-r border-slate-200/90 relative group transition-colors overflow-hidden last:border-r-0 ${
                        isSticky ? 'sticky z-[48]' : ''
                      }`}
                      style={{ 
                        width: colWidth,
                        minWidth: colWidth,
                        maxWidth: colWidth,
                        backgroundColor: meta?.headerBg || '#f8fafc',
                        ...(isSticky ? { left: leftOffset } : {})
                      }}
                    >
                        <div 
                          className={`px-4 py-3 flex items-center gap-2 transition-colors select-none ${!hideSorting ? 'cursor-pointer hover:bg-black/5' : ''} ${meta?.align === 'right' ? 'justify-end flex-row-reverse' : meta?.align === 'center' ? 'justify-center' : 'justify-start'}`}
                          onClick={!hideSorting ? () => {
                            const colId = header.id;
                            const existing = activeSorting.find(s => s.id === colId);
                            let next: SortingState;
                            if (!existing) {
                              // Kolom belum di-sort: tambahkan asc
                              next = [...activeSorting, { id: colId, desc: false }];
                            } else if (!existing.desc) {
                              // Sudah asc: ubah ke desc
                              next = activeSorting.map(s => s.id === colId ? { ...s, desc: true } : s);
                            } else {
                              // Sudah desc: hapus dari sort list
                              next = activeSorting.filter(s => s.id !== colId);
                            }
                            activeOnSortingChange(next);
                          } : undefined}
                        >
                            <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap overflow-hidden truncate">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {!hideSorting && (
                                <div className="flex-shrink-0 flex items-center gap-0.5">
                                {sortingState ? (
                                    <>
                                      {sortingState.desc ? <ArrowDown size={14} className="text-blue-500" /> : <ArrowUp size={14} className="text-blue-500" />}
                                      {activeSorting.length > 1 && (
                                        <span className="text-[11px] font-bold text-blue-400 leading-none">{sortIndex + 1}</span>
                                      )}
                                    </>
                                ) : (
                                    <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                                )}
                                </div>
                            )}
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const startX = e.clientX;
                              const colId = header.id;
                              const currentWidth = header.getSize();

                              const onMouseMove = (moveEvent: MouseEvent) => {
                                const diff = moveEvent.clientX - startX;
                                const newWidth = Math.max(40, currentWidth + diff);
                                setColumnSizing(prev => ({
                                  ...prev,
                                  [colId]: newWidth
                                }));
                              };

                              const onMouseUp = (upEvent: MouseEvent) => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                                document.body.style.cursor = '';
                                document.body.style.userSelect = '';
                                const diff = upEvent.clientX - startX;
                                const finalWidth = Math.max(40, currentWidth + diff);
                                const nextWidths = { ...columnSizingRef.current, [colId]: finalWidth };
                                setColumnSizing(nextWidths);
                                if (onColumnWidthChange) {
                                  onColumnWidthChange(nextWidths as Record<string, number>);
                                }
                              };

                              document.body.style.cursor = 'col-resize';
                              document.body.style.userSelect = 'none';
                              document.addEventListener('mousemove', onMouseMove);
                              document.addEventListener('mouseup', onMouseUp);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              const touch = e.touches[0];
                              if (!touch) return;
                              const startX = touch.clientX;
                              const colId = header.id;
                              const currentWidth = header.getSize();

                              const onTouchMove = (moveEvent: TouchEvent) => {
                                const t = moveEvent.touches[0];
                                if (!t) return;
                                const diff = t.clientX - startX;
                                const newWidth = Math.max(40, currentWidth + diff);
                                setColumnSizing(prev => ({
                                  ...prev,
                                  [colId]: newWidth
                                }));
                              };

                              const onTouchEnd = (endEvent: TouchEvent) => {
                                document.removeEventListener('touchmove', onTouchMove);
                                document.removeEventListener('touchend', onTouchEnd);
                                const t = endEvent.changedTouches[0];
                                const diff = t ? t.clientX - startX : 0;
                                const finalWidth = Math.max(40, currentWidth + diff);
                                const nextWidths = { ...columnSizingRef.current, [colId]: finalWidth };
                                setColumnSizing(nextWidths);
                                if (onColumnWidthChange) {
                                  onColumnWidthChange(nextWidths as Record<string, number>);
                                }
                              };

                              document.addEventListener('touchmove', onTouchMove, { passive: false });
                              document.addEventListener('touchend', onTouchEnd);
                            }}
                            className="absolute -right-[10px] top-0 bottom-0 w-[20px] z-50 cursor-col-resize group/resizer flex items-center justify-center select-none touch-none"
                            title="Geser untuk mengatur lebar kolom"
                          >
                            <div className="w-[3px] h-full transition-colors bg-transparent group-hover/resizer:bg-emerald-500 active:bg-emerald-600" />
                          </div>
                        )}
                      </th>);
                  })}
                </tr>
                );
              })}
            </thead>
            <tbody>
              {rows.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={headers.length + 1} className="p-0 border-none">
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="text-gray-300" size={32} />
                      </div>
                      <h3 className="text-[14px] font-bold text-gray-800 mb-1">Data Tidak Ditemukan</h3>
                      <p className="text-[12px] text-gray-400 font-medium max-w-[240px] leading-relaxed">
                        Tidak ada rekaman untuk ditampilkan pada periode ini atau kriteria pencarian Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {rows.length > 0 && (
                <tr style={{ height: `${virtualizer.getVirtualItems()[0]?.start ?? 0}px` }} className="border-none">
                  <td colSpan={headers.length + 1} className="p-0 border-none" />
                </tr>
              )}
              {rows.length > 0 && virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                const isSelected = selectedIds.has(row.original.id);
                const isOdd = virtualRow.index % 2 === 1;
                return (
                  <TableRow
                    key={`row-${row.original.id}`}
                    row={row}
                    isSelected={isSelected}
                    isOdd={isOdd}
                    onRowClick={onRowClick}
                    onRowDoubleClick={onRowDoubleClick}
                    rowHeight={rowHeight}
                    disableHover={disableHover}
                    rowCursor={rowCursor}
                    extraClassName={getRowClassName ? getRowClassName(row.original) : ''}
                    stickyOffsets={stickyOffsets}
                  />
                );
              })}
              {rows.length > 0 && (
                <tr style={{ height: `${Math.max(0, virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0))}px` }} className="border-none">
                  <td colSpan={headers.length + 1} className="p-0 border-none" />
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        
        {/* Skeleton loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
            <div className="w-full max-w-4xl space-y-3">
              {Array.from({ length: 8 }).map((_, r) => (
                <div key={r} className="flex items-center gap-4 px-2">
                  <div className="h-4 w-4 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse" />
                  <div className="h-4 w-24 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse" />
                  <div className="h-4 w-16 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse" />
                </div>
              ))}
            </div>
            <span className="mt-4 text-[12px] font-bold text-gray-500 tracking-tight animate-pulse">Memproses Data...</span>
          </div>
        )}
      </div>
    </ScrollContext.Provider>
  );
}
function areObjectsEqual(a?: Record<string, number>, b?: Record<string, number>) {
  if (a === b) return true;
  if (!a || !b) return a === b;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

const TableRow = React.memo(({
  row,
  isSelected,
  isOdd,
  onRowClick,
  onRowDoubleClick,
  rowHeight,
  disableHover,
  rowCursor,
  extraClassName,
  stickyOffsets,
}: any) => {
  // stickyBg must be SOLID (no transparency) so it covers scrolled cells beneath
  const stickyBg = isSelected
    ? '#dbeafe'  // blue-100 solid
    : extraClassName?.includes('rose')
      ? '#fff1f2'
      : extraClassName?.includes('emerald')
        ? '#f0fdf4'
        : extraClassName?.includes('amber')
          ? '#fffbeb'
          : extraClassName?.includes('violet')
            ? '#f5f3ff'
            : isOdd ? '#f9fafb' : '#ffffff';  // solid white/gray-50 for odd rows

  return (
    <tr
      onMouseDown={(e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      }}
      onClick={(e) => onRowClick && onRowClick(row.original.id, e)}
      onDoubleClick={(e) => onRowDoubleClick && onRowDoubleClick(row.original.id, e)}
      className={`${rowHeight} ${rowCursor} group border-b border-slate-200/80 transition-colors ${
        isSelected ? 'bg-blue-50 is-selected' : extraClassName ? extraClassName : isOdd ? 'bg-gray-50/30' : 'bg-white'
      } ${!disableHover && !isSelected ? 'hover:bg-blue-50/30' : ''} text-[13px]`}
    >
      <td 
        className={`sticky left-0 w-[6px] p-0 z-[20] border-none transition-colors ${isSelected ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`}
        style={{ backgroundColor: isSelected ? '#3b82f6' : stickyBg }} 
      />
      {row.getVisibleCells().map((cell: any) => {
        const meta = cell.column.columnDef.meta as any;
        const isSticky = meta?.sticky;
        const alignClass = meta?.align === 'right' ? 'justify-end text-right font-mono' : meta?.align === 'center' ? 'justify-center text-center' : 'justify-start text-left';
        const wrapClass = meta?.wrap ? 'whitespace-normal' : meta?.overflowVisible ? 'whitespace-nowrap !overflow-visible' : 'truncate';
        const vAlignClass = meta?.valign === 'top' ? 'items-start py-3' : 'items-center';

        return (
          <td 
            key={cell.id} 
            className={`p-0 border-r border-slate-200/80 last:border-r-0 ${
              isSticky ? 'sticky z-[25]' : ''
            }`}
            style={{
              ...(meta?.valign === 'top' ? { verticalAlign: 'top' } : {}),
              ...(isSticky ? {
                left: stickyOffsets?.[cell.column.id] ?? 6,
                backgroundColor: stickyBg,
                boxShadow: 'inset -1px 0 0 #cbd5e1'  // solid right border for sticky col
              } : {})
            }}
          >
            <div className={`px-4 ${meta?.valign === 'top' ? '' : rowHeight} flex ${vAlignClass} text-[12px] leading-snug font-medium ${wrapClass} ${alignClass} ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-600'} select-text`}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        );
      })}
    </tr>
  );
}, (prev, next) => {
  return (
    prev.row.original === next.row.original &&
    prev.isSelected === next.isSelected &&
    prev.isOdd === next.isOdd &&
    prev.rowHeight === next.rowHeight &&
    prev.extraClassName === next.extraClassName &&
    prev.disableHover === next.disableHover &&
    prev.rowCursor === next.rowCursor &&
    (prev.stickyOffsets === next.stickyOffsets || areObjectsEqual(prev.stickyOffsets, next.stickyOffsets))
  );
});

TableRow.displayName = 'TableRow';

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;















