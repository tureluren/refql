"use strict";

const { Pool } = require ("pg");

const pool = new Pool ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt (process.env.DB_PORT)
});

const query = async (sql, values = []) => {
  const client = await pool.connect ();
  try {
    const { rows } = await client.query (sql, values);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    client.release ();
  }
};

module.exports = query;