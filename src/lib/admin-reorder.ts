export type SortableItem = {
  id: string;
  sortOrder: number;
};

export type MoveDirection = "up" | "down";

/**
 * Returns a full list of { id, sortOrder } after moving one item up/down.
 * Uses stable sort by sortOrder then id. Returns null if move is invalid.
 */
export function planReorderMove(
  items: SortableItem[],
  id: string,
  direction: MoveDirection,
): SortableItem[] | null {
  const sorted = [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  const index = sorted.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sorted.length) return null;

  const next = [...sorted];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved!);
  return next.map((item, order) => ({ id: item.id, sortOrder: order }));
}

export function canMoveItem(items: SortableItem[], id: string, direction: MoveDirection) {
  return planReorderMove(items, id, direction) !== null;
}
