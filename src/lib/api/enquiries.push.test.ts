import { beforeEach, describe, expect, it, vi } from "vitest";

const isDatabaseConfigured = vi.fn(() => true);
const getDb = vi.fn();
const checkEnquiryRateLimit = vi.fn();
const getEnquiryClientIp = vi.fn(() => "127.0.0.1");
const recordEnquirySubmission = vi.fn();
const notifyAdminsOfNewEnquiry = vi.fn();

function mockDbForInsert(insertId = 42, failInsert = false) {
  getDb.mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }),
    insert: () => ({
      values: async () => {
        if (failInsert) throw new Error("db down");
        return [{ insertId }];
      },
    }),
  });
}

vi.mock("@/db/index.server", () => ({
  isDatabaseConfigured: () => isDatabaseConfigured(),
  getDb: (...args: unknown[]) => getDb(...args),
}));

vi.mock("@/lib/enquiry-rate-limit.server", () => ({
  checkEnquiryRateLimit: (...args: unknown[]) => checkEnquiryRateLimit(...args),
  getEnquiryClientIp: () => getEnquiryClientIp(),
  recordEnquirySubmission: (...args: unknown[]) => recordEnquirySubmission(...args),
}));

vi.mock("@/lib/admin-push.server", () => ({
  notifyAdminsOfNewEnquiry: (...args: unknown[]) => notifyAdminsOfNewEnquiry(...args),
}));

vi.mock("@/lib/logger.server", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

const validPayload = {
  name: "Asha",
  phone: "9876543210",
  message: "Looking for floral decor for a small event.",
  source: "general" as const,
  website: "",
};

describe("submitEnquiry push isolation", () => {
  beforeEach(() => {
    vi.resetModules();
    isDatabaseConfigured.mockReturnValue(true);
    getEnquiryClientIp.mockReturnValue("127.0.0.1");
    checkEnquiryRateLimit.mockResolvedValue(null);
    recordEnquirySubmission.mockResolvedValue(undefined);
    notifyAdminsOfNewEnquiry.mockReset();
    mockDbForInsert(42, false);
  });

  it("notifyAfterEnquiryInserted never throws when push fails", async () => {
    notifyAdminsOfNewEnquiry.mockRejectedValue(new Error("push transport down"));
    const { notifyAfterEnquiryInserted } = await import("@/lib/enquiries.server");
    await expect(notifyAfterEnquiryInserted(42)).resolves.toBeUndefined();
    expect(notifyAdminsOfNewEnquiry).toHaveBeenCalledWith(42);
  });

  it("still succeeds when push fails after a real insert", async () => {
    notifyAdminsOfNewEnquiry.mockRejectedValue(new Error("push transport down"));
    const { submitEnquiryCore } = await import("@/lib/enquiries.server");
    const result = await submitEnquiryCore(validPayload);
    expect(result).toMatchObject({ id: 42 });
    expect(result.whatsappMessage).toContain("Asha");
    expect(notifyAdminsOfNewEnquiry).toHaveBeenCalledWith(42);
  });

  it("does not push for honeypot submissions", async () => {
    const { submitEnquiryCore } = await import("@/lib/enquiries.server");
    const result = await submitEnquiryCore({
      ...validPayload,
      website: "http://spam.example",
    });
    expect(result.id).toBe(0);
    expect(notifyAdminsOfNewEnquiry).not.toHaveBeenCalled();
  });

  it("does not push when rate limited", async () => {
    checkEnquiryRateLimit.mockResolvedValue(
      "Too many enquiries from this network. Please wait a few minutes and try again.",
    );
    const { submitEnquiryCore } = await import("@/lib/enquiries.server");
    await expect(submitEnquiryCore(validPayload)).rejects.toThrow(/too many enquiries/i);
    expect(notifyAdminsOfNewEnquiry).not.toHaveBeenCalled();
  });

  it("does not push when insert fails", async () => {
    mockDbForInsert(42, true);
    const { submitEnquiryCore } = await import("@/lib/enquiries.server");
    await expect(submitEnquiryCore(validPayload)).rejects.toThrow(/could not save/i);
    expect(notifyAdminsOfNewEnquiry).not.toHaveBeenCalled();
  });
});
