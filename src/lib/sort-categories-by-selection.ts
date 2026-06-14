/** Active/selected categories first; original order preserved within each group. */
export function sortCategoriesWithSelectedFirst<T extends { id: string }>(
  categories: readonly T[],
  selected: ReadonlySet<string>,
): T[] {
  return [...categories].sort((a, b) => {
    const aSelected = selected.has(a.id);
    const bSelected = selected.has(b.id);
    if (aSelected === bSelected) return 0;
    return aSelected ? -1 : 1;
  });
}
