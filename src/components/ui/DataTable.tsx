'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnSizingState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUp, ArrowDown, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';

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
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    initialColumnWidths 
      ? Object.entries(initialColumnWidths).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      : {}
  );
  
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
    // Only drag if it's the left mouse button
    if (e.button !== 0) return;

    // IMPORTANT: We allow dragging even on text to make navigation easier in large tables
    // Users can still select text by moving slowly or double-clicking

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
      sorting,
      columnSizing,
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const isResizingColumn = table.getState().columnSizingInfo.isResizingColumn;
  React.useEffect(() => {
    if (!isResizingColumn && onColumnWidthChange && Object.keys(columnSizing).length > 0) {
      onColumnWidthChange(columnSizing as Record<string, number>);
    }
  }, [isResizingColumn, onColumnWidthChange, columnSizing]);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  const headers = table.getFlatHeaders();
  const totalWidth = table.getTotalSize();

  if (!isMounted) return <div className={`bg-white border border-gray-100 shadow-sm rounded-[12px] overflow-hidden flex flex-col min-h-0 relative ${height} animate-pulse`} />;

  return (
    <ScrollContext.Provider value={parentRef}>
      <div className={`bg-white border border-gray-100 shadow-sm rounded-[12px] overflow-hidden flex flex-col min-h-0 relative ${height} ${className} ${isResizingColumn ? 'is-resizing' : ''} ${isDragging ? 'is-dragging' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: `.is-resizing * { user-select: none !important; transition: none !important; cursor: col-resize !important; } .is-dragging * { user-select: none !important; cursor: grabbing !important; }` }} />
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
                {headers.map((header) => (<col key={header.id} style={{ width: columnSizing[header.id] || (header.column.columnDef as any).size || 150 }} />))}
            </colgroup>
            <thead className="sticky top-0 z-[40] shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => {
                let stickyLeft = 6; // starts after the 6px left indicator column
                return (
                <tr key={headerGroup.id}>
                  <th 
                    className="sticky left-0 w-[6px] p-0 z-30 border-b border-gray-100" 
                    style={{ backgroundColor: (headerGroup.headers[0]?.column.columnDef.meta as any)?.headerBg || '#f8fafc' }}
                  />
                  {headerGroup.headers.map((header) => {
                    const sortingState = sorting.find((s) => s.id === header.id);
                    const meta = header.column.columnDef.meta as any;
                    const colWidth = columnSizing[header.id] || (header.column.columnDef as any).size || 150;
                    const isSticky = meta?.sticky;
                    const leftOffset = stickyLeft;
                    if (isSticky) stickyLeft += colWidth;
                    return (<th 
                      key={header.id} 
                      className={`p-0 border-b border-r border-gray-100 relative group transition-colors overflow-hidden last:border-r-0 ${
                        isSticky ? 'sticky z-[42]' : ''
                      }`}
                      style={{ 
                        backgroundColor: meta?.headerBg || '#f8fafc',
                        ...(isSticky ? { left: leftOffset } : {})
                      }}
                    >
                        <div 
                          className={`px-4 py-3 flex items-center gap-2 transition-colors select-none ${!hideSorting ? 'cursor-pointer hover:bg-black/5' : ''} ${meta?.align === 'right' ? 'justify-end flex-row-reverse' : meta?.align === 'center' ? 'justify-center' : 'justify-start'}`}
                          onClick={!hideSorting ? header.column.getToggleSortingHandler() : undefined}
                        >
                            <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap overflow-hidden truncate">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {!hideSorting && (
                                <div className="flex-shrink-0">
                                {sortingState ? (
                                    sortingState.desc ? <ArrowDown size={14} className="text-blue-500" /> : <ArrowUp size={14} className="text-blue-500" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                                )}
                                </div>
                            )}
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); header.getResizeHandler()(e); }}
                            className={`absolute -right-[4px] top-0 bottom-0 w-[8px] z-50 cursor-col-resize group/resizer transition-opacity ${header.column.getIsResizing() ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                          >
                            <div className={`mx-auto h-full w-[4px] transition-colors ${header.column.getIsResizing() ? 'bg-blue-400' : 'bg-transparent group-hover/resizer:bg-blue-200'}`} />
                          </div>
                        )}
                      </th>);
                  })}
                </tr>
                );
              })}
            </thead>
            <tbody>
              {rows.length === 0 && !isLoading ? (
                <tr key="empty-row">
                  <td key="empty-cell" colSpan={headers.length + 1} className="p-0 border-none">
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
              ) : (
                <>
                  <tr key="top-spacer" style={{ height: `${virtualizer.getVirtualItems()[0]?.start ?? 0}px` }} className="border-none">
                    <td key="top-td" colSpan={headers.length + 1} className="p-0 border-none"></td>
                  </tr>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
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
                      />
                    );
                  })}
                  <tr key="bottom-spacer" style={{ height: `${Math.max(0, virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0))}px` }} className="border-none">
                    <td key="bottom-td" colSpan={headers.length + 1} className="p-0 border-none"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          </div>
        </div>
        
        {/* Minimalist Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[12px] shadow-md border border-gray-100">
                <div className="relative">
                   <div className="w-12 h-12 border-4 border-gray-100 rounded-full border-t-green-600 animate-spin" />
                </div>
                <div className="flex flex-col items-center gap-1">
                   <span className="text-[12px] font-bold text-gray-700 tracking-tight animate-pulse">Memproses Data...</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </ScrollContext.Provider>
  );
}

const TableRow = React.memo(({ row, isSelected, isOdd, onRowClick, onRowDoubleClick, rowHeight, disableHover, rowCursor, extraClassName }: any) => {
  // Compute sticky left offsets once per row render
  let stickyLeft = 6;
  const stickyOffsets: Record<string, number> = {};
  for (const cell of row.getVisibleCells()) {
    const meta = cell.column.columnDef.meta as any;
    if (meta?.sticky) {
      stickyOffsets[cell.id] = stickyLeft;
      stickyLeft += cell.column.getSize();
    }
  }

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
      className={`${rowHeight} ${rowCursor} group border-b border-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 is-selected' : extraClassName ? extraClassName : isOdd ? 'bg-gray-50/30' : 'bg-white'
      } ${!disableHover && !isSelected ? 'hover:bg-blue-50/30' : ''} text-[13px]`}
    >
      <td 
        className={`sticky left-0 w-[6px] p-0 z-30 border-none transition-colors ${isSelected ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`}
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
            className={`p-0 border-r border-gray-50/50 last:border-r-0 ${
              isSticky ? 'sticky z-[28]' : ''
            }`}
            style={{
              ...(meta?.valign === 'top' ? { verticalAlign: 'top' } : {}),
              ...(isSticky ? {
                left: stickyOffsets[cell.id],
                backgroundColor: stickyBg,
                boxShadow: 'inset -1px 0 0 #e5e7eb'  // subtle right border for last sticky col
              } : {})
            }}
          >
            <div className={`px-4 ${meta?.valign === 'top' ? '' : rowHeight} flex ${vAlignClass} text-[12px] leading-snug font-medium ${wrapClass} ${alignClass} ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-600'} select-text`}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        );
      })}</tr>
  );
});

TableRow.displayName = 'TableRow';

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;















