import { z } from "zod";

import { isValidProductPriceInput, normalizeProductPriceInput } from "@/lib/product-price";

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

const priceFromSchema = z
  .string()
  .trim()
  .max(64)
  .optional()
  .refine((value) => isValidProductPriceInput(value), {
    message: "Enter an amount, for example 1800.",
  })
  .transform((value) => normalizeProductPriceInput(value));

export const imageUploadPayloadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(1).max(7_000_000, "Image payload is too large"),
});

export const uploadPathSchema = z
  .string()
  .regex(/^\/uploads\/(products|categories|services)\/[a-z0-9._-]+$/i, "Invalid image path");

export type ImageUploadPayload = z.infer<typeof imageUploadPayloadSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const adminSettingsFormSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .max(40)
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length >= 8 && digits.length <= 15, {
      message: "Enter a valid WhatsApp number with country code",
    }),
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
  priceFrom: priceFromSchema,
  isActive: z.boolean(),
  featuredOnHomepage: z.boolean(),
});

export const productInputSchema = z.object({
  id: z.union([z.literal("new"), z.number().int().positive()]),
  slug: z.string().min(1).max(128).regex(slugPattern, "Invalid slug format"),
  name: z.string().min(1).max(256),
  categoryId: z.enum(categoryIds),
  blurb: z.string().min(1),
  description: z.string().min(1),
  details: z.string().min(1),
  priceFrom: priceFromSchema,
  isActive: z.boolean(),
  featuredOnHomepage: z.boolean(),
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

export const serviceIds = [
  "save-the-date-shoots",
  "birthday-surprise-planning",
  "proposal-setups",
  "couple-shoots",
  "reels-memory-videos",
] as const;

export const adminServiceFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(256),
  blurb: z.string().trim().min(1, "Description is required"),
  bullets: z.string().trim().min(1, "Add at least one bullet point"),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater"),
});

export const adminServicesPageFormSchema = z.object({
  intro: z.string().trim().min(1, "Page intro is required"),
  footerTitle: z.string().trim().min(1, "Footer heading is required").max(256),
  footerBlurb: z.string().trim().min(1, "Footer text is required"),
});

export const serviceInputSchema = z.object({
  id: z.enum(serviceIds),
  title: z.string().min(1).max(256),
  blurb: z.string().min(1),
  bullets: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
  existingImagePath: uploadPathSchema.optional(),
  image: imageUploadPayloadSchema.optional(),
});

export const servicesPageInputSchema = adminServicesPageFormSchema;

export const adminTestimonialFormSchema = z.object({
  quote: z.string().trim().min(1, "Quote is required"),
  customerName: z.string().trim().min(1, "Customer name is required").max(128),
  location: z.string().trim().min(1, "Location is required").max(128),
  context: z.string().trim().min(1, "Service or occasion is required").max(128),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater"),
});

export const adminTestimonialsSectionFormSchema = z.object({
  heading: z.string().trim().min(1, "Section heading is required").max(256),
});

export const testimonialInputSchema = z.object({
  id: z.union([z.literal("new"), z.number().int().positive()]),
  quote: z.string().min(1),
  customerName: z.string().min(1).max(128),
  location: z.string().min(1).max(128),
  context: z.string().min(1).max(128),
  sortOrder: z.coerce.number().int().min(0),
});

export const testimonialsSectionInputSchema = adminTestimonialsSectionFormSchema;

export const settingsSchema = adminSettingsFormSchema;

export const adminBlogPostSchema = z.object({
  id: z.union([z.literal("new"), z.number().int().positive()]),
  title: z.string().trim().min(1, "Title is required").max(256),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160)
    .regex(slugPattern, "Slug must use lowercase letters, numbers and hyphens"),
  excerpt: z.string().trim().min(1, "Excerpt is required").max(1000),
  content: z.string().trim().min(1, "Content is required"),
  featuredImage: z.string().trim().max(512).optional(),
  metaTitle: z.string().trim().max(256).optional(),
  metaDescription: z.string().trim().max(1000).optional(),
  isPublished: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(12, "Use at least 12 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
