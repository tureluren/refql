"use strict";

const mariaDB = require ("mariadb");

const pool = mariaDB.createPool ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number (process.env.MARIADB_PORT),
  multipleStatements: true
});

const query = async (sql, values = []) => {
  let conn;
  try {
    conn = await pool.getConnection ();
    const rows = await conn.query (sql, values);
    return rows;

  } finally {
    if (conn) conn.release ();
  }
};

const readSettingTable = () => query (
  `select * from INFORMATION_SCHEMA.TABLES ` +
  `where TABLE_NAME = 'setting'`
).then (rows => rows[0]);

const readSchemaVersion = () => query (
  `select key_value from general.setting ` +
  `where key_name = 'db_schema_version'`
).then (([{ key_value }]) => Number (key_value));


// handled by pool.getConnection ();
const waitForConnection = () => {
  return Promise.resolve (true);
};

module.exports = {
  pool,
  query,
  readSettingTable,
  readSchemaVersion,
  waitForConnection
};