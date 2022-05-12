"use strict";

const fs = require ("fs");
const log = require ("npmlog");
const pathlib = require ("path");
const mapDBError = require ("./mapDBError");
const query = require ("./query");

const readSettingTable = () => query (
  `select * from "pg_catalog"."pg_tables"` +
  `where tablename = 'setting'`
).then (rows => rows[0]);

const readSchemaVersion = () => query (
  `select value from "setting"` +
  `where key = 'db_schema_version'`
).then (([{ value }]) => Number (value));

const readFile = path =>
  fs.promises.readFile (path, "utf-8");

const readDir = path =>
  fs.promises.readdir (path);

const applyUpdate = update =>
  readFile (update).then (query);

const runInitial = async () => {
  const database = "soccer.sql";
  const path = pathlib.join (__dirname, "sql", database);
  log.info ("postgres", `Loading tables from ${database}`);
  return applyUpdate (path);
};

const filesToUpdates = schemaVersion => files =>
  files.reduce ((updates, file) => {
    if (/^update-\d+\.sql$/i.test (file)) {
      const no = file.match (/\d+/)[0];
      if (no > schemaVersion) {
        updates.push ({
          no: Number (no),
          path: pathlib.join (__dirname, "sql", file)
        });
      }
    }
    return updates;
  }, []);

const listUpdates = schemaVersion =>
  readDir (pathlib.join (__dirname, "sql"))
    .then (filesToUpdates (schemaVersion));

const runUpdates = async updates => {
  for (const update of updates) {
    await applyUpdate (update.path);

    log.info ("postgres", `Update ${update.no} applied`);
  }
};

const migrateDB = async () => {
  try {
    const settingTable = await readSettingTable ();
    if (!settingTable) {
      await runInitial ();
    }
    const schemaVersion = await readSchemaVersion ();
    const updates = await listUpdates (schemaVersion);
    await runUpdates (updates);

    log.info ("postgres", "Database check completed");
    process.exit (0);
  } catch (err) {
    const errMessage = mapDBError (err);
    log.error ("Postgres", errMessage);
    process.exit (5);
  }
};

migrateDB ();