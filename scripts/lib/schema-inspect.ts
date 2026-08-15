import type { Connection, RowDataPacket } from "mysql2/promise";

import type { SchemaSnapshot, SchemaTableSnapshot } from "../../src/lib/schema-expectations";

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

export async function inspectSchema(conn: Connection): Promise<SchemaSnapshot> {
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

  const snapshot: SchemaSnapshot = { tables: {} };

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

  return snapshot;
}
