import { describe, expect, it } from "vitest";

import {
  EXPECTED_TABLES,
  columnTypesCompatible,
  detectDatabaseFlavor,
  diffExpectedSchema,
  formatVerifyFailure,
  inferMissingSchemaFromError,
  parseMariaDbJsonValidColumns,
  planEnsureActions,
  typesCompatible,
  type SchemaSnapshot,
} from "@/lib/schema-expectations";

function emptySnapshot(flavor: SchemaSnapshot["flavor"] = "mysql"): SchemaSnapshot {
  return {
    flavor,
    mariaDbJsonConstraintInspection: flavor === "mariadb" ? "available" : "not_applicable",
    tables: {},
  };
}

function currentSnapshot(flavor: SchemaSnapshot["flavor"] = "mysql"): SchemaSnapshot {
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
  return {
    flavor,
    mariaDbJsonConstraintInspection: flavor === "mariadb" ? "available" : "not_applicable",
    tables,
  };
}

function mariaDbProductionLikeSnapshot(): SchemaSnapshot {
  const snapshot = currentSnapshot("mariadb");
  snapshot.tables.products.columns.details = {
    dataType: "longtext",
    nullable: false,
    mariaDbJsonAlias: true,
  };
  snapshot.tables.services.columns.bullets = {
    dataType: "longtext",
    nullable: false,
    mariaDbJsonAlias: true,
  };
  return snapshot;
}

describe("detectDatabaseFlavor", () => {
  it("detects MariaDB from VERSION()", () => {
    expect(detectDatabaseFlavor("10.11.6-MariaDB-log")).toBe("mariadb");
    expect(detectDatabaseFlavor("8.0.36")).toBe("mysql");
  });
});

describe("parseMariaDbJsonValidColumns", () => {
  it("extracts column names from json_valid checks", () => {
    expect(parseMariaDbJsonValidColumns("json_valid(`details`)")).toEqual(["details"]);
    expect(
      parseMariaDbJsonValidColumns(
        "`bullets` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`bullets`))",
      ),
    ).toEqual(["bullets"]);
  });
});

describe("typesCompatible", () => {
  it("treats MySQL boolean as tinyint", () => {
    expect(typesCompatible("tinyint", ["tinyint", "boolean"])).toBe(true);
    expect(typesCompatible("varchar", ["int"])).toBe(false);
  });

  it("treats MySQL JSON as compatible with expected JSON", () => {
    expect(typesCompatible("json", ["json"])).toBe(true);
  });

  it("does not treat LONGTEXT as JSON without flavor rules", () => {
    expect(typesCompatible("longtext", ["json"])).toBe(false);
  });
});

describe("columnTypesCompatible", () => {
  it("accepts MySQL JSON for expected JSON", () => {
    expect(columnTypesCompatible({ dataType: "json", nullable: false }, ["json"], "mysql")).toBe(
      true,
    );
  });

  it("rejects MySQL ordinary LONGTEXT for expected JSON", () => {
    expect(
      columnTypesCompatible({ dataType: "longtext", nullable: false }, ["json"], "mysql"),
    ).toBe(false);
  });

  it("accepts MariaDB JSON represented as LONGTEXT with JSON_VALID alias", () => {
    expect(
      columnTypesCompatible(
        { dataType: "longtext", nullable: false, mariaDbJsonAlias: true },
        ["json"],
        "mariadb",
        "available",
      ),
    ).toBe(true);
  });

  it("rejects MariaDB LONGTEXT without JSON_VALID when inspection was available", () => {
    expect(
      columnTypesCompatible(
        { dataType: "longtext", nullable: false },
        ["json"],
        "mariadb",
        "available",
      ),
    ).toBe(false);
  });

  it("narrowly accepts MariaDB LONGTEXT for JSON only when constraint inspection is unavailable", () => {
    expect(
      columnTypesCompatible(
        { dataType: "longtext", nullable: false },
        ["json"],
        "mariadb",
        "unavailable",
      ),
    ).toBe(true);
    expect(
      columnTypesCompatible(
        { dataType: "text", nullable: false },
        ["json"],
        "mariadb",
        "unavailable",
      ),
    ).toBe(false);
  });

  it("still rejects ordinary incompatible types", () => {
    expect(
      columnTypesCompatible({ dataType: "varchar", nullable: false }, ["int"], "mariadb"),
    ).toBe(false);
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

  it("detects a missing enquiries table", () => {
    const actual = currentSnapshot();
    delete actual.tables.enquiries;
    expect(diffExpectedSchema(actual).some((issue) => issue.message === "enquiries table")).toBe(
      true,
    );
  });

  it("detects a missing admin_push_subscriptions table", () => {
    const actual = currentSnapshot();
    delete actual.tables.admin_push_subscriptions;
    expect(
      diffExpectedSchema(actual).some(
        (issue) => issue.message === "admin_push_subscriptions table",
      ),
    ).toBe(true);
  });

  it("does not recreate an existing enquiries table", () => {
    const issues = diffExpectedSchema(currentSnapshot());
    expect(issues.some((issue) => issue.table === "enquiries")).toBe(false);
  });

  it("passes a fully current schema", () => {
    expect(diffExpectedSchema(currentSnapshot())).toEqual([]);
    expect(formatVerifyFailure([])).toContain("Database schema is outdated.");
  });

  it("passes production-equivalent MariaDB JSON LONGTEXT for products.details", () => {
    const issues = diffExpectedSchema(mariaDbProductionLikeSnapshot());
    expect(issues.some((issue) => issue.target === "details")).toBe(false);
  });

  it("passes production-equivalent MariaDB JSON LONGTEXT for services.bullets", () => {
    const issues = diffExpectedSchema(mariaDbProductionLikeSnapshot());
    expect(issues.some((issue) => issue.target === "bullets")).toBe(false);
  });

  it("fails MySQL LONGTEXT where JSON is expected", () => {
    const actual = currentSnapshot("mysql");
    actual.tables.products.columns.details = { dataType: "longtext", nullable: false };
    const issues = diffExpectedSchema(actual);
    expect(
      issues.some(
        (issue) =>
          issue.kind === "incompatible_column" && issue.message.includes("products.details"),
      ),
    ).toBe(true);
    expect(planEnsureActions(issues).apply.some((issue) => issue.target === "details")).toBe(false);
  });

  it("treats a second ensure pass as a no-op", () => {
    const first = planEnsureActions(diffExpectedSchema(emptySnapshot()));
    expect(first.apply.length).toBeGreaterThan(0);
    expect(planEnsureActions(diffExpectedSchema(currentSnapshot())).apply).toEqual([]);
    expect(planEnsureActions(diffExpectedSchema(mariaDbProductionLikeSnapshot())).apply).toEqual(
      [],
    );
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
