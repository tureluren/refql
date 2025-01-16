import { query } from "./db";

export async function getTables() {
  const res = await query (`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return res.rows.map ((row: any) => row.table_name);
}

export async function getColumns(tableName: string) {
  const res = await query (`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
  `, [tableName]);
  return res.rows;
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
 * - `column_names`: The columns acting as the foreign key, in correct order.
 * - `foreign_column_names`: The referenced columns in the foreign table.
 * - `foreign_table_name`: The name of the referenced (foreign) table.
 * - `constraint_name`: The name of the foreign key constraint.
 *
 * Notes:
 * - Uses `ordinal_position` to ensure composite foreign keys maintain column order.
 * - Aggregates columns into arrays for cleaner output.
 * - Returns all foreign key constraints, irrespective of uniqueness.
 *
 * @returns A list of foreign key relationships, including table and column details.
 */
export async function getRelationships() {
  const res = await query (`
    WITH key_columns AS (
        SELECT
            kcu.constraint_name,
            kcu.table_name,
            ARRAY_AGG(kcu.column_name ORDER BY kcu.ordinal_position) AS column_names
        FROM
            information_schema.key_column_usage kcu
        GROUP BY
            kcu.constraint_name, kcu.table_name
    ),
    foreign_columns AS (
        SELECT
            ccu.constraint_name,
            ccu.table_name AS foreign_table_name,
            ARRAY_AGG(ccu.column_name) AS foreign_column_names
        FROM
            information_schema.constraint_column_usage ccu
        GROUP BY
            ccu.constraint_name, ccu.table_name
    )
    SELECT DISTINCT
        tc.table_name AS table_name,
        kc.column_names,
        fc.foreign_column_names,
        fc.foreign_table_name,
        tc.constraint_name
    FROM
        information_schema.table_constraints tc
    JOIN
        key_columns kc ON tc.constraint_name = kc.constraint_name
    JOIN
        foreign_columns fc ON tc.constraint_name = fc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
    ORDER BY
        tc.table_name, tc.constraint_name;
  `);

  return res.rows;
}

/**
 * Fetches all unique foreign key relationships for one-to-one mappings.
 *
 * This query identifies relationships where a foreign key is either:
 * 1. A unique key in its own table.
 * 2. Pointing to a primary key or unique key in the referenced table.
 *
 * The query uses PostgreSQL catalogs (`pg_constraint`, `pg_attribute`, and `pg_index`)
 * to ensure efficiency and precision. It combines:
 * - `pg_constraint`: To retrieve foreign key constraints.
 * - `pg_attribute`: To map constraints to specific columns.
 * - `pg_index`: To identify unique constraints and primary keys.
 *
 * The results include:
 * - `fk_table`: The table containing the foreign key.
 * - `fk_column`: The specific foreign key column.
 * - `ref_table`: The referenced (foreign) table.
 *
 * Notes:
 * - Filters only one-to-one relationships based on uniqueness constraints.
 * - Ensures single-column keys are distinguished from multi-column keys.
 *
 * @returns A list of one-to-one relationships with table and column details.
 */
export async function getOneToOneRelationships(): Promise<
  { fk_table: string; fk_column: string; ref_table: string; ref_column_pos: number; fk_name: string }[]
  > {
  const result = await query (`
    WITH unique_foreign_keys AS (
      SELECT
        conname AS fk_name,                       -- Foreign key constraint name
        conrelid::regclass::text AS fk_table,     -- Foreign key table
        a.attname AS fk_column,                   -- Foreign key column
        confrelid::regclass::text AS ref_table,   -- Referenced table
        confkey[1] AS ref_column_pos              -- Referenced column position in index
      FROM
        pg_constraint
      JOIN pg_attribute a ON
        a.attnum = ANY(pg_constraint.conkey) AND a.attrelid = conrelid
      WHERE
        contype = 'f' -- Foreign key constraints only
    ),
    unique_columns AS (
      SELECT DISTINCT
        t.relname AS table_name,
        a.attname AS column_name
      FROM
        pg_index i
      JOIN pg_class t ON i.indrelid = t.oid
      JOIN pg_attribute a ON a.attnum = ANY(i.indkey) AND a.attrelid = t.oid
      WHERE
        i.indisunique = TRUE -- Only unique indexes
        AND i.indisprimary = FALSE -- Exclude primary keys
    ),
    primary_foreign_keys AS (
      SELECT
        conrelid::regclass::text AS fk_table,     -- Foreign key table
        a.attname AS fk_column,                   -- Foreign key column
        conname AS fk_name                        -- Foreign key constraint name
      FROM
        pg_constraint
      JOIN pg_attribute a ON
        a.attnum = ANY(pg_constraint.conkey) AND a.attrelid = conrelid
      WHERE
        contype = 'f' -- Foreign key constraints only
    ),
    primary_keys AS (
      SELECT
        conrelid::regclass::text AS pk_table,     -- Primary key table
        a.attname AS pk_column,                   -- Primary key column
        COUNT(a.attname) OVER (PARTITION BY conrelid::regclass) AS pk_column_count  -- Count the number of columns in the primary key
      FROM
        pg_constraint
      JOIN pg_attribute a ON
        a.attnum = ANY(pg_constraint.conkey) AND a.attrelid = conrelid
      WHERE
        contype = 'p' -- Primary key constraints only
    )
    -- Combine both unique foreign keys and primary foreign keys
    SELECT DISTINCT
      fk.fk_table,
      fk.fk_column,
      fk.ref_table,
      fk.fk_name                                -- Include the constraint name
    FROM
      unique_foreign_keys fk
    JOIN
      unique_columns uc
      ON fk.fk_table = uc.table_name AND fk.fk_column = uc.column_name
    UNION
    SELECT
      fk.fk_table,
      fk.fk_column,
      pk.pk_table AS ref_table,
      fk.fk_name                                -- Include the constraint name
    FROM
      primary_foreign_keys fk
    JOIN
      primary_keys pk
      ON fk.fk_table = pk.pk_table
      AND fk.fk_column = pk.pk_column
      AND pk.pk_column_count = 1;

  `);

  return result.rows;
}