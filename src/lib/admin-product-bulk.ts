import type { CategoryId } from "@/types/catalog";
import type { BulkProductQuickCreateInput } from "@/lib/admin-schemas";
import { allocateUniqueProductSlugs } from "@/lib/product-slug";

export type BulkQuickProductInsertRow = {
  slug: string;
  name: string;
  categoryId: CategoryId;
  blurb: string;
  description: string;
  details: string[];
  priceFrom: string | null;
  isActive: false;
  featuredOnHomepage: false;
  homepageSortOrder: 0;
};

/** Map validated bulk items + reserved slugs into hidden draft insert rows (no images yet). */
export function buildBulkQuickProductInsertRows(
  items: BulkProductQuickCreateInput["items"],
  existingSlugs: Iterable<string>,
): BulkQuickProductInsertRow[] {
  const slugs = allocateUniqueProductSlugs(
    items.map((item) => item.name),
    existingSlugs,
  );

  return items.map((item, index) => ({
    slug: slugs[index]!,
    name: item.name.trim(),
    categoryId: item.categoryId as CategoryId,
    blurb: item.name.trim(),
    description: item.name.trim(),
    details: [] as string[],
    priceFrom: item.priceFrom?.trim() || null,
    isActive: false as const,
    featuredOnHomepage: false as const,
    homepageSortOrder: 0 as const,
  }));
}
