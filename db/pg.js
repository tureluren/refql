"use strict";

const { Pool } = require ("pg");
const log = require ("npmlog");

const pool = new Pool ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number (process.env.PG_PORT)
});

const query = async (sql, values = []) => {
  const client = await pool.connect ();
  try {
    const { rows } = await client.query (
      sql
        .replace (/`/g, '"')
        .replace (/integer auto_increment/g, "serial")
        .replace ('"cars" json', "cars text[]"),
      values
    );
    return rows;
  } catch (err) {
    throw err;
  } finally {
    client.release ();
  }
};

const readSettingTable = () => query (
  `select * from "pg_catalog"."pg_tables"` +
  `where tablename = 'setting'`
).then (rows => rows[0]);

const readSchemaVersion = () => query (
  `select key_value from general.setting ` +
  `where key_name = 'db_schema_version'`
).then (([{ key_value }]) => Number (key_value));

const waitForConnection = () => {
  let connected = false;
  return new Promise (async (res, rej) => {
    let attempts = 0;
    while (!connected) {
      try {
        await readSettingTable ();
        res ("con");
        return;
      } catch (e) {
        if (attempts === 10) {
          rej (new Error ("Waited for 30 seconds, PostgresSQL is still not set up"));
          return;
        }
        attempts += 1;
        log.info ("database", "PostgresSQL is still setting up, sleeping 3 seconds...");
        await new Promise (resolve => setTimeout (resolve, 3000));
      }
    }
  });
};

module.exports = {
  pool,
  query,
  readSettingTable,
  readSchemaVersion,
  waitForConnection
};