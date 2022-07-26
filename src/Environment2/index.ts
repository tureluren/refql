import { EnvRecord, Next, Values } from "../types";

class Environment<Input> {
  record: EnvRecord<Input>;

  constructor(record: EnvRecord<Input>) {
    this.record = Object.assign ({}, record);
  }

  extend(fn: (env: Environment<Input>) => EnvRecord<Input>) {
    return new Environment (fn (this));
  }

  map(fn: (record: EnvRecord<Input>) => EnvRecord<Input>) {
    return new Environment (fn (this.record));
  }

  assign<T extends keyof EnvRecord<Input>>(name: T, value: EnvRecord<Input>[T]) {
    this.resolve (name).record[name] = value;
    return value;
  }

  lookup<T extends keyof EnvRecord<Input>>(name: T) {
    return this.resolve (name).record[name]!;
  }

  resolve(name: keyof EnvRecord<Input>): Environment<Input> {
    if (this.record.hasOwnProperty (name)) {
      return this;
    }
    throw new ReferenceError (`Variable "${name}" is undefined`);
  }

  addToNext(nxt: Next) {
    const next = this.lookup ("next");
    this.assign ("next", next.concat (nxt));
  }

  addToRequired(req: string[]) {
    const required = this.lookup ("comps");
    this.assign ("comps", required.concat (req));
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

    // if (sql) {
    //   this.assign ("sql", sql + " " + value);
    // } else {
    //   this.assign ("sql", value);
    // }
  }

  writeSQLToQuery(correctWhere: boolean) {
    let query = this.lookup ("query");
    let sql = this.lookup ("sql");

    if (!sql) return;

    // if (correctWhere) {
    //   // ^ means in the beginning of the string
    //   sql = sql.replace (/^\b(where)\b/i, "and");
    // } else {
    //   // correct and, or
    //   sql = sql.replace (/^\b(and|or)\b/i, "where");
    // }

    query += " " + sql;

    this.assign ("query", query);
  }

  moveSQLToQuery() {
    const sql = this.lookup ("sql");

    if (sql) {
      // this.writeToQuery (sql);

      // this.assign ("sql", "");
    }
  }
}

export default Environment;