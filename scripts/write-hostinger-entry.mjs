import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist/server/hostinger-entry.mjs");

const source = `// Auto-generated — do not edit. Rebuilt by npm run build.
// Hostinger LiteSpeed binds stdin to the app socket; lazy SSR imports that
// touch node:process can throw "open EEXIST" without this shim.

function prodLog(level, message, extra) {
  const line = { timestamp: new Date().toISOString(), level, message };
  if (extra) line.extra = extra;
  const text = JSON.stringify(line);
  if (level === "ERROR") console.error(text);
  else console.log(text);
}

prodLog("LOG", "hostinger-entry.mjs loaded", {
  entry: "dist/server/hostinger-entry.mjs",
  nodeVersion: process.version,
  cwd: process.cwd(),
});

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

let stdinShimOk = false;
try {
  Object.defineProperty(process, "stdin", {
    get: () => fakeStdin,
    configurable: true,
  });
  stdinShimOk = true;
  prodLog("LOG", "stdin shim applied");
} catch (error) {
  prodLog("ERROR", "stdin shim FAILED", {
    error: { message: error?.message, stack: error?.stack },
  });
}

process.on("uncaughtException", (error) => {
  prodLog("ERROR", "uncaughtException (hostinger-entry)", {
    error: { name: error?.name, message: error?.message, stack: error?.stack, code: error?.code },
  });
});

process.on("unhandledRejection", (reason) => {
  prodLog("ERROR", "unhandledRejection (hostinger-entry)", {
    error: { message: String(reason) },
  });
});

try {
  await import("./index.mjs");
  prodLog("LOG", "index.mjs imported successfully");
} catch (error) {
  prodLog("ERROR", "Failed to import index.mjs", {
    error: { name: error?.name, message: error?.message, stack: error?.stack, code: error?.code },
  });
  throw error;
}
`;

await writeFile(out, source, "utf8");
console.log("Wrote dist/server/hostinger-entry.mjs");
