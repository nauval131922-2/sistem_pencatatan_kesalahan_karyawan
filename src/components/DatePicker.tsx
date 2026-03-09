'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

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
  value?: Date;
}

export default function DatePicker({ name, required, label, onChange, value }: DatePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => setViewMode('days'), 200);
    }
  }, [open]);

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
    ? value.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const valueStr = value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
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
        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-sm font-semibold text-slate-800 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-0">
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
                  h-8 w-8 mx-auto rounded text-sm transition-colors flex items-center justify-center
                  ${sel ? 'bg-[#337ab7] text-white' : ''}
                  ${!sel && tod && !dim ? 'bg-slate-100 text-slate-800 font-semibold' : ''}
                  ${!sel && !tod && dim ? 'text-slate-400 font-light' : ''}
                  ${!sel && !tod && !dim ? 'text-slate-700 hover:bg-slate-200' : ''}
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
      <div className="grid grid-cols-4 gap-2 py-2">
        {MONTHS_SHORT.map((m, i) => {
          const sel = activeMonth === i;
          return (
            <button
              key={m}
              type="button"
              onClick={() => { setViewMonth(i); setViewMode('days'); }}
              className={`
                h-10 rounded text-sm transition-colors
                ${sel ? 'bg-[#337ab7] text-white' : 'text-slate-800 hover:bg-slate-200'}
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
      <div className="grid grid-cols-4 gap-2 py-2">
        {yearsGrid.map((y, i) => {
          const sel = activeY === y;
          const isEdge = i === 0 || i === 11;
          return (
            <button
              key={y}
              type="button"
              onClick={() => { setViewYear(y); setViewMode('months'); }}
              className={`
                h-10 rounded text-sm transition-colors
                ${sel ? 'bg-[#337ab7] text-white' : ''}
                ${!sel && isEdge ? 'text-slate-400 bg-slate-100 font-light hover:bg-slate-200' : ''}
                ${!sel && !isEdge ? 'text-slate-800 hover:bg-slate-200' : ''}
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
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      )}
      <input type="hidden" name={name} value={valueStr} required={required} />

      <div
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm cursor-pointer flex items-center justify-between hover:border-emerald-500 transition-all shadow-sm"
      >
        <span className={formatted ? 'text-slate-700 font-medium' : 'text-slate-400'}>
          {formatted || 'Pilih tanggal...'}
        </span>
        <Calendar size={14} className="text-slate-400 group-hover:text-emerald-500" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded shadow-[0_3px_12px_rgba(0,0,0,0.15)] p-2 w-[260px] font-sans">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button type="button" onClick={prevView} className="px-2 py-1 rounded hover:bg-slate-200 text-slate-800 text-lg font-bold transition-colors leading-none">
              &laquo;
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (viewMode === 'days') setViewMode('months');
                else if (viewMode === 'months') setViewMode('years');
              }}
              className="text-[15px] font-semibold text-slate-800 hover:bg-slate-100 px-4 py-1.5 rounded transition-colors tracking-tight"
              disabled={viewMode === 'years'}
            >
              {viewMode === 'days' && `${MONTHS_ID[viewMonth]} ${viewYear}`}
              {viewMode === 'months' && `${viewYear}`}
              {viewMode === 'years' && `${startDecade}-${startDecade + 9}`}
            </button>
            <button type="button" onClick={nextView} className="px-2 py-1 rounded hover:bg-slate-200 text-slate-800 text-lg font-bold transition-colors leading-none">
              &raquo;
            </button>
          </div>

          {/* Body */}
          <div className="px-1">
            {viewMode === 'days' && renderDays()}
            {viewMode === 'months' && renderMonths()}
            {viewMode === 'years' && renderYears()}
          </div>
        </div>
      )}
    </div>
  );
}
