import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const adminApiDir = path.join(process.cwd(), "src/lib/api/admin");
const publicExportsWithoutAuth = new Set(["loginAdmin", "logoutAdmin", "getSessionAdmin"]);

function exportedHandlerNames(source: string) {
  return [...source.matchAll(/export const (\w+) = createServerFn/g)].map((match) => match[1]);
}

describe("admin server function authorization", () => {
  it("calls requireAdmin inside every private admin server function", () => {
    const files = readdirSync(adminApiDir).filter((name) => name.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(path.join(adminApiDir, file), "utf8");
      for (const name of exportedHandlerNames(source)) {
        if (publicExportsWithoutAuth.has(name)) continue;
        expect(source, `${file} ${name}`).toContain("await requireAdmin()");
      }
    }
  });

  it("protects the admin dashboard server function", () => {
    const source = readFileSync(path.join(process.cwd(), "src/lib/api/catalog.ts"), "utf8");
    expect(source).toContain("await requireAdmin()");
    expect(source).toMatch(/getAdminDashboardData[\s\S]*await requireAdmin\(\)/);
  });
});
