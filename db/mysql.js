"use strict";

const mySQL = require ("mysql2");
const log = require ("npmlog");

const pool = mySQL.createPool ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt (process.env.MYSQL_PORT),
  multipleStatements: true
});

const query = (sql, values = []) =>
  new Promise ((res, rej) => {
    pool.query (sql, values, (error, rows) => {
      if (error) {
        rej (error);
        return;
      }
      res (rows);
    });
  });

const readSettingTable = () => query (
  `select * from INFORMATION_SCHEMA.TABLES ` +
  `where TABLE_NAME = 'setting'`
).then (rows => rows[0]);

const readSchemaVersion = () => query (
  `select key_value from setting ` +
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
          rej (new Error ("Waited for 30 seconds, MySql is still not set up"));
          return;
        }
        attempts += 1;
        log.info ("database", "MySql is still setting up, sleeping 3 seconds...");
        await new Promise (resolve => setTimeout (resolve, 3000));
      }
    }
  });
};

module.exports = {
  query,
  readSettingTable,
  readSchemaVersion,
  waitForConnection
};