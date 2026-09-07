import { describe, it, expect } from 'vitest';
import {
  getDatePresetRange,
  detectActiveDatePreset,
  getDefaultLogRange,
  formatDateStrId,
} from '@/lib/activity-log-utils';

describe('getDatePresetRange', () => {
  it('today returns same from/to', () => {
    const r = getDatePresetRange('today');
    expect(r.from).toBe(r.to);
    expect(r.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('7d spans 6 days before today', () => {
    const r = getDatePresetRange('7d');
    expect(r.to).toBe(getDatePresetRange('today').to);
    // from should be 6 days earlier (YYYY-MM-DD diff)
    const from = new Date(`${r.from}T12:00:00+07:00`);
    const to = new Date(`${r.to}T12:00:00+07:00`);
    const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000);
    expect(diffDays).toBe(6);
  });

  it('month starts at day 01 of current month', () => {
    const r = getDatePresetRange('month');
    expect(r.from.endsWith('-01')).toBe(true);
    expect(r.to).toBe(getDatePresetRange('today').to);
  });

  it('last_month is a full previous month', () => {
    const r = getDatePresetRange('last_month');
    expect(r.from.endsWith('-01')).toBe(true);
    // to must be valid last day of that month (<=28..31)
    const [, , day] = r.to.split('-').map(Number);
    expect(day).toBeGreaterThanOrEqual(28);
    expect(day).toBeLessThanOrEqual(31);
    // month must be one before current (handle year boundary)
    const now = new Date();
    const expectedPrev = now.getMonth() === 0 ? 12 : now.getMonth();
    const actualMonth = Number(r.to.split('-')[1]);
    expect(actualMonth).toBe(expectedPrev);
  });
});

describe('detectActiveDatePreset', () => {
  it('round-trips every preset', () => {
    for (const key of ['today', '7d', 'month', 'last_month'] as const) {
      const r = getDatePresetRange(key);
      const detected = detectActiveDatePreset(r.from, r.to);
      // Pada tanggal ke-7 dalam bulan, rentang 'month' dan '7d' bernilai identik (01 s.d. 07).
      // Fungsi deteksi akan mengembalikan preset yang muncul lebih dahulu.
      if (detected !== key) {
        const detectedRange = detected ? getDatePresetRange(detected) : null;
        expect(detectedRange).toEqual(r);
      } else {
        expect(detected).toBe(key);
      }
    }
  });

  it('returns null for arbitrary range', () => {
    expect(detectActiveDatePreset('2026-01-15', '2026-02-20')).toBeNull();
  });

  it('returns null for partial match', () => {
    const r = getDatePresetRange('month');
    expect(detectActiveDatePreset(r.from, '2030-01-01')).toBeNull();
  });
});

describe('getDefaultLogRange', () => {
  it('returns from=first-of-month to=today', () => {
    const r = getDefaultLogRange();
    expect(r.from.endsWith('-01')).toBe(true);
    expect(r.to).toBe(getDatePresetRange('today').to);
  });
});

describe('formatDateStrId', () => {
  it('formats YYYY-MM-DD to Indonesian date', () => {
    const out = formatDateStrId('2026-03-18');
    expect(out).toMatch(/18\s+Mar\s+2026/);
  });
});
