import { Pool } from "pg.ts";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});

export const query = (text: string, params?: any[]) => pool.query (text, params);