import { z } from "zod";

export const categoryIds = [
  "hampers",
  "bouquets",
  "invitations",
  "engagement",
  "frames",
  "albums",
  "calligraphy",
  "celebrations",
] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const imageUploadPayloadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(1).max(7_000_000, "Image payload is too large"),
});

export const uploadPathSchema = z
  .string()
  .regex(/^\/uploads\/(products|categories)\/[a-z0-9._-]+$/i, "Invalid image path");

export type ImageUploadPayload = z.infer<typeof imageUploadPayloadSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const adminSettingsFormSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .min(8, "WhatsApp number is required")
    .max(32)
    .regex(/^\d+$/, "Use digits only, including country code (e.g. 919876543210)"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  instagramUrl: z.string().trim().min(1, "Instagram URL is required").url("Enter a valid URL"),
  instagramHandle: z.string().trim().min(1, "Instagram handle is required").max(64),
  founder: z.string().trim().min(1, "Founder name is required").max(128),
  location: z.string().trim().min(1, "Location is required").max(256),
});

export const adminCategoryFormSchema = z.object({
  label: z.string().trim().min(1, "Display label is required").max(128),
  blurb: z.string().trim().min(1, "Short blurb is required"),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater"),
});

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(256),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(128)
    .regex(slugPattern, "Slug must use lowercase letters, numbers and hyphens"),
  categoryId: z.enum(categoryIds, { message: "Select a category" }),
  blurb: z.string().trim().min(1, "Short blurb is required"),
  description: z.string().trim().min(1, "Description is required"),
  details: z.string().trim().min(1, "Add at least one detail"),
  priceFrom: z.string().trim().max(64).optional(),
});

export const productInputSchema = z.object({
  id: z.union([z.literal("new"), z.number().int().positive()]),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(slugPattern, "Invalid slug format"),
  name: z.string().min(1).max(256),
  categoryId: z.enum(categoryIds),
  blurb: z.string().min(1),
  description: z.string().min(1),
  details: z.string().min(1),
  priceFrom: z.string().max(64).optional(),
  existingImagePath: uploadPathSchema.optional(),
  image: imageUploadPayloadSchema.optional(),
});

export const categoryInputSchema = z.object({
  id: z.enum(categoryIds),
  label: z.string().min(1).max(128),
  blurb: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
  existingImagePath: uploadPathSchema.optional(),
  image: imageUploadPayloadSchema.optional(),
});

export const settingsSchema = adminSettingsFormSchema;
