/** Human-friendly relative dates for admin lists. Uses Intl only. */

/** Kerala business timezone — keeps SSR and browser text identical. */
export const ADMIN_DISPLAY_TIMEZONE = "Asia/Kolkata";

function zonedYmd(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function calendarDaysBetween(later: Date, earlier: Date, timeZone: string) {
  const laterUtc = Date.parse(`${zonedYmd(later, timeZone)}T12:00:00.000Z`);
  const earlierUtc = Date.parse(`${zonedYmd(earlier, timeZone)}T12:00:00.000Z`);
  return Math.round((laterUtc - earlierUtc) / (24 * 60 * 60 * 1000));
}

export function formatAdminDateTime(iso: string | Date, now = new Date()) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";

  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: ADMIN_DISPLAY_TIMEZONE,
  }).format(date);

  const diffDays = calendarDaysBetween(now, date, ADMIN_DISPLAY_TIMEZONE);

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;

  const sameYear =
    zonedYmd(date, ADMIN_DISPLAY_TIMEZONE).slice(0, 4) ===
    zonedYmd(now, ADMIN_DISPLAY_TIMEZONE).slice(0, 4);
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: ADMIN_DISPLAY_TIMEZONE,
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);

  return `${day}, ${time}`;
}

/** Copyright year in site timezone (SSR-safe). */
export function formatSiteCopyrightYear(now = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: ADMIN_DISPLAY_TIMEZONE,
    year: "numeric",
  }).format(now);
}

export function formatEnquiryBadgeCount(count: number) {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}
