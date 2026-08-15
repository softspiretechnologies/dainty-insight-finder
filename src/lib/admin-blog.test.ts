import { describe, expect, it } from "vitest";

import { parseAdminBlogPostId, serializeAdminBlogPost, toIsoDate } from "@/lib/admin-blog";

describe("parseAdminBlogPostId", () => {
  it("accepts new and positive integer ids", () => {
    expect(parseAdminBlogPostId("new")).toBe("new");
    expect(parseAdminBlogPostId("12")).toBe(12);
  });

  it("rejects invalid ids that would crash the editor loader", () => {
    expect(parseAdminBlogPostId("abc")).toBeNull();
    expect(parseAdminBlogPostId("0")).toBeNull();
    expect(parseAdminBlogPostId("-3")).toBeNull();
  });
});

describe("serializeAdminBlogPost", () => {
  it("converts dates and mysql booleans into JSON-safe values", () => {
    const publishedAt = new Date("2026-08-15T08:00:00.000Z");
    const createdAt = new Date("2026-08-14T08:00:00.000Z");
    const post = serializeAdminBlogPost({
      id: 1,
      title: "A look at hampers",
      slug: "a-look-at-hampers",
      excerpt: "Excerpt",
      content: "Body",
      featuredImage: null,
      metaTitle: null,
      metaDescription: null,
      isPublished: 1,
      publishedAt,
      createdAt,
      updatedAt: createdAt,
    });

    expect(post.isPublished).toBe(true);
    expect(post.publishedAt).toBe(publishedAt.toISOString());
    expect(post.createdAt).toBe(createdAt.toISOString());
  });

  it("does not throw on invalid dates", () => {
    expect(toIsoDate(new Date("invalid"))).toBeNull();
    expect(toIsoDate("not-a-date")).toBeNull();
  });
});
