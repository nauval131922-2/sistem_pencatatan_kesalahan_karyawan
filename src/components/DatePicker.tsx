'use client';

import React, { useState, useRef, useEffect } from 'react';
import Portal from './Portal';
import { Calendar, X } from 'lucide-react';

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];
const DAYS_SHORT = ['Sn','Sl','Ra','Ka','Ju','Sa','Mg'];

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  let startDow = first.getDay(); // 0=Sun
  startDow = (startDow + 6) % 7; // Mon=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; month: 'prev' | 'cur' | 'next' }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: 'prev' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'cur' });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: next++, month: 'next' });
  }
  return cells;
}

interface DatePickerProps {
  name: string;
  required?: boolean;
  label?: string;
  onChange?: (date: Date) => void;
  value?: Date | null;
  customTrigger?: (toggle: () => void) => React.ReactNode;
  popupAlign?: 'left' | 'right';
  selectionMode?: 'day' | 'month';
}

export default function DatePicker({ name, required, label, onChange, value, customTrigger, popupAlign = 'left', selectionMode = 'day' }: DatePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>(selectionMode === 'month' ? 'months' : 'days');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => setViewMode(selectionMode === 'month' ? 'months' : 'days'), 200);
    } else {
      if (selectionMode === 'month') setViewMode('months');
    }
  }, [open, selectionMode]);

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setOpen(!open);
  };

  const prevView = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else if (viewMode === 'months') {
      setViewYear(y => y - 1);
    } else {
      setViewYear(y => y - 10);
    }
  };

  const nextView = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else if (viewMode === 'months') {
      setViewYear(y => y + 1);
    } else {
      setViewYear(y => y + 10);
    }
  };

  const selectDay = (cell: { day: number; month: 'prev' | 'cur' | 'next' }) => {
    let y = viewYear, m = viewMonth;
    if (cell.month === 'prev') { m -= 1; if (m < 0) { m = 11; y -= 1; } }
    if (cell.month === 'next') { m += 1; if (m > 11) { m = 0; y += 1; } }
    const d = new Date(y, m, cell.day);
    setViewYear(y);
    setViewMonth(m);
    setOpen(false);
    if (onChange) {
      onChange(d);
    }
  };

  const isSelectedDay = (cell: { day: number; month: string }) => {
    if (!value || cell.month !== 'cur') return false;
    return value.getFullYear() === viewYear &&
      value.getMonth() === viewMonth &&
      value.getDate() === cell.day;
  };
  const isToday = (cell: { day: number; month: string }) => {
    if (cell.month !== 'cur') return false;
    return today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === cell.day;
  };

  const formatted = value
    ? (selectionMode === 'month'
        ? `${MONTHS_SHORT[value.getMonth()]} ${value.getFullYear()}`
        : value.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }))
    : '';

  const valueStr = value
    ? (selectionMode === 'month'
        ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
        : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`)
    : '';

  const startDecade = Math.floor(viewYear / 10) * 10;
  const yearsGrid: number[] = [];
  for (let i = -1; i <= 10; i++) {
    yearsGrid.push(startDecade + i);
  }

  const renderDays = () => {
    const cells = getCalendarDays(viewYear, viewMonth);
    return (
      <>
        <div className="grid grid-cols-7 mb-2 border-b border-gray-50 pb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const sel = isSelectedDay(cell);
            const tod = isToday(cell);
            const dim = cell.month !== 'cur';
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(cell)}
                className={`
                  h-8 w-8 mx-auto rounded-lg text-[13px] font-medium transition-all flex items-center justify-center
                  ${sel ? 'bg-green-600 text-white shadow-sm shadow-green-100 font-bold' : ''}
                  ${!sel && tod && !dim ? 'bg-green-50 text-green-600 font-bold border border-green-100' : ''}
                  ${!sel && !tod && dim ? 'text-gray-300 font-normal' : ''}
                  ${!sel && !tod && !dim ? 'text-gray-600 hover:bg-gray-50' : ''}
                `}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderMonths = () => {
    const activeMonth = value && value.getFullYear() === viewYear ? value.getMonth() : -1;
    return (
      <div className="grid grid-cols-3 gap-2 py-2">
        {MONTHS_SHORT.map((m, i) => {
          const sel = activeMonth === i;
          return (
            <button
              key={m}
              type="button"
              onClick={() => { 
                if (selectionMode === 'month') {
                  const d = new Date(viewYear, i, 1);
                  setViewMonth(i);
                  setOpen(false);
                  if (onChange) onChange(d);
                } else {
                  setViewMonth(i); 
                  setViewMode('days'); 
                }
              }}
              className={`
                h-12 rounded-lg text-[13px] font-bold transition-all border
                ${sel ? 'bg-green-600 text-white border-transparent shadow-sm shadow-green-100' : 'text-gray-600 border-gray-50 hover:bg-gray-50'}
              `}
            >
              {m}
            </button>
          );
        })}
      </div>
    );
  };

  const renderYears = () => {
    const activeY = value ? value.getFullYear() : -1;
    return (
      <div className="grid grid-cols-3 gap-2 py-2">
        {yearsGrid.map((y, i) => {
          const sel = activeY === y;
          const isEdge = i === 0 || i === 11;
          return (
            <button
              key={y}
              type="button"
              onClick={() => { setViewYear(y); setViewMode('months'); }}
              className={`
                h-12 rounded-lg text-[13px] font-bold transition-all border
                ${sel ? 'bg-green-600 text-white border-transparent shadow-sm shadow-green-100' : ''}
                ${!sel && isEdge ? 'text-gray-300 bg-gray-50 border-transparent hover:bg-gray-100' : ''}
                ${!sel && !isEdge ? 'text-gray-600 border-gray-50 hover:bg-gray-50' : ''}
              `}
            >
              {y}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 ml-1">{label}</label>
      )}
      <input type="hidden" name={name} value={valueStr} required={required} />

      <div ref={triggerRef} onClick={toggleOpen}>
        {customTrigger ? customTrigger(toggleOpen) : (
          <div
            className="w-full h-11 bg-white border border-gray-100 rounded-lg px-2.5 sm:px-4 text-xs sm:text-sm cursor-pointer flex items-center justify-between shadow-sm transition-all hover:border-green-500 group"
          >
            <span className={`font-bold sm:font-semibold whitespace-nowrap ${formatted ? 'text-gray-800' : 'text-gray-300'}`}>
              {formatted || 'Pilih tanggal...'}
            </span>
            <Calendar size={16} className="text-gray-300 group-hover:text-green-500 transition-colors ml-1 shrink-0" />
          </div>
        )}
      </div>

      {open && (
        <Portal>
          <div 
            ref={ref}
            style={{ 
              position: 'absolute', 
              top: `${coords.top + 8}px`, 
              left: popupAlign === 'right' ? `${coords.left + coords.width - 280}px` : `${coords.left}px`,
              zIndex: 9999
            }}
            className="bg-white border border-gray-100 rounded-xl shadow-2xl p-4 w-[280px] animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <button type="button" onClick={prevView} className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all flex items-center justify-center font-bold">
                ‹
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (viewMode === 'days') setViewMode('months');
                  else if (viewMode === 'months') setViewMode('years');
                }}
                className="text-[13px] font-bold text-gray-800 hover:text-green-600 transition-all px-2"
                disabled={viewMode === 'years'}
              >
                {viewMode === 'days' && `${MONTHS_ID[viewMonth]} ${viewYear}`}
                {viewMode === 'months' && `${viewYear}`}
                {viewMode === 'years' && `${startDecade}-${startDecade + 9}`}
              </button>
              <button type="button" onClick={nextView} className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all flex items-center justify-center font-bold">
                ›
              </button>
            </div>

            <div className="px-1">
              {viewMode === 'days' && renderDays()}
              {viewMode === 'months' && renderMonths()}
              {viewMode === 'years' && renderYears()}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

















