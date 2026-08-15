#!/usr/bin/env node
/**
 * Validate WEB_PUSH VAPID env without printing secrets.
 *
 * Usage:
 *   WEB_PUSH_VAPID_PUBLIC_KEY=... WEB_PUSH_VAPID_PRIVATE_KEY=... WEB_PUSH_VAPID_SUBJECT=mailto:... \
 *     node scripts/validate-vapid-keys.mjs
 *
 * Never prints private key material.
 */
import { createECDH } from "node:crypto";

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

function validateSubject(subject) {
  try {
    const parsed = new URL(String(subject ?? "").trim());
    return parsed.protocol === "mailto:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
const subject = process.env.WEB_PUSH_VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  console.log("VAPID pair check not executed because local keys were not supplied.");
  process.exitCode = 0;
  process.exit();
}

if (!validateSubject(subject)) {
  console.log("VAPID pair: INVALID / subject must be mailto: or https:");
  process.exitCode = 1;
  process.exit();
}

const pub = decode(publicKey);
const priv = decode(privateKey);

if (!pub || !priv) {
  console.log("VAPID pair: INVALID / public and private do not match");
  process.exitCode = 1;
  process.exit();
}

if (priv.length !== 32 || pub.length !== 65 || pub[0] !== 0x04) {
  console.log("VAPID pair: INVALID / public and private do not match");
  process.exitCode = 1;
  process.exit();
}

try {
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(priv);
  const derived = ecdh.getPublicKey(null, "uncompressed");
  if (Buffer.compare(derived, pub) === 0) {
    console.log("VAPID pair: valid and matching");
    process.exitCode = 0;
  } else {
    console.log("VAPID pair: INVALID / public and private do not match");
    process.exitCode = 1;
  }
} catch {
  console.log("VAPID pair: INVALID / public and private do not match");
  process.exitCode = 1;
}
