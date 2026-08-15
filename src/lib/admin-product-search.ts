import { z } from "zod";

export const ADMIN_PRODUCT_STATUS_FILTERS = ["all", "active", "hidden", "featured"] as const;
export type AdminProductStatusFilter = (typeof ADMIN_PRODUCT_STATUS_FILTERS)[number];

/** URL search for /admin/products — defaults omitted for clean URLs. */
export const adminProductSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  status: z.enum(["active", "hidden", "featured"]).optional().catch(undefined),
  categories: z
    .union([z.string().min(1), z.array(z.string().min(1))])
    .optional()
    .catch(undefined),
});

export type AdminProductSearch = z.infer<typeof adminProductSearchSchema>;

export function statusFromSearch(status: AdminProductSearch["status"]): AdminProductStatusFilter {
  return status ?? "all";
}

export function categoriesFromSearch(categories: AdminProductSearch["categories"]): Set<string> {
  if (!categories) return new Set();
  if (Array.isArray(categories)) return new Set(categories);
  return new Set([categories]);
}

export function categoriesToSearchParam(selected: Set<string>): string | string[] | undefined {
  if (selected.size === 0) return undefined;
  const values = [...selected].sort();
  return values.length === 1 ? values[0] : values;
}

/** Build a clean search object (omit empty/default values). */
export function buildAdminProductSearch(input: {
  q?: string;
  status?: AdminProductStatusFilter;
  categories?: Set<string> | Iterable<string>;
}): AdminProductSearch {
  const q = input.q?.trim() || undefined;
  const status = input.status && input.status !== "all" ? input.status : undefined;
  const categorySet =
    input.categories instanceof Set ? input.categories : new Set(input.categories ?? []);
  const categories = categoriesToSearchParam(categorySet);
  return {
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(categories ? { categories } : {}),
  };
}

export function adminProductSearchHasFilters(search: AdminProductSearch): boolean {
  return Boolean(search.q?.trim()) || Boolean(search.status) || Boolean(search.categories);
}

export function clearAdminProductSearch(): AdminProductSearch {
  return {};
}
