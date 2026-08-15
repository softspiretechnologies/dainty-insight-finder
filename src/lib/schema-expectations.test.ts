import { describe, expect, it } from "vitest";

import {
  EXPECTED_TABLES,
  diffExpectedSchema,
  formatVerifyFailure,
  inferMissingSchemaFromError,
  planEnsureActions,
  typesCompatible,
  type SchemaSnapshot,
} from "@/lib/schema-expectations";

function emptySnapshot(): SchemaSnapshot {
  return { tables: {} };
}

function currentSnapshot(): SchemaSnapshot {
  const tables: SchemaSnapshot["tables"] = {};
  for (const table of EXPECTED_TABLES) {
    tables[table.name] = {
      columns: Object.fromEntries(
        table.columns.map((column) => [
          column.name,
          { dataType: column.allowedTypes[0]!, nullable: column.nullable },
        ]),
      ),
      uniques: table.uniques.map((unique) => ({ name: unique.name, columns: unique.columns })),
    };
  }
  return { tables };
}

describe("typesCompatible", () => {
  it("treats MySQL boolean as tinyint", () => {
    expect(typesCompatible("tinyint", ["tinyint", "boolean"])).toBe(true);
    expect(typesCompatible("varchar", ["int"])).toBe(false);
  });
});

describe("diffExpectedSchema", () => {
  it("detects a missing session_version column", () => {
    const actual = currentSnapshot();
    delete actual.tables.admin_users.columns.session_version;
    const issues = diffExpectedSchema(actual);
    expect(issues.some((issue) => issue.message === "admin_users.session_version")).toBe(true);
  });

  it("does not recreate an existing session_version column", () => {
    const issues = diffExpectedSchema(currentSnapshot());
    expect(issues.some((issue) => issue.target === "session_version")).toBe(false);
    expect(planEnsureActions(issues).apply).toEqual([]);
  });

  it("detects missing product columns", () => {
    const actual = currentSnapshot();
    delete actual.tables.products.columns.is_active;
    delete actual.tables.products.columns.featured_on_homepage;
    delete actual.tables.products.columns.homepage_sort_order;
    const messages = diffExpectedSchema(actual).map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "products.is_active",
        "products.featured_on_homepage",
        "products.homepage_sort_order",
      ]),
    );
  });

  it("detects a missing admin_login_attempts table", () => {
    const actual = currentSnapshot();
    delete actual.tables.admin_login_attempts;
    expect(
      diffExpectedSchema(actual).some((issue) => issue.message === "admin_login_attempts table"),
    ).toBe(true);
  });

  it("detects a missing blog_posts table", () => {
    const actual = currentSnapshot();
    delete actual.tables.blog_posts;
    expect(diffExpectedSchema(actual).some((issue) => issue.message === "blog_posts table")).toBe(
      true,
    );
  });

  it("passes a fully current schema", () => {
    expect(diffExpectedSchema(currentSnapshot())).toEqual([]);
    expect(formatVerifyFailure([])).toContain("Database schema is outdated.");
  });

  it("treats a second ensure pass as a no-op", () => {
    const first = planEnsureActions(diffExpectedSchema(emptySnapshot()));
    expect(first.apply.length).toBeGreaterThan(0);
    expect(planEnsureActions(diffExpectedSchema(currentSnapshot())).apply).toEqual([]);
  });

  it("fails incompatible columns instead of mutating them", () => {
    const actual = currentSnapshot();
    actual.tables.admin_users.columns.session_version = {
      dataType: "varchar",
      nullable: false,
    };
    const issues = diffExpectedSchema(actual);
    const planned = planEnsureActions(issues);
    expect(planned.abort.some((issue) => issue.kind === "incompatible_column")).toBe(true);
    expect(planned.apply.some((issue) => issue.target === "session_version")).toBe(false);
  });
});

describe("inferMissingSchemaFromError", () => {
  it("extracts an unknown column name", () => {
    expect(
      inferMissingSchemaFromError(new Error("Unknown column 'session_version' in 'field list'")),
    ).toEqual(["session_version"]);
  });

  it("extracts a missing table name", () => {
    expect(inferMissingSchemaFromError(new Error("Table 'app.blog_posts' doesn't exist"))).toEqual([
      "blog_posts table",
    ]);
  });
});
