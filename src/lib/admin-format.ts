/** Human-friendly relative dates for admin lists. Uses Intl only. */

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatAdminDateTime(iso: string | Date, now = new Date()) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";

  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  const today = startOfLocalDay(now);
  const target = startOfLocalDay(date);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - target.getTime()) / dayMs);

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);

  return `${day}, ${time}`;
}

export function formatEnquiryBadgeCount(count: number) {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}
