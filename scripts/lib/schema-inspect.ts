import type { Connection, RowDataPacket } from "mysql2/promise";

import {
  detectDatabaseFlavor,
  parseMariaDbJsonValidColumns,
  type DatabaseFlavor,
  type MariaDbJsonConstraintInspection,
  type SchemaSnapshot,
  type SchemaTableSnapshot,
} from "../../src/lib/schema-expectations";

type TableRow = RowDataPacket & { TABLE_NAME: string };
type ColumnRow = RowDataPacket & {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
};
type IndexRow = RowDataPacket & {
  TABLE_NAME: string;
  INDEX_NAME: string;
  COLUMN_NAME: string;
  NON_UNIQUE: number;
  SEQ_IN_INDEX: number;
};
type VersionRow = RowDataPacket & { VERSION: string };
type CheckRow = RowDataPacket & {
  TABLE_NAME: string | null;
  CHECK_CLAUSE: string;
  CONSTRAINT_NAME: string;
};
type CreateTableRow = RowDataPacket & {
  Table: string;
  "Create Table": string;
};

async function loadMariaDbJsonAliasColumns(
  conn: Connection,
  tableNames: string[],
): Promise<{
  inspection: MariaDbJsonConstraintInspection;
  columns: Set<string>;
}> {
  const columns = new Set<string>();

  try {
    // MariaDB exposes TABLE_NAME on CHECK_CONSTRAINTS; JSON columns usually have
    // CHECK (json_valid(`column`)).
    const [checks] = await conn.query<CheckRow[]>(
      `SELECT CONSTRAINT_NAME, CHECK_CLAUSE, TABLE_NAME
       FROM information_schema.CHECK_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE()
         AND LOWER(CHECK_CLAUSE) LIKE '%json_valid%'`,
    );

    for (const check of checks) {
      for (const columnName of parseMariaDbJsonValidColumns(check.CHECK_CLAUSE)) {
        if (check.TABLE_NAME) {
          columns.add(`${check.TABLE_NAME}.${columnName}`);
        } else {
          columns.add(`*.${columnName}`);
        }
      }
    }

    // Fallback when CHECK_CONSTRAINTS is empty/incomplete: SHOW CREATE TABLE.
    if (columns.size === 0 && tableNames.length > 0) {
      for (const tableName of tableNames) {
        try {
          const [rows] = await conn.query<CreateTableRow[]>(`SHOW CREATE TABLE \`${tableName}\``);
          const createSql = rows[0]?.["Create Table"] ?? "";
          for (const columnName of parseMariaDbJsonValidColumns(createSql)) {
            columns.add(`${tableName}.${columnName}`);
          }
        } catch {
          // Ignore per-table SHOW CREATE failures; keep whatever we already found.
        }
      }
    }

    return { inspection: "available", columns };
  } catch {
    return { inspection: "unavailable", columns };
  }
}

function markMariaDbJsonAliases(snapshot: SchemaSnapshot, aliasKeys: Set<string>) {
  for (const [tableName, table] of Object.entries(snapshot.tables)) {
    for (const [columnName, column] of Object.entries(table.columns)) {
      if (column.dataType.toLowerCase() !== "longtext") continue;
      if (aliasKeys.has(`${tableName}.${columnName}`) || aliasKeys.has(`*.${columnName}`)) {
        column.mariaDbJsonAlias = true;
      }
    }
  }
}

export async function inspectSchema(conn: Connection): Promise<SchemaSnapshot> {
  const [versionRows] = await conn.query<VersionRow[]>("SELECT VERSION() AS VERSION");
  const flavor: DatabaseFlavor = detectDatabaseFlavor(versionRows[0]?.VERSION ?? "");

  const [tables] = await conn.query<TableRow[]>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
  );
  const [columns] = await conn.query<ColumnRow[]>(
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()`,
  );
  const [indexes] = await conn.query<IndexRow[]>(
    `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
  );

  const snapshot: SchemaSnapshot = {
    flavor,
    mariaDbJsonConstraintInspection: flavor === "mariadb" ? "unavailable" : "not_applicable",
    tables: {},
  };

  for (const table of tables) {
    snapshot.tables[table.TABLE_NAME] = { columns: {}, uniques: [] };
  }

  for (const column of columns) {
    const table = snapshot.tables[column.TABLE_NAME] ?? { columns: {}, uniques: [] };
    table.columns[column.COLUMN_NAME] = {
      dataType: column.DATA_TYPE,
      nullable: column.IS_NULLABLE === "YES",
    };
    snapshot.tables[column.TABLE_NAME] = table;
  }

  const uniqueMap = new Map<string, { name: string; columns: string[] }>();
  for (const index of indexes) {
    if (index.NON_UNIQUE !== 0 || index.INDEX_NAME === "PRIMARY") continue;
    const key = `${index.TABLE_NAME}.${index.INDEX_NAME}`;
    const current = uniqueMap.get(key) ?? { name: index.INDEX_NAME, columns: [] };
    current.columns[index.SEQ_IN_INDEX - 1] = index.COLUMN_NAME;
    uniqueMap.set(key, current);
  }

  for (const [key, unique] of uniqueMap) {
    const tableName = key.slice(0, key.indexOf("."));
    const table: SchemaTableSnapshot = snapshot.tables[tableName] ?? { columns: {}, uniques: [] };
    table.uniques.push({ name: unique.name, columns: unique.columns.filter(Boolean) });
    snapshot.tables[tableName] = table;
  }

  if (flavor === "mariadb") {
    const { inspection, columns: aliasKeys } = await loadMariaDbJsonAliasColumns(
      conn,
      Object.keys(snapshot.tables),
    );
    snapshot.mariaDbJsonConstraintInspection = inspection;
    markMariaDbJsonAliases(snapshot, aliasKeys);
  }

  return snapshot;
}
