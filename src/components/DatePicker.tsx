'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const DAYS_SHORT = ['Sn','Sl','Ra','Ka','Ju','Sa','Mi'];

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  // Monday-based week: 0=Mon ... 6=Sun
  let startDow = first.getDay(); // 0=Sun
  startDow = (startDow + 6) % 7;  // convert to Mon=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; month: 'prev' | 'cur' | 'next' }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: 'prev' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'cur' });
  }
  // fill to complete last row (multiple of 7)
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
}

export default function DatePicker({ name, required, label, onChange }: DatePickerProps) {
  const today = new Date();
  const [selected, setSelected] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cells = getCalendarDays(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (cell: { day: number; month: 'prev' | 'cur' | 'next' }) => {
    let y = viewYear, m = viewMonth;
    if (cell.month === 'prev') { m -= 1; if (m < 0) { m = 11; y -= 1; } }
    if (cell.month === 'next') { m += 1; if (m > 11) { m = 0; y += 1; } }
    const d = new Date(y, m, cell.day);
    setSelected(d);
    setViewYear(y);
    setViewMonth(m);
    setOpen(false);
    if (onChange) {
      onChange(d);
    }
  };

  const isSelected = (cell: { day: number; month: string }) => {
    if (!selected || cell.month !== 'cur') return false;
    return selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === cell.day;
  };
  const isToday = (cell: { day: number; month: string }) => {
    if (cell.month !== 'cur') return false;
    return today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === cell.day;
  };

  const formatted = selected
    ? selected.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  // yyyy-mm-dd for form value
  const valueStr = selected
    ? `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`
    : '';

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{label}</label>
      )}
      <input type="hidden" name={name} value={valueStr} required={required} />

      <div
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:border-emerald-400 transition-colors"
      >
        <span className={formatted ? 'text-slate-800' : 'text-slate-400'}>
          {formatted || 'Pilih tanggal...'}
        </span>
        <Calendar size={15} className="text-emerald-500 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              {MONTHS_ID[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, i) => {
              const sel = isSelected(cell);
              const tod = isToday(cell);
              const dim = cell.month !== 'cur';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(cell)}
                  className={`
                    h-8 w-full rounded-lg text-xs font-medium transition-colors
                    ${sel ? 'bg-emerald-500 text-white' : ''}
                    ${!sel && tod ? 'bg-emerald-50 text-emerald-600 border border-emerald-300' : ''}
                    ${!sel && !tod && dim ? 'text-slate-300 hover:bg-slate-50' : ''}
                    ${!sel && !tod && !dim ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-600' : ''}
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
