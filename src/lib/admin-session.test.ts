import { describe, expect, it } from "vitest";

import {
  decodeAdminSession,
  encodeAdminSession,
  resolveAdminSession,
  signSessionToken,
} from "@/lib/admin-session";

const secret = "test-admin-session-secret";
const otherSecret = "a-different-secret-value";

const session = {
  userId: 7,
  email: "admin@example.com",
  name: "Nafisa",
  sessionVersion: 3,
};

describe("admin session signing", () => {
  it("round-trips a valid session", () => {
    const token = encodeAdminSession(session, secret, 60, 1_000);
    const decoded = decodeAdminSession(token, secret, 1_500);
    expect(decoded).toMatchObject(session);
    expect(decoded?.exp).toBe(1_000 + 60_000);
  });

  it("rejects a tampered payload", () => {
    const token = encodeAdminSession(session, secret);
    const [payload, sig] = token.split(".");
    const tampered = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
        userId: 1,
      }),
    ).toString("base64url");
    expect(decodeAdminSession(`${tampered}.${sig}`, secret)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = encodeAdminSession(session, secret);
    expect(decodeAdminSession(token, otherSecret)).toBeNull();
  });

  it("rejects an expired session", () => {
    const token = encodeAdminSession(session, secret, 10, 1_000);
    expect(decodeAdminSession(token, secret, 1_000 + 11_000)).toBeNull();
  });

  it("rejects a token without a signature", () => {
    expect(decodeAdminSession("not-a-token", secret)).toBeNull();
    expect(decodeAdminSession(signSessionToken("%%%", secret), secret)).toBeNull();
  });
});

describe("resolveAdminSession", () => {
  const user = {
    id: 7,
    email: "admin@example.com",
    name: "Nafisa",
    sessionVersion: 3,
  };

  it("returns the admin when signature, expiry and version match", async () => {
    const token = encodeAdminSession(session, secret);
    await expect(resolveAdminSession(token, secret, async () => user)).resolves.toEqual({
      userId: 7,
      email: "admin@example.com",
      name: "Nafisa",
    });
  });

  it("returns null when the admin account no longer exists", async () => {
    const token = encodeAdminSession(session, secret);
    await expect(resolveAdminSession(token, secret, async () => null)).resolves.toBeNull();
  });

  it("returns null when sessionVersion does not match the database", async () => {
    const token = encodeAdminSession(session, secret);
    await expect(
      resolveAdminSession(token, secret, async () => ({ ...user, sessionVersion: 4 })),
    ).resolves.toBeNull();
  });

  it("treats missing sessionVersion in old cookies as version 0", async () => {
    const payload = Buffer.from(
      JSON.stringify({
        userId: 7,
        email: "admin@example.com",
        name: "Nafisa",
        exp: Date.now() + 60_000,
      }),
    ).toString("base64url");
    const token = signSessionToken(payload, secret);
    await expect(
      resolveAdminSession(token, secret, async () => ({ ...user, sessionVersion: 0 })),
    ).resolves.toMatchObject({ userId: 7 });
    await expect(
      resolveAdminSession(token, secret, async () => ({ ...user, sessionVersion: 1 })),
    ).resolves.toBeNull();
  });

  it("returns null without a token or secret", async () => {
    await expect(resolveAdminSession(undefined, secret, async () => user)).resolves.toBeNull();
    await expect(resolveAdminSession("token", undefined, async () => user)).resolves.toBeNull();
  });
});
