export type DatabaseFlavor = "mysql" | "mariadb";

/** How MariaDB JSON_VALID check-constraint inspection completed. */
export type MariaDbJsonConstraintInspection = "not_applicable" | "available" | "unavailable";

export type SchemaColumnSnapshot = {
  dataType: string;
  nullable: boolean;
  /**
   * True when MariaDB stores this column as LONGTEXT with a JSON_VALID check
   * (the normal representation of a JSON column on MariaDB/Hostinger).
   */
  mariaDbJsonAlias?: boolean;
};

export type SchemaUniqueSnapshot = {
  name: string;
  columns: string[];
};

export type SchemaTableSnapshot = {
  columns: Record<string, SchemaColumnSnapshot>;
  uniques: SchemaUniqueSnapshot[];
};

export type SchemaSnapshot = {
  flavor: DatabaseFlavor;
  mariaDbJsonConstraintInspection: MariaDbJsonConstraintInspection;
  tables: Record<string, SchemaTableSnapshot>;
};

export type SchemaIssueKind =
  | "missing_table"
  | "missing_column"
  | "missing_unique"
  | "incompatible_column";

export type SchemaIssue = {
  kind: SchemaIssueKind;
  table: string;
  target: string;
  message: string;
  fixable: boolean;
  sql?: string;
};

export type ExpectedColumn = {
  name: string;
  allowedTypes: string[];
  nullable: boolean;
  addSql?: string;
};

export type ExpectedUnique = {
  name: string;
  columns: string[];
  addSql: string;
};

export type ExpectedTable = {
  name: string;
  createSql: string;
  columns: ExpectedColumn[];
  uniques: ExpectedUnique[];
};

const TYPE_FAMILY: Record<string, string> = {
  int: "int",
  integer: "int",
  tinyint: "tinyint",
  boolean: "tinyint",
  bool: "tinyint",
  varchar: "varchar",
  text: "text",
  mediumtext: "text",
  longtext: "text",
  json: "json",
  timestamp: "timestamp",
  datetime: "timestamp",
};

export function normalizeMysqlType(dataType: string) {
  return TYPE_FAMILY[dataType.toLowerCase()] ?? dataType.toLowerCase();
}

export function detectDatabaseFlavor(version: string): DatabaseFlavor {
  return /mariadb/i.test(version) ? "mariadb" : "mysql";
}

/** Extract column names referenced by MariaDB `json_valid(...)` check clauses. */
export function parseMariaDbJsonValidColumns(checkClause: string): string[] {
  const columns: string[] = [];
  const pattern = /json_valid\s*\(\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)"|([A-Za-z_][\w$]*))\s*\)/gi;
  for (const match of checkClause.matchAll(pattern)) {
    const name = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (name) columns.push(name);
  }
  return columns;
}

function allowsJson(allowedTypes: string[]) {
  return allowedTypes.some((type) => normalizeMysqlType(type) === "json");
}

/**
 * Compatibility for inspected columns.
 *
 * MySQL: expected JSON requires an actual JSON type (LONGTEXT alone is not enough).
 * MariaDB: JSON is an alias for LONGTEXT; prefer a JSON_VALID check, and only fall
 * back to accepting bare LONGTEXT when constraint inspection was unavailable.
 */
export function columnTypesCompatible(
  actual: SchemaColumnSnapshot,
  allowedTypes: string[],
  flavor: DatabaseFlavor,
  mariaDbJsonConstraintInspection: MariaDbJsonConstraintInspection = "not_applicable",
) {
  if (typesCompatible(actual.dataType, allowedTypes)) return true;

  if (!allowsJson(allowedTypes)) return false;
  if (flavor !== "mariadb") return false;
  if (actual.dataType.toLowerCase() !== "longtext") return false;

  if (actual.mariaDbJsonAlias) return true;

  // Narrow fallback: only when we could not inspect CHECK constraints on MariaDB.
  // Do not treat arbitrary LONGTEXT as JSON when inspection succeeded and found no JSON_VALID.
  return mariaDbJsonConstraintInspection === "unavailable";
}

/** Exact type-family match (no MariaDB JSON alias rules). */
export function typesCompatible(actualType: string, allowedTypes: string[]) {
  const actual = normalizeMysqlType(actualType);
  return allowedTypes.some((type) => normalizeMysqlType(type) === actual);
}

export function uniqueColumnsMatch(actual: string[], expected: string[]) {
  if (actual.length !== expected.length) return false;
  return actual.every((column, index) => column === expected[index]);
}

export const EXPECTED_TABLES: ExpectedTable[] = [
  {
    name: "admin_users",
    createSql: `CREATE TABLE IF NOT EXISTS \`admin_users\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`email\` varchar(256) NOT NULL,
      \`password_hash\` varchar(256) NOT NULL,
      \`name\` varchar(128) NOT NULL,
      \`session_version\` int NOT NULL DEFAULT 0,
      CONSTRAINT \`admin_users_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`admin_users_email_unique\` UNIQUE(\`email\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "email", allowedTypes: ["varchar"], nullable: false },
      { name: "password_hash", allowedTypes: ["varchar"], nullable: false },
      { name: "name", allowedTypes: ["varchar"], nullable: false },
      {
        name: "session_version",
        allowedTypes: ["int"],
        nullable: false,
        addSql: "ALTER TABLE `admin_users` ADD `session_version` int NOT NULL DEFAULT 0",
      },
    ],
    uniques: [
      {
        name: "admin_users_email_unique",
        columns: ["email"],
        addSql: "ALTER TABLE `admin_users` ADD UNIQUE `admin_users_email_unique` (`email`)",
      },
    ],
  },
  {
    name: "admin_login_attempts",
    createSql: `CREATE TABLE IF NOT EXISTS \`admin_login_attempts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`scope\` varchar(16) NOT NULL,
      \`attempt_key\` varchar(320) NOT NULL,
      \`failure_count\` int NOT NULL DEFAULT 0,
      \`window_started_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`locked_until\` timestamp NULL,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`admin_login_attempts_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`admin_login_attempts_scope_key\` UNIQUE(\`scope\`, \`attempt_key\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "scope", allowedTypes: ["varchar"], nullable: false },
      { name: "attempt_key", allowedTypes: ["varchar"], nullable: false },
      { name: "failure_count", allowedTypes: ["int"], nullable: false },
      { name: "window_started_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
      { name: "locked_until", allowedTypes: ["timestamp", "datetime"], nullable: true },
      { name: "updated_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
    ],
    uniques: [
      {
        name: "admin_login_attempts_scope_key",
        columns: ["scope", "attempt_key"],
        addSql:
          "ALTER TABLE `admin_login_attempts` ADD UNIQUE `admin_login_attempts_scope_key` (`scope`, `attempt_key`)",
      },
    ],
  },
  {
    name: "categories",
    createSql: `CREATE TABLE IF NOT EXISTS \`categories\` (
      \`id\` varchar(32) NOT NULL,
      \`label\` varchar(128) NOT NULL,
      \`blurb\` text NOT NULL,
      \`meta_title\` varchar(120),
      \`meta_description\` text,
      \`image_path\` varchar(512) NOT NULL DEFAULT '',
      \`sort_order\` int NOT NULL DEFAULT 0,
      CONSTRAINT \`categories_id\` PRIMARY KEY(\`id\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["varchar"], nullable: false },
      { name: "label", allowedTypes: ["varchar"], nullable: false },
      { name: "blurb", allowedTypes: ["text"], nullable: false },
      {
        name: "meta_title",
        allowedTypes: ["varchar"],
        nullable: true,
        addSql: "ALTER TABLE `categories` ADD `meta_title` varchar(120)",
      },
      {
        name: "meta_description",
        allowedTypes: ["text"],
        nullable: true,
        addSql: "ALTER TABLE `categories` ADD `meta_description` text",
      },
      { name: "image_path", allowedTypes: ["varchar"], nullable: false },
      { name: "sort_order", allowedTypes: ["int"], nullable: false },
    ],
    uniques: [],
  },
  {
    name: "products",
    createSql: `CREATE TABLE IF NOT EXISTS \`products\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`slug\` varchar(128) NOT NULL,
      \`name\` varchar(256) NOT NULL,
      \`category_id\` varchar(32) NOT NULL,
      \`blurb\` text NOT NULL,
      \`meta_title\` varchar(120),
      \`meta_description\` text,
      \`description\` text NOT NULL,
      \`details\` json NOT NULL,
      \`image_path\` varchar(512) NOT NULL DEFAULT '',
      \`price_from\` varchar(64),
      \`is_active\` boolean NOT NULL DEFAULT true,
      \`featured_on_homepage\` boolean NOT NULL DEFAULT false,
      \`homepage_sort_order\` int NOT NULL DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`products_slug_unique\` UNIQUE(\`slug\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "slug", allowedTypes: ["varchar"], nullable: false },
      { name: "name", allowedTypes: ["varchar"], nullable: false },
      { name: "category_id", allowedTypes: ["varchar"], nullable: false },
      { name: "blurb", allowedTypes: ["text"], nullable: false },
      {
        name: "meta_title",
        allowedTypes: ["varchar"],
        nullable: true,
        addSql: "ALTER TABLE `products` ADD `meta_title` varchar(120)",
      },
      {
        name: "meta_description",
        allowedTypes: ["text"],
        nullable: true,
        addSql: "ALTER TABLE `products` ADD `meta_description` text",
      },
      { name: "description", allowedTypes: ["text"], nullable: false },
      { name: "details", allowedTypes: ["json"], nullable: false },
      { name: "image_path", allowedTypes: ["varchar"], nullable: false },
      { name: "price_from", allowedTypes: ["varchar"], nullable: true },
      {
        name: "is_active",
        allowedTypes: ["tinyint", "boolean"],
        nullable: false,
        addSql: "ALTER TABLE `products` ADD `is_active` boolean NOT NULL DEFAULT true",
      },
      {
        name: "featured_on_homepage",
        allowedTypes: ["tinyint", "boolean"],
        nullable: false,
        addSql: "ALTER TABLE `products` ADD `featured_on_homepage` boolean NOT NULL DEFAULT false",
      },
      {
        name: "homepage_sort_order",
        allowedTypes: ["int"],
        nullable: false,
        addSql: "ALTER TABLE `products` ADD `homepage_sort_order` int NOT NULL DEFAULT 0",
      },
      { name: "created_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
      { name: "updated_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
    ],
    uniques: [
      {
        name: "products_slug_unique",
        columns: ["slug"],
        addSql: "ALTER TABLE `products` ADD UNIQUE `products_slug_unique` (`slug`)",
      },
    ],
  },
  {
    name: "services",
    createSql: `CREATE TABLE IF NOT EXISTS \`services\` (
      \`id\` varchar(64) NOT NULL,
      \`title\` varchar(256) NOT NULL,
      \`blurb\` text NOT NULL,
      \`bullets\` json NOT NULL,
      \`image_path\` varchar(512) NOT NULL DEFAULT '',
      \`sort_order\` int NOT NULL DEFAULT 0,
      CONSTRAINT \`services_id\` PRIMARY KEY(\`id\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["varchar"], nullable: false },
      { name: "title", allowedTypes: ["varchar"], nullable: false },
      { name: "blurb", allowedTypes: ["text"], nullable: false },
      { name: "bullets", allowedTypes: ["json"], nullable: false },
      { name: "image_path", allowedTypes: ["varchar"], nullable: false },
      { name: "sort_order", allowedTypes: ["int"], nullable: false },
    ],
    uniques: [],
  },
  {
    name: "testimonials",
    createSql: `CREATE TABLE IF NOT EXISTS \`testimonials\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`quote\` text NOT NULL,
      \`customer_name\` varchar(128) NOT NULL,
      \`location\` varchar(128) NOT NULL,
      \`context\` varchar(128) NOT NULL,
      \`sort_order\` int NOT NULL DEFAULT 0,
      CONSTRAINT \`testimonials_id\` PRIMARY KEY(\`id\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "quote", allowedTypes: ["text"], nullable: false },
      { name: "customer_name", allowedTypes: ["varchar"], nullable: false },
      { name: "location", allowedTypes: ["varchar"], nullable: false },
      { name: "context", allowedTypes: ["varchar"], nullable: false },
      { name: "sort_order", allowedTypes: ["int"], nullable: false },
    ],
    uniques: [],
  },
  {
    name: "site_settings",
    createSql: `CREATE TABLE IF NOT EXISTS \`site_settings\` (
      \`id\` int NOT NULL DEFAULT 1,
      \`whatsapp_number\` varchar(32) NOT NULL,
      \`email\` varchar(256) NOT NULL,
      \`instagram_url\` varchar(512) NOT NULL,
      \`instagram_handle\` varchar(64) NOT NULL,
      \`founder\` varchar(128) NOT NULL,
      \`location\` varchar(256) NOT NULL,
      \`services_intro\` text NOT NULL DEFAULT (''),
      \`services_footer_title\` varchar(256) NOT NULL DEFAULT (''),
      \`services_footer_blurb\` text NOT NULL DEFAULT (''),
      \`testimonials_heading\` varchar(256) NOT NULL DEFAULT (''),
      CONSTRAINT \`site_settings_id\` PRIMARY KEY(\`id\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "whatsapp_number", allowedTypes: ["varchar"], nullable: false },
      { name: "email", allowedTypes: ["varchar"], nullable: false },
      { name: "instagram_url", allowedTypes: ["varchar"], nullable: false },
      { name: "instagram_handle", allowedTypes: ["varchar"], nullable: false },
      { name: "founder", allowedTypes: ["varchar"], nullable: false },
      { name: "location", allowedTypes: ["varchar"], nullable: false },
      {
        name: "services_intro",
        allowedTypes: ["text"],
        nullable: false,
        addSql: "ALTER TABLE `site_settings` ADD `services_intro` text NOT NULL DEFAULT ('')",
      },
      {
        name: "services_footer_title",
        allowedTypes: ["varchar"],
        nullable: false,
        addSql:
          "ALTER TABLE `site_settings` ADD `services_footer_title` varchar(256) NOT NULL DEFAULT ('')",
      },
      {
        name: "services_footer_blurb",
        allowedTypes: ["text"],
        nullable: false,
        addSql:
          "ALTER TABLE `site_settings` ADD `services_footer_blurb` text NOT NULL DEFAULT ('')",
      },
      {
        name: "testimonials_heading",
        allowedTypes: ["varchar"],
        nullable: false,
        addSql:
          "ALTER TABLE `site_settings` ADD `testimonials_heading` varchar(256) NOT NULL DEFAULT ('')",
      },
    ],
    uniques: [],
  },
  {
    name: "blog_posts",
    createSql: `CREATE TABLE IF NOT EXISTS \`blog_posts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`title\` varchar(256) NOT NULL,
      \`slug\` varchar(160) NOT NULL,
      \`excerpt\` text NOT NULL,
      \`content\` text NOT NULL,
      \`featured_image\` varchar(512),
      \`meta_title\` varchar(256),
      \`meta_description\` text,
      \`is_published\` boolean NOT NULL DEFAULT false,
      \`published_at\` timestamp NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`blog_posts_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`blog_posts_slug_unique\` UNIQUE(\`slug\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "title", allowedTypes: ["varchar"], nullable: false },
      { name: "slug", allowedTypes: ["varchar"], nullable: false },
      { name: "excerpt", allowedTypes: ["text"], nullable: false },
      { name: "content", allowedTypes: ["text"], nullable: false },
      { name: "featured_image", allowedTypes: ["varchar"], nullable: true },
      { name: "meta_title", allowedTypes: ["varchar"], nullable: true },
      { name: "meta_description", allowedTypes: ["text"], nullable: true },
      { name: "is_published", allowedTypes: ["tinyint", "boolean"], nullable: false },
      { name: "published_at", allowedTypes: ["timestamp", "datetime"], nullable: true },
      { name: "created_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
      { name: "updated_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
    ],
    uniques: [
      {
        name: "blog_posts_slug_unique",
        columns: ["slug"],
        addSql: "ALTER TABLE `blog_posts` ADD UNIQUE `blog_posts_slug_unique` (`slug`)",
      },
    ],
  },
  {
    name: "enquiries",
    createSql: `CREATE TABLE IF NOT EXISTS \`enquiries\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(128) NOT NULL,
      \`phone\` varchar(32) NOT NULL,
      \`email\` varchar(256),
      \`event_type\` varchar(128),
      \`event_date\` varchar(32),
      \`budget\` varchar(128),
      \`message\` text NOT NULL,
      \`source\` varchar(32) NOT NULL DEFAULT 'general',
      \`product_id\` int,
      \`product_name_snapshot\` varchar(256),
      \`service_id\` varchar(64),
      \`service_title_snapshot\` varchar(256),
      \`status\` varchar(32) NOT NULL DEFAULT 'new',
      \`admin_notes\` text,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`enquiries_id\` PRIMARY KEY(\`id\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "name", allowedTypes: ["varchar"], nullable: false },
      { name: "phone", allowedTypes: ["varchar"], nullable: false },
      { name: "email", allowedTypes: ["varchar"], nullable: true },
      { name: "event_type", allowedTypes: ["varchar"], nullable: true },
      { name: "event_date", allowedTypes: ["varchar"], nullable: true },
      { name: "budget", allowedTypes: ["varchar"], nullable: true },
      { name: "message", allowedTypes: ["text"], nullable: false },
      { name: "source", allowedTypes: ["varchar"], nullable: false },
      { name: "product_id", allowedTypes: ["int"], nullable: true },
      { name: "product_name_snapshot", allowedTypes: ["varchar"], nullable: true },
      { name: "service_id", allowedTypes: ["varchar"], nullable: true },
      { name: "service_title_snapshot", allowedTypes: ["varchar"], nullable: true },
      { name: "status", allowedTypes: ["varchar"], nullable: false },
      { name: "admin_notes", allowedTypes: ["text"], nullable: true },
      { name: "created_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
      { name: "updated_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
    ],
    uniques: [],
  },
  {
    name: "admin_push_subscriptions",
    createSql: `CREATE TABLE IF NOT EXISTS \`admin_push_subscriptions\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`admin_user_id\` int NOT NULL,
      \`endpoint\` text NOT NULL,
      \`endpoint_hash\` varchar(64) NOT NULL,
      \`p256dh\` varchar(256) NOT NULL,
      \`auth\` varchar(128) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`admin_push_subscriptions_id\` PRIMARY KEY(\`id\`),
      UNIQUE KEY \`admin_push_subscriptions_endpoint_hash_unique\` (\`endpoint_hash\`)
    )`,
    columns: [
      { name: "id", allowedTypes: ["int"], nullable: false },
      { name: "admin_user_id", allowedTypes: ["int"], nullable: false },
      { name: "endpoint", allowedTypes: ["text", "longtext", "mediumtext"], nullable: false },
      { name: "endpoint_hash", allowedTypes: ["varchar"], nullable: false },
      { name: "p256dh", allowedTypes: ["varchar"], nullable: false },
      { name: "auth", allowedTypes: ["varchar"], nullable: false },
      { name: "created_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
      { name: "updated_at", allowedTypes: ["timestamp", "datetime"], nullable: false },
    ],
    uniques: [
      {
        name: "admin_push_subscriptions_endpoint_hash_unique",
        columns: ["endpoint_hash"],
        addSql:
          "ALTER TABLE `admin_push_subscriptions` ADD UNIQUE `admin_push_subscriptions_endpoint_hash_unique` (`endpoint_hash`)",
      },
    ],
  },
];

export function tableHasUnique(table: SchemaTableSnapshot, columns: string[]) {
  return table.uniques.some((unique) => uniqueColumnsMatch(unique.columns, columns));
}

export function diffExpectedSchema(
  actual: SchemaSnapshot,
  expected: ExpectedTable[] = EXPECTED_TABLES,
): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const flavor = actual.flavor ?? "mysql";
  const jsonInspection = actual.mariaDbJsonConstraintInspection ?? "not_applicable";

  for (const table of expected) {
    const snapshot = actual.tables[table.name];
    if (!snapshot) {
      issues.push({
        kind: "missing_table",
        table: table.name,
        target: table.name,
        message: `${table.name} table`,
        fixable: true,
        sql: table.createSql,
      });
      continue;
    }

    for (const column of table.columns) {
      const existing = snapshot.columns[column.name];
      if (!existing) {
        issues.push({
          kind: "missing_column",
          table: table.name,
          target: column.name,
          message: `${table.name}.${column.name}`,
          fixable: Boolean(column.addSql),
          sql: column.addSql,
        });
        continue;
      }

      if (!columnTypesCompatible(existing, column.allowedTypes, flavor, jsonInspection)) {
        issues.push({
          kind: "incompatible_column",
          table: table.name,
          target: column.name,
          message: `${table.name}.${column.name} has incompatible type ${existing.dataType}`,
          fixable: false,
        });
      }
    }

    for (const unique of table.uniques) {
      if (!tableHasUnique(snapshot, unique.columns)) {
        issues.push({
          kind: "missing_unique",
          table: table.name,
          target: unique.name,
          message: `${table.name} unique (${unique.columns.join(", ")})`,
          fixable: true,
          sql: unique.addSql,
        });
      }
    }
  }

  return issues;
}

export function planEnsureActions(issues: SchemaIssue[]) {
  return {
    apply: issues.filter((issue) => issue.fixable && issue.sql),
    abort: issues.filter((issue) => !issue.fixable),
  };
}

export function formatVerifyFailure(issues: SchemaIssue[]) {
  const lines = ["Database schema is outdated.", "", "Missing:"];
  for (const issue of issues) {
    lines.push(`- ${issue.message}`);
  }
  return lines.join("\n");
}

export function inferMissingSchemaFromError(error: unknown): string[] {
  const message = error instanceof Error ? error.message : String(error);
  const missing: string[] = [];
  const column = message.match(/unknown column ['`]([^'`]+)['`]/i);
  if (column?.[1]) missing.push(column[1]);
  const table = message.match(/table ['`](?:[\w]+\.)?([^'`]+)['`] doesn't exist/i);
  if (table?.[1]) missing.push(`${table[1]} table`);
  if (
    missing.length === 0 &&
    /unknown column|doesn't exist|er_bad_field|er_no_such_table/i.test(message)
  ) {
    missing.push("run npm run db:verify");
  }
  return missing;
}
