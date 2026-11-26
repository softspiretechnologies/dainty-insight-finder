import { describe, expect, it } from "vitest";

import {
  buildFaqStructuredData,
  buildOrganizationStructuredData,
  buildWebsiteStructuredData,
  businessId,
  businessReference,
  getHomeFaq,
} from "./business-seo";
import { site } from "./site";

describe("business structured data", () => {
  it("uses one identity and current public settings", () => {
    const organization = buildOrganizationStructuredData({
      location: "Perinthalmanna, Kerala",
      founder: "Studio founder",
      email: "orders@example.com",
      whatsappNumber: "919876543210",
      instagramUrl: "https://instagram.com/dainty.handd?utm_source=test",
    });
    expect(organization).toMatchObject({
      "@id": businessId(),
      "@type": "Organization",
      telephone: "+91-9876543210",
      email: "orders@example.com",
      sameAs: ["https://www.instagram.com/dainty.handd/"],
      location: { name: "Perinthalmanna, Kerala" },
      founder: { name: "Studio founder" },
    });
    expect(buildWebsiteStructuredData().publisher).toEqual(businessReference());
  });

  it("does not advertise dummy contact data or unsupported storefront claims", () => {
    const organization = buildOrganizationStructuredData({
      whatsappNumber: site.whatsappNumber,
      instagramUrl: "https://example.com/not-instagram",
    });
    for (const property of [
      "telephone",
      "sameAs",
      "address",
      "geo",
      "openingHours",
      "priceRange",
      "aggregateRating",
    ]) {
      expect(organization).not.toHaveProperty(property);
    }
  });

  it("keeps visible and machine-readable FAQs in sync", () => {
    const location = "Perinthalmanna, Malappuram, Kerala";
    const faq = getHomeFaq(location);
    const schema = buildFaqStructuredData(location);
    expect(schema.mainEntity.map((item) => item.name)).toEqual(faq.map((item) => item.q));
    expect(schema.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(
      faq.map((item) => item.a),
    );
  });
});
