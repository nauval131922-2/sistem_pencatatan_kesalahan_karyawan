export type ServerScrapedPeriod = {
  start: string;
  end: string;
};

export function getScrapedPeriodSettingKey(lastScrapeKey: string) {
  return `${lastScrapeKey}_period`;
}

export function encodeScrapedPeriod(period: ServerScrapedPeriod) {
  return JSON.stringify(period);
}

export function parseScrapedPeriod(rawValue?: string | null): ServerScrapedPeriod | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<ServerScrapedPeriod>;
    if (!parsed.start || !parsed.end) return null;
    return {
      start: parsed.start,
      end: parsed.end,
    };
  } catch {
    return null;
  }
}
