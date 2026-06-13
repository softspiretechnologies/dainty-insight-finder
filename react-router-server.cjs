"use strict";

// Hostinger runs Node apps through LiteSpeed (lsnode). stdin is already bound
// to the app socket, so importing SSR bundles that touch node:process can throw
// "Error: open EEXIST" at process.stdin. Stub stdin before loading the app.

const path = require("node:path");
const { pathToFileURL } = require("node:url");

const fakeStdin = {
  readable: false,
  isTTY: false,
  on() {
    return this;
  },
  once() {
    return this;
  },
  off() {
    return this;
  },
  addListener() {
    return this;
  },
  removeListener() {
    return this;
  },
  pause() {
    return this;
  },
  resume() {
    return this;
  },
  pipe() {
    return this;
  },
  unpipe() {
    return this;
  },
  read() {
    return null;
  },
  setEncoding() {
    return this;
  },
  destroy() {
    return this;
  },
};

try {
  Object.defineProperty(process, "stdin", {
    get: () => fakeStdin,
    configurable: true,
  });
} catch {
  // ignore
}

const entry = path.join(__dirname, "dist/server/hostinger-entry.mjs");

import(pathToFileURL(entry).href).catch((error) => {
  console.error("Failed to start DaintyHand server:", error);
  process.exit(1);
});
