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
}

export function DataTable<TData extends { id: number | string }>({
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

  if (!isMounted) return <div className={`bg-white border border-gray-100 rounded-[8px] overflow-hidden ${height} animate-pulse`} />;

  return (
    <div className={`bg-white border border-gray-100 hover:border-gray-200 transition-all duration-300 rounded-[8px] overflow-hidden flex flex-col min-h-0 relative ${height} ${className} ${isResizingColumn ? 'is-resizing' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `.is-resizing * { user-select: none !important; transition: none !important; cursor: col-resize !important; } .is-resizing th > div { cursor: col-resize !important; }` }} />
      <div 
        ref={parentRef}
        className={`overflow-auto custom-scrollbar flex-1 min-h-0 relative bg-white ${isDragging ? 'cursor-grabbing' : ''}`} 
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          <table 
            className="text-left relative border-separate border-spacing-0 min-w-full"
            style={{ tableLayout: 'fixed', width: totalWidth }}
          >
            <colgroup>
                {headers.map((header) => (<col key={header.id} style={{ width: columnSizing[header.id] || (header.column.columnDef as any).size || 150 }} />))}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortingState = sorting.find((s) => s.id === header.id);
                    return (<th key={header.id} className="p-0 border-b border-r border-gray-200 relative group transition-colors overflow-hidden">
                        <div 
                          className={`px-4 py-3 flex items-center gap-2 transition-colors select-none ${!hideSorting ? 'cursor-pointer hover:bg-gray-100/80' : ''} ${(header.column.columnDef.meta as any)?.align === 'right' ? 'justify-end flex-row-reverse' : (header.column.columnDef.meta as any)?.align === 'center' ? 'justify-center' : 'justify-start'}`}
                          onClick={!hideSorting ? header.column.getToggleSortingHandler() : undefined}
                        >
                            <span className="text-[12px] font-bold text-gray-700 tracking-tight whitespace-nowrap overflow-hidden truncate">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {!hideSorting && (
                                <div className="flex-shrink-0">
                                {sortingState ? (sortingState.desc ? <ArrowDown size={14} className="text-green-600" /> : <ArrowUp size={14} className="text-green-600" />) : (<ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-400" />)}
                                </div>
                            )}
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); header.getResizeHandler()(e); }}
                            className={`absolute -right-[4px] top-0 bottom-0 w-[8px] z-50 cursor-col-resize group/resizer transition-opacity ${header.column.getIsResizing() ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                          >
                            <div className={`mx-auto h-full w-[2px] ${header.column.getIsResizing() ? 'bg-blue-600 w-[3px]' : 'bg-blue-400/50 group-hover/resizer:bg-blue-500'}`} />
                          </div>
                        )}
                      </th>);
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr key="empty-row">
                  <td key="empty-cell" colSpan={headers.length} className="p-0 border-none">
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                       <div className="w-16 h-16 bg-gray-50 rounded-[8px] flex items-center justify-center mb-4 ring-1 ring-gray-100 shadow-sm">
                          <AlertCircle className="text-gray-200" size={32} />
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
                    <td key="top-td" colSpan={headers.length} className="p-0 border-none"></td>
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
                      />
                    );
                  })}
                  <tr key="bottom-spacer" style={{ height: `${Math.max(0, virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0))}px` }} className="border-none">
                    <td key="bottom-td" colSpan={headers.length} className="p-0 border-none"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          {isLoading && data.length > 0 && (
            <div className="p-4 flex justify-center bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              <Loader2 size={12} className="animate-spin mr-2" />
              <span>MEMUAT...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TableRow = React.memo(({ row, isSelected, isOdd, onRowClick, onRowDoubleClick, rowHeight, disableHover, rowCursor }: any) => {
  return (
    <tr
      onClick={(e) => onRowClick && onRowClick(row.original.id, e)}
      onDoubleClick={(e) => onRowDoubleClick && onRowDoubleClick(row.original.id, e)}
      className={`${rowHeight} ${rowCursor} group border-b border-gray-200 transition-colors ${
        isSelected ? 'bg-green-50 is-selected shadow-[inset_4px_0_0_0_#16a34a]' : isOdd ? 'bg-slate-50/30' : 'bg-white'
      } ${!disableHover ? 'hover:bg-green-50/50' : ''} text-[13px]`}
    >{row.getVisibleCells().map((cell: any) => {
        const meta = cell.column.columnDef.meta as any;
        const alignClass = meta?.align === 'right' ? 'justify-end text-right font-mono' : meta?.align === 'center' ? 'justify-center text-center' : 'justify-start text-left';
        const wrapClass = meta?.wrap ? 'whitespace-normal' : 'truncate';
        const vAlignClass = meta?.valign === 'top' ? 'items-start py-3' : 'items-center';
        return (
          <td 
            key={cell.id} 
            className="p-0 border-r border-gray-200"
            style={meta?.valign === 'top' ? { verticalAlign: 'top' } : {}}
          >
            <div className={`px-4 ${meta?.valign === 'top' ? '' : rowHeight} flex ${vAlignClass} text-[12px] leading-snug font-medium ${wrapClass} ${alignClass} ${isSelected ? 'text-green-700 font-bold' : 'text-[#364153]'} select-text`}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        );
      })}</tr>
  );
});

TableRow.displayName = 'TableRow';





