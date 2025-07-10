import { sqlX } from "../SQLTag/sql";

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


export async function getRelationships(sql: typeof sqlX) {
  /*
    Query 1: foreignKeysQuery
    -------------------------
    This query retrieves detailed information about FOREIGN KEY constraints along with
    associated UNIQUE constraints and PRIMARY KEYS from the database, using the
    information_schema views. It does NOT include unique indexes created outside of constraints.

    Step-by-step explanation:
    1. key_columns CTE:
      - Aggregates the columns involved in each constraint (by constraint_name, table_name, schema)
      - Uses information_schema.key_column_usage to get column order and names

    2. foreign_columns CTE:
      - Retrieves the columns referenced by foreign key constraints
      - Uses information_schema.constraint_column_usage which shows columns referenced by constraints
      - Aggregates referenced columns for each constraint

    3. unique_constraints CTE:
      - Collects all UNIQUE and PRIMARY KEY constraints from the database
      - Joins key_column_usage to get the columns involved in those constraints
      - Aggregates columns for each unique or PK constraint

    4. Final SELECT:
      - Selects foreign key constraints (tc.constraint_type = 'FOREIGN KEY')
      - Joins with key_columns and foreign_columns to get the local and referenced columns
      - Uses EXISTS subquery to check if the foreign key columns match any unique or primary key constraint columns
      - Returns schema, table, columns, constraint names, and whether a unique constraint exists on those columns

    This query is safe, relies only on standard information_schema views, and works across schemas.

  */
  const foreignKeys = await sql<{}, { table_name: string; table_schema: string; column_names: string; foreign_column_names: string; foreign_table_name: string; foreign_table_schema: string; constraint_name: string; unique: boolean}>`
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

  ` ().then (rows =>
        rows.map (rel => ({
          ...rel,
          column_names: rel.column_names.replace (/^{|}$/g, "").split (","),
          foreign_column_names: rel.foreign_column_names.replace (/^{|}$/g, "").split (",")
        })));

  /*
    Query 2: uniqueIndexesQuery
    ---------------------------
    This query retrieves all UNIQUE indexes (including those created manually, not via constraints)
    directly from PostgreSQL's system catalog view pg_indexes.

    Explanation:
    - Selects schema, table, index name, and full index definition from pg_indexes
    - Filters with ILIKE 'CREATE UNIQUE INDEX%' to get only unique indexes
    - Orders results by schema, table, and index name for readability

    Important:
    - Accessing pg_indexes touches system catalogs and can cause errors if the catalogs are corrupted.
    - This is why it is run separately from the first query.
    - Parsing the index definition string later allows extracting the indexed columns for comparison.

  */
  const uniqueIndexes = await sql<{}, { table_schema: string; table_name: string; indexname: string; indexdef: string }>`
    SELECT
      schemaname AS table_schema,
      tablename AS table_name,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE indexdef ILIKE 'CREATE UNIQUE INDEX%'
    ORDER BY schemaname, tablename, indexname;
  ` ();

  // Helper function to extract column names from the index definition string.
  // For example: "CREATE UNIQUE INDEX idx_name ON schema.table (col1, col2)"
  // returns ['col1', 'col2']
  function parseIndexColumns(indexdef: string) {
    const match = indexdef.match (/\((.*)\)/);
    if (!match) return [];
    // split columns by comma, trim whitespace
    return match[1].split (",").map (col => col.trim ().replace (/"/g, ""));
  }

  // Create a lookup map to find unique indexes by table schema, table name, and indexed columns
  const uniqueIndexMap = new Map ();

  for (const idx of uniqueIndexes) {
    const cols = parseIndexColumns (idx.indexdef);
    const key = `${idx.table_schema}.${idx.table_name}:${cols.join (",")}`;
      uniqueIndexMap.set (key, idx);
  }

  // Merge unique index info into foreign keys by matching table/schema and column names
  for (let fk of foreignKeys) {
    const colKey = fk.column_names.join (",");
    const key = `${fk.table_schema}.${fk.table_name}:${colKey}`;
    fk.unique = uniqueIndexMap.has (key);
  }


  return foreignKeys;
}