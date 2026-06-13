import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist/server/hostinger-entry.mjs");

const source = `// Auto-generated — do not edit. Rebuilt by npm run build.
// Hostinger LiteSpeed binds stdin to the app socket; lazy SSR imports that
// touch node:process can throw "open EEXIST" without this shim.

const fakeStdin = {
  readable: false,
  isTTY: false,
  on() { return this; },
  once() { return this; },
  off() { return this; },
  addListener() { return this; },
  removeListener() { return this; },
  pause() { return this; },
  resume() { return this; },
  pipe() { return this; },
  unpipe() { return this; },
  read() { return null; },
  setEncoding() { return this; },
  destroy() { return this; },
};

try {
  Object.defineProperty(process, "stdin", {
    get: () => fakeStdin,
    configurable: true,
  });
} catch {
  // Hostinger may already have stdin bound; continue and let index.mjs load.
}

await import("./index.mjs");
`;

await writeFile(out, source, "utf8");
