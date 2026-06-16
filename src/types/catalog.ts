export type CategoryId =
  | "hampers"
  | "bouquets"
  | "invitations"
  | "engagement"
  | "frames"
  | "albums"
  | "calligraphy"
  | "celebrations";

export type CatalogCategory = {
  id: CategoryId;
  label: string;
  blurb: string;
  image: string;
};

export type CatalogProduct = {
  id?: number;
  slug: string;
  name: string;
  category: CategoryId;
  blurb: string;
  description: string;
  details: string[];
  image: string;
  priceFrom?: string;
};

export type SiteSettingsData = {
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  instagramHandle: string;
  founder: string;
  location: string;
  servicesIntro: string;
  servicesFooterTitle: string;
  servicesFooterBlurb: string;
};

export type ServiceId =
  | "save-the-date-shoots"
  | "birthday-surprise-planning"
  | "proposal-setups"
  | "couple-shoots"
  | "reels-memory-videos";

export type CatalogService = {
  id: ServiceId;
  title: string;
  blurb: string;
  bullets: string[];
  image: string;
  sortOrder: number;
};

export type ServicesPageData = {
  intro: string;
  footerTitle: string;
  footerBlurb: string;
  services: CatalogService[];
};

export type Testimonial = {
  id: number;
  quote: string;
  customerName: string;
  location: string;
  context: string;
  sortOrder: number;
};

export type TestimonialsSectionData = {
  heading: string;
  items: Testimonial[];
};

export type HomepageGalleryItem = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
};
