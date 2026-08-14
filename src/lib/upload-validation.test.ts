import { describe, expect, it } from "vitest";

import {
  assertValidImageUpload,
  isAllowedImageMime,
  sanitizeUploadFilename,
  validateImageBuffer,
} from "@/lib/upload-validation";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x10, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
]);
const gif = Buffer.from("GIF89a");

describe("upload MIME validation", () => {
  it("allows jpeg, png and webp", () => {
    expect(isAllowedImageMime("image/jpeg")).toBe(true);
    expect(isAllowedImageMime("image/png")).toBe(true);
    expect(isAllowedImageMime("image/webp")).toBe(true);
  });

  it("rejects other MIME types", () => {
    expect(isAllowedImageMime("image/gif")).toBe(false);
    expect(isAllowedImageMime("application/octet-stream")).toBe(false);
    expect(isAllowedImageMime("image/svg+xml")).toBe(false);
  });
});

describe("magic-byte validation", () => {
  it("accepts matching jpeg, png and webp signatures", () => {
    expect(() => validateImageBuffer(jpeg, "image/jpeg")).not.toThrow();
    expect(() => validateImageBuffer(png, "image/png")).not.toThrow();
    expect(() => validateImageBuffer(webp, "image/webp")).not.toThrow();
  });

  it("rejects mismatched content and declared type", () => {
    expect(() => validateImageBuffer(gif, "image/jpeg")).toThrow(/does not match/);
    expect(() => validateImageBuffer(jpeg, "image/png")).toThrow(/does not match/);
    expect(() => validateImageBuffer(png, "image/webp")).toThrow(/does not match/);
  });

  it("rejects a jpeg payload declared as png at the upload boundary", () => {
    expect(() =>
      assertValidImageUpload({ type: "image/png", data: jpeg.toString("base64") }),
    ).toThrow(/does not match/);
  });

  it("rejects disallowed MIME types at the upload boundary", () => {
    expect(() =>
      assertValidImageUpload({ type: "image/gif", data: gif.toString("base64") }),
    ).toThrow(/Only JPEG, PNG and WebP/);
  });
});

describe("filename sanitization", () => {
  it("normalizes unsafe names", () => {
    expect(sanitizeUploadFilename("My Photo 1")).toBe("my-photo-1");
    expect(sanitizeUploadFilename("../../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeUploadFilename("ok_file.name")).toBe("ok-file.name");
  });
});
