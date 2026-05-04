'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';

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
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // All items including the "all" entry
  const allItems = ['', ...items];
  const filtered = allItems.filter(i =>
    (i === '' ? allLabel : i).toLowerCase().includes(query.toLowerCase())
  );

  const displayLabel = value === '' ? (placeholder ?? allLabel) : value;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search when opened, init focused index to current selection
  useEffect(() => {
    if (open) {
      setQuery('');
      // Find where the current value sits so first ↓ moves to the next item
      const idx = ['', ...items].findIndex(item => item === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
      setTimeout(() => searchRef.current?.focus(), 0);
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

  return (
    <div
      ref={containerRef}
      className={`relative ${triggerWidth} ${className}`}
      data-dropdown-id={id}
    >
      {label && (
        <span className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">
          {label}
        </span>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`dropdown-panel-${id}`}
        className={`
          relative w-full h-11 pl-10 pr-10 rounded-lg border transition-all text-[13px] font-bold flex items-center justify-between shadow-sm
          ${open
            ? 'bg-white border-green-500 ring-4 ring-green-500/5'
            : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'}
        `}
      >
        <span className="truncate text-left" title={displayLabel}>
          {displayLabel}
        </span>
        <div className="absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none">
          {icon ?? <Search size={16} className={value ? 'text-green-600' : 'text-gray-400'} />}
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
        <div
          id={`dropdown-panel-${id}`}
          role="listbox"
          aria-label={label}
          className={`absolute top-[calc(100%+8px)] left-0 ${panelWidth ?? triggerWidth} bg-white border border-gray-100 rounded-xl shadow-md shadow-green-900/10 py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[350px]`}
          style={{ minWidth: '220px' }}
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
                onChange={e => { setQuery(e.target.value); setFocusedIndex(-1); }}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-gray-50 border border-transparent focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-lg transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Items */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-2 scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="text-center text-[12px] text-gray-400 py-4 font-medium">Tidak ditemukan</p>
            ) : (
              filtered.map((item, idx) => (
                <button
                  key={item === '' ? '__all__' : `${item}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={value === item}
                  data-item
                  onClick={() => select(item)}
                  className={`
                    w-full text-left px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-0.5
                    ${value === item
                      ? 'bg-green-50 text-green-700'
                      : idx === focusedIndex
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                  title={item === '' ? allLabel : item}
                >
                  {item === '' ? allLabel : item}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
