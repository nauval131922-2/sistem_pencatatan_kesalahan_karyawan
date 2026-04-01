export type ScrapedPeriod = {
  start: string;
  end: string;
  startRaw: string;
  endRaw: string;
  fetchedOn: string;
};

type PersistedScraperState = {
  startDate: string;
  endDate: string;
  sessionDate?: string;
  fetchedOn?: string;
};

type HydrateScraperPeriodOptions = {
  stateKey: string;
  periodKey?: string;
};

function getTodayStorageDate() {
  return new Date().toLocaleDateString('en-CA');
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isSameDayPeriod(dateTag?: string) {
  return dateTag === getTodayStorageDate();
}

export function getDefaultScraperDateRange() {
  const startDate = new Date(2026, 0, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export function buildScrapedPeriod(startDate: Date, endDate: Date): ScrapedPeriod {
  return {
    start: startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    end: endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    startRaw: startDate.toISOString(),
    endRaw: endDate.toISOString(),
    fetchedOn: getTodayStorageDate(),
  };
}

export function hydrateScraperPeriod({ stateKey, periodKey }: HydrateScraperPeriodOptions) {
  const defaults = getDefaultScraperDateRange();
  let startDate = defaults.startDate;
  let endDate = defaults.endDate;
  let scrapedPeriod: ScrapedPeriod | null = null;

  if (periodKey) {
    const savedPeriod = safeParse<ScrapedPeriod>(localStorage.getItem(periodKey));
    if (savedPeriod && isSameDayPeriod(savedPeriod.fetchedOn)) {
      scrapedPeriod = savedPeriod;
      if (savedPeriod.startRaw) startDate = new Date(savedPeriod.startRaw);
      if (savedPeriod.endRaw) endDate = new Date(savedPeriod.endRaw);
    }
  }

  const savedState = safeParse<PersistedScraperState>(localStorage.getItem(stateKey));
  const savedDateTag = savedState?.fetchedOn || savedState?.sessionDate;
  if (savedState && isSameDayPeriod(savedDateTag)) {
    if (savedState.startDate) startDate = new Date(savedState.startDate);
    if (savedState.endDate) endDate = new Date(savedState.endDate);
  }

  return { startDate, endDate, scrapedPeriod };
}

export function persistScraperPeriod(
  { stateKey, periodKey }: HydrateScraperPeriodOptions,
  startDate: Date,
  endDate: Date
) {
  const fetchedOn = getTodayStorageDate();
  const state: PersistedScraperState = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sessionDate: fetchedOn,
    fetchedOn,
  };
  localStorage.setItem(stateKey, JSON.stringify(state));

  const period = buildScrapedPeriod(startDate, endDate);
  if (periodKey) {
    localStorage.setItem(periodKey, JSON.stringify(period));
  }

  return period;
}
