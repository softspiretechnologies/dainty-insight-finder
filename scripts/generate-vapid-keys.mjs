#!/usr/bin/env node
/**
 * Generate stable Web Push VAPID keys for local/production env configuration.
 *
 * Usage: node scripts/generate-vapid-keys.mjs
 *    or: npm run generate:vapid-keys
 *
 * Do NOT run this during install, build, or deploy.
 * Do not casually regenerate production keys — that invalidates existing subscriptions.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log(`
# Web Push VAPID (keep the private key secret; never commit it)
WEB_PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}
WEB_PUSH_VAPID_PRIVATE_KEY=${keys.privateKey}
WEB_PUSH_VAPID_SUBJECT=mailto:admin@daintyhand.in
`);
