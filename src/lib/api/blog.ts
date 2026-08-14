import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog.server";

export const listPublishedBlogPosts = createServerFn({ method: "GET" }).handler(() =>
  getPublishedBlogPosts(),
);

export const getPublishedBlogPost = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(160) }))
  .handler(({ data }) => getPublishedBlogPostBySlug(data.slug));
