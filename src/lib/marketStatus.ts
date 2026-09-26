/**
 * Centralized U.S. stock market status logic.
 * All time calculations use America/New_York (Eastern Time).
 * Import getMarketStatus() from here — never duplicate this logic.
 */

// ── NYSE full-day holidays ────────────────────────────────────────────────────
const HOLIDAYS = new Set([
  // 2025
  '2025-01-01', // New Year's Day
  '2025-01-20', // MLK Day
  '2025-02-17', // Presidents' Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving Day
  '2025-12-25', // Christmas Day

  // 2026
  '2026-01-01', // New Year's Day
  '2026-01-19', // MLK Day
  '2026-02-16', // Presidents' Day
  '2026-04-03', // Good Friday
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day observed (Jul 4 falls on Saturday)
  '2026-09-07', // Labor Day
  '2026-11-26', // Thanksgiving Day
  '2026-12-25', // Christmas Day

  // 2027
  '2027-01-01', // New Year's Day
  '2027-01-18', // MLK Day
  '2027-02-15', // Presidents' Day
  '2027-03-26', // Good Friday
  '2027-05-31', // Memorial Day
  '2027-06-18', // Juneteenth observed (Jun 19 falls on Saturday)
  '2027-07-05', // Independence Day observed (Jul 4 falls on Sunday)
  '2027-09-06', // Labor Day
  '2027-11-25', // Thanksgiving Day
  '2027-12-24', // Christmas observed (Dec 25 falls on Saturday)
]);

// ── NYSE early-close days (market closes at 1:00 PM ET) ──────────────────────
const EARLY_CLOSE = new Set([
  '2025-07-03', // Day before Independence Day
  '2025-11-28', // Black Friday
  '2025-12-24', // Christmas Eve
  '2026-07-02', // Day before Independence Day observed
  '2026-11-27', // Black Friday
  '2026-12-24', // Christmas Eve
  '2027-11-26', // Black Friday
  '2027-12-23', // Christmas Eve (observed)
]);

// ── Constants ─────────────────────────────────────────────────────────────────
const OPEN_MINS = 9 * 60 + 30; // 9:30 AM
const CLOSE_MINS = 16 * 60; // 4:00 PM
const EARLY_MINS = 13 * 60; // 1:00 PM (early close)
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface MarketStatus {
  open: boolean;
  label: string; // "Market Open" | "Market Closed"
  sub: string; // supporting text e.g. "Closes at 4:00 PM ET"
}

// ── Date helpers (all operate on YYYY-MM-DD strings to avoid DST issues) ──────

/** Format a Date as "YYYY-MM-DD" in Eastern Time */
function etDateStr(date: Date): string {
  // en-CA locale produces YYYY-MM-DD natively
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(date);
}

/** Add N days to a YYYY-MM-DD string using UTC arithmetic (no DST drift) */
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().split('T')[0];
}

/** Day of week (0=Sun…6=Sat) for a YYYY-MM-DD string */
function dowOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** True if the given date string is a regular NYSE trading day */
function isTradingDay(dateStr: string): boolean {
  const dow = dowOf(dateStr);
  return dow !== 0 && dow !== 6 && !HOLIDAYS.has(dateStr);
}

/** "Opens tomorrow at 9:30 AM ET" / "Opens Monday at 9:30 AM ET" etc. */
function nextOpenText(todayStr: string): string {
  const tomorrowStr = addDays(todayStr, 1);
  for (let i = 1; i <= 14; i++) {
    const candidate = addDays(todayStr, i);
    if (isTradingDay(candidate)) {
      if (candidate === tomorrowStr) return 'Opens tomorrow at 9:30 AM ET';
      return `Opens ${DAY_NAMES[dowOf(candidate)]} at 9:30 AM ET`;
    }
  }
  return 'Opens next trading day at 9:30 AM ET';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns the current U.S. stock market status in Eastern Time.
 * Pass a custom `now` for testing; defaults to the current moment.
 */
export function getMarketStatus(now: Date = new Date()): MarketStatus {
  // Convert to ET by re-parsing the locale string — getHours/getDay then reflect ET
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dateStr = etDateStr(now);
  const timeMins = etNow.getHours() * 60 + etNow.getMinutes();
  const dow = etNow.getDay();

  // Weekend
  if (dow === 0 || dow === 6) {
    return { open: false, label: 'Market Closed', sub: nextOpenText(dateStr) };
  }

  // Full-day holiday
  if (HOLIDAYS.has(dateStr)) {
    return {
      open: false,
      label: 'Market Closed',
      sub: `Closed for holiday · ${nextOpenText(dateStr)}`,
    };
  }

  // Before open
  if (timeMins < OPEN_MINS) {
    return { open: false, label: 'Market Closed', sub: 'Opens at 9:30 AM ET' };
  }

  // Early-close day
  const earlyClose = EARLY_CLOSE.has(dateStr);
  const closeMins = earlyClose ? EARLY_MINS : CLOSE_MINS;
  const closeLabel = earlyClose ? '1:00 PM ET (early close)' : '4:00 PM ET';

  // Market open
  if (timeMins < closeMins) {
    return { open: true, label: 'Market Open', sub: `Closes at ${closeLabel}` };
  }

  // After close
  return { open: false, label: 'Market Closed', sub: nextOpenText(dateStr) };
}

/** User-facing copy when blocking trades outside session (keep in sync with API). */
export const MARKET_CLOSED_TRADE_MESSAGE =
  "You can't place a trade right now because the market is closed. Please come back when it is open.";

/** True when U.S. regular session is open (same rules as getMarketStatus). */
export function isMarketOpen(now: Date = new Date()): boolean {
  return getMarketStatus(now).open;
}
