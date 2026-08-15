#!/usr/bin/env node
/**
 * Validate WEB_PUSH VAPID env without printing secrets.
 *
 * Usage (required):
 *   WEB_PUSH_VAPID_PRIVATE_KEY=... WEB_PUSH_VAPID_SUBJECT=mailto:... \
 *     npm run validate:vapid-keys
 *
 * Optional legacy compare:
 *   WEB_PUSH_VAPID_PUBLIC_KEY=... (reports whether legacy matches derived)
 *
 * Never prints private or full public key material.
 */
import { createECDH, createHash } from "node:crypto";

function decode(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.includes("=")) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  try {
    const buf = Buffer.from(trimmed, "base64url");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

function fingerprint(value) {
  return createHash("sha256").update(String(value).trim(), "utf8").digest("hex").slice(0, 12);
}

function validateSubject(subject) {
  try {
    const parsed = new URL(String(subject ?? "").trim());
    return parsed.protocol === "mailto:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function derivePublicBase64Url(privateKey) {
  const priv = decode(privateKey);
  if (!priv || priv.length !== 32) return null;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(priv);
    const derived = ecdh.getPublicKey(null, "uncompressed");
    if (derived.length !== 65 || derived[0] !== 0x04) return null;
    return derived.toString("base64url");
  } catch {
    return null;
  }
}

function legacyMatchesDerived(legacyPublic, privateKey) {
  const pub = decode(legacyPublic);
  const priv = decode(privateKey);
  if (!pub || !priv || priv.length !== 32) return false;
  if (pub.length !== 65 || pub[0] !== 0x04) return false;
  const derivedB64 = derivePublicBase64Url(privateKey);
  if (!derivedB64) return false;
  const derived = decode(derivedB64);
  return Boolean(derived && Buffer.compare(derived, pub) === 0);
}

const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
const subject = process.env.WEB_PUSH_VAPID_SUBJECT;
const legacyPublic = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;

if (!privateKey || !subject) {
  console.log(
    "VAPID check not executed because WEB_PUSH_VAPID_PRIVATE_KEY and WEB_PUSH_VAPID_SUBJECT were not both supplied.",
  );
  process.exitCode = 0;
  process.exit();
}

const privateTrimmed = privateKey.trim();
const subjectValid = validateSubject(subject);
const derived = derivePublicBase64Url(privateTrimmed);
const privateKeyValid = Boolean(derived);

console.log(
  `Derived public fingerprint: ${derived ? fingerprint(derived) : "(unavailable — private key could not be decoded)"}`,
);
console.log(`Derived public length: ${derived ? derived.length : "—"}`);
console.log(`Private length: ${privateTrimmed.length}`);
console.log(`Private key valid: ${privateKeyValid ? "Yes" : "No"}`);
console.log(`Subject valid: ${subjectValid ? "Yes" : "No"}`);

if (legacyPublic?.trim()) {
  const legacyTrimmed = legacyPublic.trim();
  const matches = privateKeyValid && legacyMatchesDerived(legacyTrimmed, privateTrimmed);
  console.log(`Legacy public fingerprint: ${fingerprint(legacyTrimmed)}`);
  console.log(`Legacy public length: ${legacyTrimmed.length}`);
  console.log(`Legacy public matches derived: ${matches ? "Yes" : "No"}`);
}

process.exitCode = subjectValid && privateKeyValid ? 0 : 1;
