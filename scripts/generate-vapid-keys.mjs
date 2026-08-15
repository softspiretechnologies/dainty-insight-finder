#!/usr/bin/env node
/**
 * Generate stable Web Push VAPID keys for local/production env configuration.
 *
 * Usage: node scripts/generate-vapid-keys.mjs
 *    or: npm run generate:vapid-keys
 *
 * Do NOT run this during install, build, or deploy.
 * Do not casually regenerate production keys — that invalidates existing subscriptions.
 *
 * Production only needs:
 *   WEB_PUSH_VAPID_PRIVATE_KEY
 *   WEB_PUSH_VAPID_SUBJECT
 *
 * The server derives the public key from the private key at runtime.
 * The public key is printed for reference/testing only — Hostinger does not require it.
 *
 * If a previous private key was exposed during troubleshooting, generate a NEW private key
 * for production and re-enable push on each Admin device after deploy.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log(`
# Web Push VAPID
# Required in production (private key is secret — never commit it):
WEB_PUSH_VAPID_PRIVATE_KEY=${keys.privateKey}
WEB_PUSH_VAPID_SUBJECT=mailto:admin@daintyhand.in

# Optional reference only (server derives public from private; not required in Hostinger):
# WEB_PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}
`);
