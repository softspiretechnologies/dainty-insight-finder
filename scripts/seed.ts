import { mkdir } from "node:fs/promises";
import path from "node:path";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { categories, products, siteSettings, adminUsers } from "../src/db/schema";
import { seedCategories, seedProducts } from "../src/data/catalog-seed";
import { categoryImageFiles, productImageFiles } from "../src/data/upload-asset-map";
import { optimizeSeedImage } from "../src/lib/image-optimize.server";
import { site } from "../src/lib/site";
import { allUploadTargets } from "./lib/uploads-path";

const ASSETS_DIR = path.join(process.cwd(), "src/assets");
const UPLOAD_TARGETS = allUploadTargets();

async function copyAssetToUploads(assetFile: string, subdir: string, destName: string) {
  const src = path.join(ASSETS_DIR, assetFile);
  const relativePath = `/uploads/${subdir}/${destName}`;

  for (const uploadsRoot of UPLOAD_TARGETS) {
    const destDir = path.join(uploadsRoot, subdir);
    await mkdir(destDir, { recursive: true });
    await optimizeSeedImage(src, path.join(destDir, destName));
  }

  return relativePath;
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
    whatsappNumber: settingsRows[0]?.whatsappNumber || site.whatsappNumber,
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
