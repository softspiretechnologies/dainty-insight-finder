import { describe, expect, it } from "vitest";

import {
  adminEnquiryNotesSchema,
  adminEnquiryStatusSchema,
  buildAdminWhatsAppMessage,
  buildVisitorWhatsAppMessage,
  enquiryInterestLabel,
  enquiryTelHref,
  isValidEnquiryPhone,
  normalizeEnquiryPhone,
  publicEnquirySchema,
} from "@/lib/enquiries";

describe("publicEnquirySchema", () => {
  const valid = {
    name: "Amina",
    phone: "9876543210",
    message: "Looking for wedding hampers for guests.",
    source: "general" as const,
  };

  it("accepts a minimal valid enquiry", () => {
    const result = publicEnquirySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects short messages and invalid phones", () => {
    expect(publicEnquirySchema.safeParse({ ...valid, message: "Hi" }).success).toBe(false);
    expect(publicEnquirySchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });

  it("rejects unknown fields so public payloads cannot set admin fields", () => {
    const result = publicEnquirySchema.safeParse({
      ...valid,
      status: "confirmed",
      adminNotes: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty optional email and rejects bad email", () => {
    expect(publicEnquirySchema.safeParse({ ...valid, email: "" }).success).toBe(true);
    expect(publicEnquirySchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("phone helpers", () => {
  it("normalizes Indian numbers", () => {
    expect(normalizeEnquiryPhone("9876543210")).toBe("919876543210");
    expect(normalizeEnquiryPhone("+91 98765 43210")).toBe("919876543210");
    expect(isValidEnquiryPhone("9876543210")).toBe(true);
    expect(isValidEnquiryPhone("123")).toBe(false);
  });

  it("builds tel hrefs", () => {
    expect(enquiryTelHref("9876543210")).toBe("tel:+919876543210");
    expect(enquiryTelHref("+971501234567")).toBe("tel:+971501234567");
  });
});

describe("status and notes schemas", () => {
  it("validates status updates", () => {
    expect(adminEnquiryStatusSchema.safeParse({ id: 1, status: "contacted" }).success).toBe(true);
    expect(adminEnquiryStatusSchema.safeParse({ id: 1, status: "pending" }).success).toBe(false);
  });

  it("normalizes empty notes to null", () => {
    const result = adminEnquiryNotesSchema.safeParse({ id: 1, adminNotes: "  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.adminNotes).toBeNull();
  });
});

describe("WhatsApp message builders", () => {
  it("builds visitor continuation without admin notes", () => {
    const message = buildVisitorWhatsAppMessage({
      name: "Amina",
      productName: "Rose Hamper",
      eventType: "Wedding",
      eventDate: "2026-12-01",
      budget: "₹10,000",
      message: "Need 20 pieces",
    });
    expect(message).toContain("I just sent an enquiry");
    expect(message).toContain("Rose Hamper");
    expect(message).not.toContain("admin");
  });

  it("builds admin outreach message", () => {
    const message = buildAdminWhatsAppMessage({
      name: "Amina",
      productNameSnapshot: "Rose Hamper",
      eventDate: "2026-12-01",
    });
    expect(message).toContain("Hi Amina");
    expect(message).toContain("Rose Hamper");
  });
});

describe("enquiryInterestLabel", () => {
  it("prefers product then service snapshots", () => {
    expect(
      enquiryInterestLabel({
        productNameSnapshot: "Hamper",
        serviceTitleSnapshot: "Shoot",
        source: "product",
      }),
    ).toBe("Hamper");
    expect(
      enquiryInterestLabel({
        productNameSnapshot: null,
        serviceTitleSnapshot: "Shoot",
        source: "service",
      }),
    ).toBe("Shoot");
  });
});
