import { Pool } from "mysql2";

const mySQLQuerier = (pool: Pool) => <T>(query: string, values: any[]): Promise<T[]> =>
  new Promise ((res, rej) => {
    const qry = query.replace (/\$\d/g, "?");
    pool.query (qry, values, (error, rows) => {
      if (error) {
        rej (error);
        return;
      }
      res (rows as T[]);
    });
  });

export default mySQLQuerier;