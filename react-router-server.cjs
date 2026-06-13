"use strict";

// Hostinger runs Node apps through LiteSpeed (lsnode). stdin is already bound
// to the app socket, so importing SSR bundles that touch node:process can throw
// "Error: open EEXIST" at process.stdin. Stub stdin before loading the app.

const path = require("node:path");
const { pathToFileURL } = require("node:url");

function prodLog(level, message, extra) {
  const line = { timestamp: new Date().toISOString(), level, message };
  if (extra) line.extra = extra;
  const text = JSON.stringify(line);
  if (level === "ERROR") console.error(text);
  else console.log(text);
}

prodLog("LOG", "react-router-server.cjs loaded", {
  entry: "react-router-server.cjs",
  nodeVersion: process.version,
  cwd: __dirname,
});

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
  prodLog("LOG", "stdin shim applied (react-router-server.cjs)");
} catch (error) {
  prodLog("ERROR", "stdin shim FAILED (react-router-server.cjs)", {
    error: { message: error.message, stack: error.stack },
  });
}

const entry = path.join(__dirname, "dist/server/hostinger-entry.mjs");
prodLog("LOG", "Loading hostinger entry", { path: entry });

import(pathToFileURL(entry).href).catch((error) => {
  prodLog("ERROR", "Failed to start DaintyHand server", {
    entry,
    error: { name: error.name, message: error.message, stack: error.stack, code: error.code },
  });
  process.exit(1);
});
