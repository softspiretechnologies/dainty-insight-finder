#!/usr/bin/env node
/**
 * Validate WEB_PUSH VAPID env without printing secrets.
 *
 * Usage:
 *   WEB_PUSH_VAPID_PUBLIC_KEY=... WEB_PUSH_VAPID_PRIVATE_KEY=... WEB_PUSH_VAPID_SUBJECT=mailto:... \
 *     npm run validate:vapid-keys
 *
 * Prints the same safe fingerprints as Admin Settings (process-env view).
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

function pairMatches(publicKey, privateKey) {
  const pub = decode(publicKey);
  const priv = decode(privateKey);
  if (!pub || !priv) return false;
  if (priv.length !== 32) return false;
  if (pub.length !== 65 || pub[0] !== 0x04) return false;
  const derivedB64 = derivePublicBase64Url(privateKey);
  if (!derivedB64) return false;
  const derived = decode(derivedB64);
  return Boolean(derived && Buffer.compare(derived, pub) === 0);
}

const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
const subject = process.env.WEB_PUSH_VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  console.log("VAPID pair check not executed because local keys were not supplied.");
  process.exitCode = 0;
  process.exit();
}

const publicTrimmed = publicKey.trim();
const privateTrimmed = privateKey.trim();
const subjectValid = validateSubject(subject);
const derived = derivePublicBase64Url(privateTrimmed);
const matches = pairMatches(publicTrimmed, privateTrimmed);

console.log(`Public fingerprint: ${fingerprint(publicTrimmed)}`);
console.log(
  `Derived fingerprint: ${derived ? fingerprint(derived) : "(unavailable — private key could not be decoded)"}`,
);
console.log(`Public length: ${publicTrimmed.length}`);
console.log(`Private length: ${privateTrimmed.length}`);
console.log(`Pair matches: ${matches ? "Yes" : "No"}`);
console.log(`Subject valid: ${subjectValid ? "Yes" : "No"}`);

process.exitCode = subjectValid && matches ? 0 : 1;
