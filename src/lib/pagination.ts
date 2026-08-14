export type PaginationItem = number | "ellipsis";

/**
 * Returns a compact, stable set of page controls. The first, last and current
 * pages are always present; nearby pages are included according to `siblings`.
 */
export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblings = 1,
): PaginationItem[] {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);
  const radius = Math.max(0, Math.floor(siblings));

  if (total <= radius * 2 + 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total]);
  for (let page = current - radius; page <= current + radius; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous > 1) {
      if (page - previous === 2) items.push(previous + 1);
      else items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}
