"use strict";

const mapDBError = err => {
  if (err.code && /^28/.test (err.code)) {
    return "Could not access the database. Check database credentials";
  }
  if (err.code && (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND")) {
    return "Could not connect to the database. Check database host and port";
  }
  return err.message;
};

module.exports = mapDBError;