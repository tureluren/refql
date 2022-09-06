"use strict";

const fs = require ("fs");
const log = require ("npmlog");
const pathlib = require ("path");
const mapDBError = require ("./mapDBError");

let db;

if (process.env.DB_TYPE === "pg") {
  db = require ("./pg");
} else if (process.env.DB_TYPE === "mysql") {
  db = require ("./mySQL");
}

const readFile = path =>
  fs.promises.readFile (path, "utf-8");

const readDir = path =>
  fs.promises.readdir (path);

const applyUpdate = update =>
  readFile (update).then (db.query);

const runInitial = async () => {
  const database = "soccer.sql";
  const path = pathlib.join (__dirname, "sql", database);
  log.info ("database", `Loading tables from ${database}`);
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

    log.info ("database", `Update ${update.no} applied`);
  }
};

const migrateDB = async () => {
  try {
    await db.waitForConnection ();
    const settingTable = await db.readSettingTable ();

    if (!settingTable) {
      await runInitial ();
    }

    const schemaVersion = await db.readSchemaVersion ();
    const updates = await listUpdates (schemaVersion);
    await runUpdates (updates);
    log.info ("database", "Database check completed");
    db.pool.end ();
    process.exit (0);
  } catch (err) {
    const errMessage = mapDBError (err);
    log.error ("database", errMessage);
    process.exit (5);
  }
};

migrateDB ();