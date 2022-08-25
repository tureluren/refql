// @ts-nocheck
import { Rec, Values } from "../types";

class Environment {
  record: Rec;
  parent: Environment | null;

  constructor(record: Rec, parent: Environment | null = null) {
    // making sure that record can't be mutated from the outside
    this.record = Object.assign ({}, record);
    this.parent = parent;
  }

  assign<T extends keyof Rec>(name: T, value: Rec[T]) {
    this.resolve (name).record[name] = value;
    return value;
  }

  lookup<T extends keyof Rec>(name: T) {
    return this.resolve (name).record[name]!;
  }

  resolve(name: keyof Rec): Environment {
    if (this.record.hasOwnProperty (name)) {
      return this;
    }
    if (this.parent == null) {
      throw new ReferenceError (`Variable "${name}" is undefined`);
    }
    return this.parent.resolve (name);
  }

  addValues(newValues: Values) {
    const values = this.lookup ("values");
    let idx = this.lookup ("keyIdx");
    idx += newValues.length;
    this.assign ("values", values.concat (newValues));
    this.assign ("keyIdx", idx);
  }

  writeToQuery(value: string) {
    let query = this.lookup ("query");
    const prev = query.slice (-1);
    const next = value.slice (0, 1);

    if (prev === "(" || next === ")" || prev === "" || next === ",") {
      query += value;
    } else {
      query += ", " + value;
    }

    this.assign ("query", query);
  }

  writeToSQL(value: string) {
    let sql = this.lookup ("sql");

    if (sql) {
      this.assign ("sql", sql + " " + value);
    } else {
      this.assign ("sql", value);
    }
  }

  writeSQLToQuery(correctWhere: boolean) {
    let query = this.lookup ("query");
    let sql = this.lookup ("sql");

    if (!sql) return;

    if (correctWhere) {
      // ^ means in the beginning of the string
      sql = sql.replace (/^\b(where)\b/i, "and");
    } else {
      // correct and, or
      sql = sql.replace (/^\b(and|or)\b/i, "where");
    }

    query += " " + sql;

    this.assign ("query", query);
  }

  moveSQLToQuery() {
    const sql = this.lookup ("sql");

    if (sql) {
      this.writeToQuery (sql);

      this.assign ("sql", "");
    }
  }
}

export default Environment;