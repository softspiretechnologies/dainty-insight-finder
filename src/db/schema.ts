import {
  boolean,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 32 }).primaryKey(),
  label: varchar("label", { length: 128 }).notNull(),
  blurb: text("blurb").notNull(),
  imagePath: varchar("image_path", { length: 512 }).notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
});

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  categoryId: varchar("category_id", { length: 32 }).notNull(),
  blurb: text("blurb").notNull(),
  description: text("description").notNull(),
  details: json("details").$type<string[]>().notNull(),
  imagePath: varchar("image_path", { length: 512 }).notNull().default(""),
  priceFrom: varchar("price_from", { length: 64 }),
  isActive: boolean("is_active").notNull().default(true),
  featuredOnHomepage: boolean("featured_on_homepage").notNull().default(false),
  homepageSortOrder: int("homepage_sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").primaryKey().default(1),
  whatsappNumber: varchar("whatsapp_number", { length: 32 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  instagramUrl: varchar("instagram_url", { length: 512 }).notNull(),
  instagramHandle: varchar("instagram_handle", { length: 64 }).notNull(),
  founder: varchar("founder", { length: 128 }).notNull(),
  location: varchar("location", { length: 256 }).notNull(),
  servicesIntro: text("services_intro").notNull().default(""),
  servicesFooterTitle: varchar("services_footer_title", { length: 256 }).notNull().default(""),
  servicesFooterBlurb: text("services_footer_blurb").notNull().default(""),
  testimonialsHeading: varchar("testimonials_heading", { length: 256 }).notNull().default(""),
});

export const testimonials = mysqlTable("testimonials", {
  id: int("id").primaryKey().autoincrement(),
  quote: text("quote").notNull(),
  customerName: varchar("customer_name", { length: 128 }).notNull(),
  location: varchar("location", { length: 128 }).notNull(),
  context: varchar("context", { length: 128 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

export const services = mysqlTable("services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  blurb: text("blurb").notNull(),
  bullets: json("bullets").$type<string[]>().notNull(),
  imagePath: varchar("image_path", { length: 512 }).notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
});

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
});
