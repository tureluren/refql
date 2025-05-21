import { sqlX } from "../SQLTag/sql.ts";

export async function getTables(sql: typeof sqlX) {
  const res = await sql<{}, {table_schema: string; table_name: string}>`
    select table_schema, table_name
    from information_schema.tables
    where table_schema not in ('pg_catalog', 'information_schema')
    order by table_schema, table_name
  ` ();

  return res.reduce<Record<string, {table_schema: string; table_name: string}[]>> ((acc, item) => {
    if (!acc[item.table_schema]) {
      acc[item.table_schema] = [];
    }
    acc[item.table_schema].push (item);
    return acc;
  }, {});
}

export async function getColumns(sql: typeof sqlX, tableName: string) {
  const res = await sql<{tableName: string }, { column_name: string; data_type: string; is_nullable: string; column_default: string }>`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = ${p => p.tableName}
  ` ({ tableName });

  return res;
}

/**
 * Retrieves all foreign key relationships in the database.
 *
 * This query extracts relationships by combining information from the
 * `information_schema` views:
 * - `key_column_usage`: Contains information about columns involved in constraints.
 * - `constraint_column_usage`: Maps constraints to the referenced table and columns.
 * - `table_constraints`: Identifies foreign key constraints.
 *
 * The results include:
 * - `table_name`: The name of the table containing the foreign key.
 * - `table_schema`: The name of the table's schema.
 * - `column_names`: The columns acting as the foreign key, in correct order.
 * - `foreign_column_names`: The referenced columns in the foreign table.
 * - `foreign_table_name`: The name of the referenced (foreign) table.
 * - `foreign_table_schema`: The name of the foreign table's schema.
 * - `constraint_name`: The name of the foreign key constraint.
 *
 * Notes:
 * - Uses `ordinal_position` to ensure composite foreign keys maintain column order.
 * - Aggregates columns into arrays for cleaner output.
 * - Returns all foreign key constraints, irrespective of uniqueness.
 *
 * @returns A list of foreign key relationships, including table and column details.
 */
export async function getRelationships(sql: typeof sqlX) {
  const res = await sql<{}, { table_name: string; table_schema: string; column_names: string; foreign_column_names: string; foreign_table_name: string; foreign_table_schema: string; constraint_name: string; unique: boolean}>`
    WITH key_columns AS (
        SELECT
            kcu.constraint_name,
            kcu.table_name,
            kcu.table_schema,
            ARRAY_AGG(kcu.column_name ORDER BY kcu.ordinal_position) AS column_names
        FROM
            information_schema.key_column_usage kcu
        GROUP BY
            kcu.constraint_name, kcu.table_name, kcu.table_schema
    ),
    foreign_columns AS (
        SELECT
            ccu.constraint_name,
            ccu.table_name AS foreign_table_name,
            ccu.table_schema AS foreign_table_schema,
            ARRAY_AGG(ccu.column_name) AS foreign_column_names
        FROM
            information_schema.constraint_column_usage ccu
        GROUP BY
            ccu.constraint_name, ccu.table_name, ccu.table_schema
    ),
    unique_constraints AS (
        SELECT
            tc.constraint_name,
            tc.table_name,
            tc.table_schema,
            ARRAY_AGG(kcu.column_name ORDER BY kcu.ordinal_position) AS column_names
        FROM
            information_schema.table_constraints tc
        JOIN
            information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE
            tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
        GROUP BY
            tc.constraint_name, tc.table_name, tc.table_schema
    )
    SELECT DISTINCT
        tc.table_name AS table_name,
        tc.table_schema AS table_schema,
        kc.column_names,
        fc.foreign_column_names,
        fc.foreign_table_name,
        fc.foreign_table_schema,
        tc.constraint_name,
        EXISTS (
            SELECT 1
            FROM unique_constraints uc
            WHERE
                uc.table_name = tc.table_name AND
                uc.table_schema = tc.table_schema AND
                uc.column_names = kc.column_names
        ) AS "unique"
    FROM
        information_schema.table_constraints tc
    JOIN
        key_columns kc ON tc.constraint_name = kc.constraint_name
    JOIN
        foreign_columns fc ON tc.constraint_name = fc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
    ORDER BY
        tc.table_name, tc.table_schema, tc.constraint_name;

  ` ();

  return res;
}