export const MAX_HOMEPAGE_FEATURED = 6;

export function featuredDisabledState() {
  return { featuredOnHomepage: false as const, homepageSortOrder: 0 };
}

export function wantsHomepageFeature(isActive: boolean, featuredOnHomepage: boolean) {
  return isActive && featuredOnHomepage;
}

export function canAddHomepageFeature(
  currentCountExcludingSelf: number,
  max = MAX_HOMEPAGE_FEATURED,
) {
  return currentCountExcludingSelf < max;
}

export function homepageFeaturedLimitError(max = MAX_HOMEPAGE_FEATURED) {
  return `Maximum ${max} products can be featured on the homepage. Unfeature another product first.`;
}

export function assertHomepageFeaturedCount(
  currentCountExcludingSelf: number,
  max = MAX_HOMEPAGE_FEATURED,
) {
  if (!canAddHomepageFeature(currentCountExcludingSelf, max)) {
    throw new Error(homepageFeaturedLimitError(max));
  }
}
