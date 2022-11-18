import { Pool } from "mariadb";

const mariaDBQuerier = (pool: Pool) => async <T>(query: string, values: any[]) => {
  console.log (query);
  let conn;
  try {
    conn = await pool.getConnection ();
    // mariaDB has no public scheme
    const qry = query.replace (/\$\d+/g, "?").replace (/public\./g, "");
    const rows = await conn.query (qry, values);
    return rows as T[];

  } finally {
    if (conn) conn.release ();
  }
};

export default mariaDBQuerier;