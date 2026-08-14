import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  isPathInsideRoot,
  isSafeRelativeUploadPath,
  resolveHostingerUploadsDir,
  resolvePersistentUploadsDir,
} from "@/lib/uploads-path";

describe("resolveHostingerUploadsDir", () => {
  it("resolves Hostinger hbuilds current/nodejs cwd to the domain uploads folder", () => {
    const cwd = path.join(
      "/home",
      "deploy",
      "domains",
      "example.com",
      "hbuilds",
      "current",
      "nodejs",
    );
    expect(resolveHostingerUploadsDir(cwd)).toBe(
      path.join("/home", "deploy", "domains", "example.com", "uploads"),
    );
  });

  it("resolves Hostinger hbuilds hashed build cwd to the domain uploads folder", () => {
    const cwd = path.join(
      "/home",
      "deploy",
      "domains",
      "example.com",
      "hbuilds",
      "abc123",
      "nodejs",
    );
    expect(resolveHostingerUploadsDir(cwd)).toBe(
      path.join("/home", "deploy", "domains", "example.com", "uploads"),
    );
  });

  it("resolves Hostinger domain/nodejs cwd one level up", () => {
    const cwd = path.join("/home", "deploy", "domains", "example.com", "nodejs");
    expect(resolveHostingerUploadsDir(cwd)).toBe(
      path.join("/home", "deploy", "domains", "example.com", "uploads"),
    );
  });

  it("returns null for a local project directory", () => {
    expect(resolveHostingerUploadsDir(path.join("/Users", "dev", "dainty-insight-finder"))).toBe(
      null,
    );
  });
});

describe("resolvePersistentUploadsDir", () => {
  it("prefers UPLOADS_DIR when set", () => {
    const cwd = path.join(
      "/home",
      "deploy",
      "domains",
      "example.com",
      "hbuilds",
      "current",
      "nodejs",
    );
    expect(resolvePersistentUploadsDir(cwd, "/custom/uploads")).toBe("/custom/uploads");
  });

  it("ignores blank UPLOADS_DIR and uses Hostinger detection", () => {
    const cwd = path.join("/home", "deploy", "domains", "example.com", "nodejs");
    expect(resolvePersistentUploadsDir(cwd, "  ")).toBe(
      path.join("/home", "deploy", "domains", "example.com", "uploads"),
    );
  });

  it("falls back to ../uploads during local development", () => {
    const cwd = path.join("/Users", "dev", "dainty-insight-finder");
    expect(resolvePersistentUploadsDir(cwd)).toBe(path.join(cwd, "..", "uploads"));
  });
});

describe("upload path safety", () => {
  it("rejects path traversal", () => {
    expect(isSafeRelativeUploadPath("../secrets.txt")).toBe(false);
    expect(isSafeRelativeUploadPath("products/../../etc/passwd")).toBe(false);
    expect(isSafeRelativeUploadPath("..\\secrets.txt")).toBe(false);
  });

  it("accepts a normal product image path", () => {
    expect(isSafeRelativeUploadPath("products/hamper.jpg")).toBe(true);
  });

  it("keeps resolved files inside the uploads root", () => {
    const root = path.join("/var", "uploads");
    expect(isPathInsideRoot(path.join(root, "products", "a.jpg"), root)).toBe(true);
    expect(isPathInsideRoot(path.join("/var", "other", "a.jpg"), root)).toBe(false);
  });
});
