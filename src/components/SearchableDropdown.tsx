'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Portal, { getZoomScale } from './Portal';

interface SearchableDropdownProps {
  /** Currently selected value */
  value: string;
  /** All items to show. Pass '' as the "all / reset" item */
  items: string[];
  /** Label shown above the trigger button */
  label?: string;
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  /** Text for the empty-selection item (e.g. "Semua Kategori") */
  allLabel?: string;
  /** Search box placeholder */
  searchPlaceholder?: string;
  /** Width of the trigger button */
  triggerWidth?: string;
  /** Width of the dropdown panel (defaults to triggerWidth) */
  panelWidth?: string;
  /** Icon rendered on the left of the trigger */
  icon?: React.ReactNode;
  /** Called when the user selects an item */
  onChange: (value: string) => void;
  /** Additional class on the root wrapper */
  className?: string;
  /** Unique id suffix – required when multiple dropdowns are on the same page */
  id: string;
  /** Maximum number of items to display at once */
  maxDisplay?: number;
  /** Optional display label per value (e.g. username → full name) */
  itemLabels?: Record<string, string>;
  /** Compact trigger height for dense toolbars */
  compact?: boolean;
  /** Optional callback triggered when the search query changes (for server-side searching) */
  onSearchQueryChange?: (query: string) => void;
  /** Use Portal to float panel outside overflow-hidden parents (default: true) */
  usePortal?: boolean;
}

export default function SearchableDropdown({
  value,
  items,
  label,
  placeholder,
  allLabel = 'Semua',
  searchPlaceholder = 'Cari...',
  triggerWidth = 'w-[180px]',
  panelWidth,
  icon,
  onChange,
  className = '',
  id,
  maxDisplay = 50,
  itemLabels,
  compact = false,
  onSearchQueryChange,
  usePortal = false,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [openUpward, setOpenUpward] = useState(false);
  const [bottomCoord, setBottomCoord] = useState(0);
  const [alignRight, setAlignRight] = useState(false);
  const [alignOffset, setAlignOffset] = useState<number>(0);
  const [portalLeft, setPortalLeft] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scale = getZoomScale(containerRef.current);
      const panelEstimatedHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlipUp = spaceBelow < panelEstimatedHeight && rect.top > panelEstimatedHeight;

      setOpenUpward(shouldFlipUp);
      setBottomCoord((window.innerHeight - rect.top + 4) / scale);

      // Hitung lebar panel yang terukur atau perkiraan awal
      const measuredPanelWidth = panelRef.current?.offsetWidth || Math.max(rect.width, 240);
      const padding = 12;

      if (usePortal) {
        // Viewport clamping langsung untuk mode portal
        const minLeft = padding;
        const maxLeft = Math.max(padding, window.innerWidth - measuredPanelWidth - padding);
        let targetLeft = rect.left;
        if (rect.left > window.innerWidth / 2 || window.innerWidth - rect.left < measuredPanelWidth + padding) {
          targetLeft = rect.right - measuredPanelWidth;
        }
        const clampedLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));
        setPortalLeft(clampedLeft / scale);
      } else {
        // Non-portal (relative positioning): hitung container / viewport boundaries
        let leftEdge = 0;
        let rightEdge = window.innerWidth;

        let parent = containerRef.current.parentElement;
        while (parent && parent !== document.body) {
          const style = getComputedStyle(parent);
          const overflow = (style.overflow || '') + (style.overflowX || '') + (style.overflowY || '');
          if (overflow.includes('hidden') || overflow.includes('auto') || overflow.includes('scroll')) {
            const parentRect = parent.getBoundingClientRect();
            leftEdge = Math.max(leftEdge, parentRect.left);
            rightEdge = Math.min(rightEdge, parentRect.right);
            break;
          }
          parent = parent.parentElement;
        }

        const availableLeft = Math.max(padding, leftEdge + padding);
        const availableRight = Math.min(window.innerWidth - padding, rightEdge - padding);

        // Default membuka rata kiri dari trigger
        const idealLeft = rect.left;
        let shift = 0;

        // Jika sisi kanan panel meluap melewati availableRight, geser ke kiri secukupnya
        if (idealLeft + measuredPanelWidth > availableRight) {
          shift = availableRight - (idealLeft + measuredPanelWidth);
        }
        // Pastikan tidak meluap ke sisi kiri layar
        if (idealLeft + shift < availableLeft) {
          shift = availableLeft - idealLeft;
        }

        setAlignOffset(shift);
      }

      // Tetap set alignRight sebagai penanda arah jika dibutuhkan
      const spaceRight = window.innerWidth - rect.left;
      setAlignRight(rect.left > window.innerWidth / 2 || spaceRight < measuredPanelWidth);

      setCoords({
        top: (rect.bottom + 4) / scale,
        left: rect.left / scale,
        width: rect.width / scale,
      });
    }
  }, [usePortal]);

  const labelFor = useCallback((item: string) => {
    if (item === '') return allLabel;
    return itemLabels?.[item] ?? String(item);
  }, [allLabel, itemLabels]);

  // All items including the "all" entry (filter out empty strings to prevent duplicate '__all__')
  const filtered = useMemo(() => {
    const cleanedItems = items.filter(i => String(i) !== '');
    const allItems = ['', ...cleanedItems.map(i => String(i))];
    return allItems
      .filter((i) => labelFor(i).toLowerCase().includes(query.toLowerCase()))
      .slice(0, maxDisplay);
  }, [items, query, labelFor, maxDisplay]);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    // Re-run di frame berikutnya setelah DOM panel terpasang untuk pengukuran lebar akurat
    const rafId = requestAnimationFrame(() => {
      updateCoords();
    });
    return () => cancelAnimationFrame(rafId);
  }, [open, updateCoords]);
  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open, updateCoords]);

  // If selected value is outside the sliced list, still show a sensible label
  const displayLabel = value === ''
    ? (placeholder ?? allLabel)
    : (itemLabels?.[value]
      ?? items.find(i => String(i) === value || String(i).startsWith(value + ' — '))
      ?? String(value));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search when opened, init focused index to current selection
  useEffect(() => {
    if (open) {
      setQuery('');
      onSearchQueryChange?.('');
      // Find where the current value sits so first ↓ moves to the next item
      const idx = ['', ...items].findIndex(item => item === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
      
      // ponytail: on mobile, wait for keyboard to open, then scroll dropdown trigger into view
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300); // 300ms is usually enough for the mobile keyboard slide-up animation
      }

      if (typeof window === 'undefined' || window.innerWidth >= 768) {
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelectorAll('[data-item]')[focusedIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  const select = useCallback((val: string) => {
    onChange(val);
    setOpen(false);
    setQuery('');
    setFocusedIndex(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filtered.length) {
          select(filtered[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const toggleOpen = () => {
    if (!open) {
      updateCoords();
    }
    setOpen(v => !v);
  };

  const panelContent = (
    <div
      ref={panelRef}
      id={`dropdown-panel-${id}`}
      role="listbox"
      aria-label={label}
      style={usePortal ? {
        position: 'fixed',
        ...(openUpward ? { bottom: `${bottomCoord}px` } : { top: `${coords.top}px` }),
        left: `${portalLeft}px`,
        minWidth: `${coords.width}px`,
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 10000
      } : {
        transform: alignOffset ? `translateX(${alignOffset}px)` : undefined,
      }}
      className={`${usePortal ? '' : `absolute left-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} min-w-full max-w-[calc(100vw-24px)]`} bg-white border border-gray-100 rounded-xl shadow-xl shadow-emerald-900/10 py-3 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px] w-max`}
    >
      {/* Search */}
      <div className="px-3 pb-3 shrink-0 border-b border-gray-50 mb-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={14} className="text-gray-400" />
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={e => {
              const q = e.target.value;
              setQuery(q);
              setFocusedIndex(-1);
              onSearchQueryChange?.(q);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full pl-10 pr-4 ${compact ? 'py-2 text-[11px]' : 'py-2.5 text-[13px]'} bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 rounded-lg transition-all placeholder:text-gray-400 font-medium`}
          />
        </div>
      </div>

      {/* Items */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-2 scrollbar-thin flex flex-col">
        {filtered.length === 0 ? (
          <p className={`text-center text-gray-400 py-4 font-medium ${compact ? 'text-[11px]' : 'text-[12px]'}`}>Tidak ditemukan</p>
        ) : (
          filtered.map((item, idx) => (
            <button
              key={item === '' ? `__all__-${id}` : `${item}-${idx}`}
              type="button"
              role="option"
              aria-selected={value === item}
              data-item
              onClick={() => select(item)}
              className={`
                text-left px-4 ${compact ? 'py-2.5 text-[11px]' : 'py-3 text-[12px]'} font-bold rounded-lg transition-all mb-0.5 whitespace-nowrap min-w-full w-max
                ${value === item
                  ? 'bg-emerald-50 text-emerald-700'
                  : idx === focusedIndex
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
              title={labelFor(item)}
            >
              {labelFor(item)}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${triggerWidth} ${className} ${open ? 'z-[50]' : ''}`}
      data-dropdown-id={id}
    >
      {label && (
        <span className={`block font-semibold text-gray-500 ml-1 tracking-tight select-none ${compact ? 'text-[11px] mb-1' : 'text-[13px] mb-2'}`}>
          {label}
        </span>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`dropdown-panel-${id}`}
        className={`
          relative w-full ${compact ? 'h-10 pl-9 pr-9 text-[11px]' : 'h-10 pl-10 pr-10 text-[12px]'} rounded-lg border transition-all font-bold flex items-center justify-between shadow-sm
          ${open
            ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/5'
            : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'}
        `}
      >
        <span className="truncate text-left" title={displayLabel}>
          {displayLabel}
        </span>
        <div className="absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none">
          {icon ?? <Search size={16} className={value ? 'text-emerald-600' : 'text-gray-400'} />}
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none">
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Panel */}
      {open && (
        usePortal ? (
          <Portal>
            {panelContent}
          </Portal>
        ) : (
          panelContent
        )
      )}
    </div>
  );
}
