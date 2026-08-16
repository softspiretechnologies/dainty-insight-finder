/** Product slug helpers — pure, safe for client and server. */

export function slugifyProductName(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "product";
}

/**
 * Allocate unique slugs for a list of names given already-used slugs.
 * Mutates a local copy of `used`; does not mutate the input Set.
 */
export function allocateUniqueProductSlugs(
  names: string[],
  existingSlugs: Iterable<string> = [],
): string[] {
  const used = new Set([...existingSlugs].map((slug) => slug.trim().toLowerCase()).filter(Boolean));
  const out: string[] = [];

  for (const name of names) {
    const base = slugifyProductName(name).slice(0, 120);
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      const suffix = `-${n}`;
      candidate = `${base.slice(0, Math.max(1, 128 - suffix.length))}${suffix}`;
      n += 1;
    }
    used.add(candidate);
    out.push(candidate);
  }

  return out;
}

export function duplicateProductDisplayName(originalName: string): string {
  const trimmed = originalName.trim() || "Product";
  const withCopy = `${trimmed} Copy`;
  return withCopy.slice(0, 256);
}
