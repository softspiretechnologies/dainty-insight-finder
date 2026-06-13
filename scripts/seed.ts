import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { categories, products, siteSettings, adminUsers } from "../src/db/schema";
import { seedCategories, seedProducts } from "../src/data/catalog-seed";
import { site } from "../src/lib/site";

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "src/assets");
const UPLOADS_DIR = path.join(ROOT, "public/uploads");

const categoryImageFiles: Record<string, string> = {
  hampers: "service-hampers.jpg",
  bouquets: "service-bouquets.jpg",
  invitations: "service-invitations.jpg",
  engagement: "service-engagement.jpg",
  frames: "gallery-4.jpg",
  albums: "gallery-6.jpg",
  calligraphy: "gallery-3.jpg",
  celebrations: "gallery-5.jpg",
};

const productImageFiles: Record<string, string> = {
  "ribbon-wrap-hamper": "service-hampers.jpg",
  "wax-seal-keepsake": "gallery-1.jpg",
  "candle-and-cotton-hamper": "gallery-6.jpg",
  "garden-meadow-bouquet": "service-bouquets.jpg",
  "jasmine-marigold-arrangement": "gallery-2.jpg",
  "cotton-paper-invitation-suite": "service-invitations.jpg",
  "kerala-script-card": "gallery-3.jpg",
  "place-card-set": "gallery-5.jpg",
  "ring-box-hamper": "service-engagement.jpg",
  "promise-chest": "gallery-4.jpg",
  "chocolate-bouquet": "gallery-2.jpg",
  "cash-bouquet": "service-bouquets.jpg",
  "acrylic-couple-frame": "gallery-4.jpg",
  "memory-frame": "gallery-1.jpg",
  "wedding-album": "gallery-6.jpg",
  "memory-book": "gallery-5.jpg",
  "arabic-name-calligraphy": "gallery-3.jpg",
  "event-signage-set": "gallery-5.jpg",
  "save-the-date-shoot": "service-invitations.jpg",
  "birthday-surprise-setup": "service-engagement.jpg",
  "proposal-setup": "service-engagement.jpg",
  "memory-reel": "gallery-3.jpg",
  "nikah-invitation-suite": "service-invitations.jpg",
};

async function copyAssetToUploads(assetFile: string, subdir: string, destName: string) {
  const src = path.join(ASSETS_DIR, assetFile);
  const destDir = path.join(UPLOADS_DIR, subdir);
  await mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, destName);
  await copyFile(src, dest);
  return `/uploads/${subdir}/${destName}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  const { drizzle } = await import("drizzle-orm/mysql2");
  const mysql = await import("mysql2/promise");
  const pool = mysql.default.createPool(databaseUrl);
  const db = drizzle(pool, { schema: { categories, products, siteSettings, adminUsers }, mode: "default" });

  console.log("Seeding categories...");
  for (let i = 0; i < seedCategories.length; i++) {
    const cat = seedCategories[i];
    const assetFile = categoryImageFiles[cat.id];
    const imagePath = await copyAssetToUploads(assetFile, "categories", `${cat.id}.jpg`);

    const existing = await db.select().from(categories).where(eq(categories.id, cat.id)).limit(1);
    const values = {
      label: cat.label,
      blurb: cat.blurb,
      imagePath,
      sortOrder: i,
    };

    if (existing[0]) {
      await db.update(categories).set(values).where(eq(categories.id, cat.id));
    } else {
      await db.insert(categories).values({ id: cat.id, ...values });
    }
  }

  console.log("Seeding products...");
  for (const product of seedProducts) {
    const assetFile = productImageFiles[product.slug];
    const imagePath = await copyAssetToUploads(assetFile, "products", `${product.slug}.jpg`);

    const existing = await db.select().from(products).where(eq(products.slug, product.slug)).limit(1);
    const values = {
      slug: product.slug,
      name: product.name,
      categoryId: product.category,
      blurb: product.blurb,
      description: product.description,
      details: product.details,
      imagePath,
      priceFrom: product.priceFrom ?? null,
    };

    if (existing[0]) {
      await db.update(products).set(values).where(eq(products.slug, product.slug));
    } else {
      await db.insert(products).values(values);
    }
  }

  console.log("Seeding site settings...");
  const settingsRows = await db.select().from(siteSettings).limit(1);
  const settingsValues = {
    whatsappNumber: site.whatsappNumber,
    email: site.email,
    instagramUrl: site.instagramUrl,
    instagramHandle: site.instagramHandle,
    founder: site.founder,
    location: site.location,
  };

  if (settingsRows[0]) {
    await db.update(siteSettings).set(settingsValues).where(eq(siteSettings.id, settingsRows[0].id));
  } else {
    await db.insert(siteSettings).values({ id: 1, ...settingsValues });
  }

  console.log("Seeding admin user...");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const userRows = await db.select().from(adminUsers).where(eq(adminUsers.email, adminEmail.toLowerCase())).limit(1);

  if (userRows[0]) {
    await db
      .update(adminUsers)
      .set({ passwordHash, name: "Admin" })
      .where(eq(adminUsers.email, adminEmail.toLowerCase()));
  } else {
    await db.insert(adminUsers).values({
      email: adminEmail.toLowerCase(),
      passwordHash,
      name: "Admin",
    });
  }

  await pool.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
