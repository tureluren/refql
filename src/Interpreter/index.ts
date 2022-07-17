import Environment from "../Environment2";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType, Dict, EnvRecord } from "../types";
import varToSQLTag from "../JBOInterpreter/varToSQLTag";
import parameterize from "../more/parameterize";
import isFunction from "../predicate/isFunction";
import convertCase from "../more/convertCase";
import keys from "../more/keys";
type SameLength<T extends any[]> = Extract<{ [K in keyof T]: any }, any[]>;

type Curried<A extends any[], R> =
  <P extends Partial<A>>(...args: P) => P extends A ? R :
    A extends [...SameLength<P>, ...infer S] ? S extends any[] ? Curried<S, R>
    : never : never;

function curry<A extends any[], R>(fn: (...args: A) => R): Curried<A, R> {
  return (...args: any[]): any =>
    args.length >= fn.length ? fn (...args as any) : curry ((fn as any).bind (undefined, ...args));
}

const concat = (obj1: Dict, obj2: Dict) => {
  const result: Dict = {};
  (Object.keys (obj2)).forEach (k => { result[k] = obj2[k]; });
  (Object.keys (obj1)).forEach (k => { result[k] = obj1[k]; });
  return result;
};

type IOverload = {
  <T extends keyof EnvRecord>(prop: T, record: EnvRecord): NonNullable<EnvRecord[T]>;
  <T extends keyof EnvRecord>(prop: T): (record: EnvRecord) => NonNullable<EnvRecord[T]>;
};

// const lookup = curry (<T extends keyof EnvRecord>(prop: T, record: EnvRecord): NonNullable<EnvRecord[T]> => {
//   // @ts-ignore
//   if (record.hasOwnProperty (prop)) {
//     return record[prop]!;
//   }
//   throw new ReferenceError (`Variable "${prop}" is undefined`);
// });

const lookup: IOverload = curry ((prop, record) => {
  // @ts-ignore
  if (record.hasOwnProperty (prop)) {
    return record[prop]!;
  }
  throw new ReferenceError (`Variable "${prop}" is undefined`);
});


const buh = lookup ("select") ({ select: ["djdj"] });


const S_ = <A, B, R>(g: (r: R) => A, f: (a: A) => (r: R) => B) => (x: R) => f (g (x)) (x);

// const objOf = (key: string, value: any) =>
//   ({ [key]: value });

const set = (key: string, value: any) => (obj: Dict) => {
  return concat ({ [key]: value }, obj);
};

const over = <T extends keyof EnvRecord>(key: T, fn: (value: NonNullable<EnvRecord[T]>) => EnvRecord[T], obj: EnvRecord) => {
  return concat ({ [key]: fn (lookup (key, obj)) }, obj);
};

type Transformations = {
  [key in keyof EnvRecord]: (value: NonNullable<EnvRecord[key]>) => NonNullable<EnvRecord[key]>;
};

const evolve = <T extends keyof EnvRecord>(transformations: Transformations, obj: EnvRecord): EnvRecord => {
  return (Object.keys (obj) as Array<T>).reduce ((acc, key) => {
    const transformation = transformations[key];
    if (transformation) {
      acc[key] = transformation (lookup (key, obj));
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as EnvRecord);
};

// const over2 = <T1 extends keyof EnvRecord, T2 extends keyof EnvRecord>(key1: T1, key2: T2, fn: (value1: EnvRecord[T1], value) => EnvRecord[T]) => (obj: EnvRecord) => {
//   return concat ({ [key]: fn (obj[key]) }, obj);
// };



const splitKeys = (keys: string = "") =>
  keys.split (",").map (s => s.trim ());

interface Keys extends Dict {
  lkey: string;
  rkey: string;
  lxkey?: string;
  rxkey?: string;
}

interface NamedKeys {
  name: string;
  as: string;
}

interface Worked {
  lkeys: NamedKeys[];
  rkeys: NamedKeys[];
  lxkeys: NamedKeys[];
  rxkeys: NamedKeys[];
}

const workKeys = (tableAs: string, keys: Keys) => {
  let res: Worked = {
    lkeys: [],
    rkeys: [],
    lxkeys: [],
    rxkeys: []
  };

  Object.keys (keys).forEach (key => {
    res[key + "s" as keyof Worked] = splitKeys (keys[key])
      .map ((name, idx) => {
        return {
          name,
          as: `${tableAs}${key}${idx}`
        };
      });

  });

  return res;
};

const createEnv = (table: Table) => new Environment ({
  table,
  sql: "",
  query: "select",
  // valueIdx ?
  keyIdx: 0,
  values: [],
  next: [],
  select: []
});


class Interpreter<Input> {
  caseType: OptCaseType;
  useSmartAlias: boolean;
  params?: Input;

  constructor(caseType: OptCaseType, useSmartAlias: boolean, params?: Input) {
    this.caseType = caseType;
    this.useSmartAlias = useSmartAlias;
    this.params = params;
  }

  toCase(string: string) {
    return convertCase (this.caseType, string);
  }

  interpret(exp: ASTNode, env: Environment = new Environment ({}), rows?: any[]): any {
    // root
    if (exp.type === "Root") {
      const { name, as, members } = exp;

      const rootEnv = createEnv (new Table (name, as));

      return members
        .reduce ((acc, mem) =>
          acc.extend (env => this.interpret (mem, env)), rootEnv)

        .map (record =>
          over ("query", query => query + " " + lookup ("select", record).join (", "), record))

        .map (record =>
          over ("query", query => query + ` from "${name}" "${as || name}"`, record))

        .record;




      // this.interpretEach (members, membersEnv);

      // membersEnv.writeToQuery (`from "${name}" "${as}"`
      //   .concat (hasId ? ` where "${as}".id = ${id}` : "")
      // );
      // const hasId = id != null;

      // eachInterpreted.lookup ("required").forEach (req => {
      //   eachInterpreted.writeToQuery (req);
      // });


      //  eachInterpreted.writeToQuery (`from "${name}" "${as || name}"`
      //     // .concat (hasId ? ` where "${as}".id = ${id}` : "")
      //   );

      // if (limit != null) {
      //   membersEnv.writeToSQL (`limit ${limit}`);
      // }

      // if (offset != null) {
      //   membersEnv.writeToSQL (`offset ${offset}`);
      // }

      // membersEnv.writeSQLToQuery (hasId);

    }

    if (exp.type === "Identifier") {
      const { name, as, cast } = exp;
      const { record } = env;

      const table = lookup ("table", record);

      let sql = `"${table}".${name}`;

      if (cast) {
        sql += "::" + cast;
      }

      if (as) {
        sql += " as " + as;
      }

      return over ("select", select => select.concat (sql), record);
    }

    if (exp.type === "BelongsTo") {
      const { name, as, members, keywords } = exp;
      const { record } = env;

      const table = lookup ("table", record);

      const { lkey, rkey } = keywords;

      const { lkeys, rkeys } = workKeys (as || name, {
        lkey: lkey || this.toCase (name + "_id"),
        rkey: rkey || "id"
      });

      const required = lkeys.map (lk => `"${table.as || table.name}".${lk.name} as ${lk.as}`);

      if (!rows) {
        return evolve ({
          select: select => select.concat (required),
          // lookup on enrecord ipv env, werk met get, en gooi error alst er nie is?
          // of meerdere types envrecord, table en call ? met alleen maar aanwezige velden
          next: nxt => nxt.concat (
            {
              exp,
              lkeys: lkeys.map (lk => lk.as),
              rkeys: rkeys.map (rk => rk.as)
            })
        }, record);
      }
      console.log ("hier");

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        select: []
      });

      const eachInterpreted = members.reduce ((acc, mem) => {
        return acc.extend (env => this.interpret (mem, env));
      }, membersEnv);

      const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

      const almost = eachInterpreted.map (record =>
        over ("query", query => query + " " + eachInterpreted.record.select?.concat (requiredHere).join (", ") + ",", record)
      );

      let wherePart = ` from "${name}" "${as}" where`;

      // lkeys length should equal rkeys length
      lkeys.forEach ((lk, idx) => {
        const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
        const rk = rkeys[idx];
        const andOp = idx === 0 ? "" : "and ";

        wherePart += ` ${andOp}${rk.name} in (${parameterize (almost.lookup ("keyIdx"), uniqRows.length, "")})`;

        almost.addValues (uniqRows);
      });

      const final = almost.map (record =>
        // remove trailing comma
        over ("query", query => query!.slice (0, -1) + `${wherePart}`, record)
      );

      final.writeSQLToQuery (true);

      return final.record;
    }

    if (exp.type === "HasMany") {
      const { name, as, members, keywords } = exp;
      const { lkey, rkey } = keywords;

      const table = env.lookup ("table");

      const { lkeys, rkeys } = workKeys (as || name, {
        lkey: lkey || "id",
        rkey: rkey || this.toCase (table.name + "_id")
      });

      const required = lkeys.map (lk => `"${table.as || table.name}".${lk.name} as ${lk.as}`);

      if (!rows) {
        env.addToRequired (required);
        env.addToNext ({
          exp,
          lkeys: lkeys.map (lk => lk.as),
          rkeys: rkeys.map (rk => rk.as)
        });
        return;
      }

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        select: []
      });

      this.interpretEach (members, membersEnv);

      const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

      membersEnv.addToRequired (requiredHere);

      membersEnv.lookup ("select").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      let wherePart = `from "${name}" "${as}" where`;

      lkeys.forEach ((lk, idx) => {
        const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
        const rk = rkeys[idx];
        const andOp = idx === 0 ? "" : "and ";

        wherePart += ` ${andOp}${rk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

        membersEnv.addValues (uniqRows);
      });

      membersEnv.writeToQuery (wherePart);

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;
    }

    if (exp.type === "ManyToMany") {
      const { name, as, members, keywords } = exp;
      const { x, lkey, lxkey, rkey, rxkey } = keywords;
      const table = env.lookup ("table");
      const xTable = x || this.toCase (`${table.name}_${name}`);

      const { lkeys, rkeys, lxkeys, rxkeys } = workKeys (as || name, {
        lkey: lkey || "id",
        rkey: rkey || "id",
        lxkey: lxkey || this.toCase (table.name + "_id"),
        rxkey: rxkey || this.toCase (name + "_id")
      });

      const required = lkeys.map (lk => `${lk.name} as ${lk.as}`);

      if (!rows) {
        env.addToRequired (required);
        env.addToNext ({
          exp,
          lkeys: lkeys.map (lk => lk.as),
          rkeys: lxkeys.map (lxk => lxk.as)
        });
        return;
      }

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        select: []
      });

      this.interpretEach (members, membersEnv);

      const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

      const requiredHere2 = lxkeys.map (lxk => `"${xTable}".${lxk.name} as ${lxk.as}`);

      const requiredHere3 = rxkeys.map (rxk => `"${xTable}".${rxk.name} as ${rxk.as}`);

      membersEnv.addToRequired (requiredHere.concat (requiredHere2).concat (requiredHere3));

      membersEnv.lookup ("select").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      let wherePart = `from ${name} as "${as}" join ${xTable} as "${xTable}" on`;

      /**
       * select * from game
       * join x on rxkey = rkey
       * where lxkey = lkey
       */

      rkeys.forEach ((rk, idx) => {
        const andOp = idx === 0 ? "" : "and ";
        const rxk = rxkeys[idx];

        wherePart += ` ${andOp}"${xTable}".${rxk.name} = "${as || name}".${rk.name}`;
      });

      wherePart += " where";

      // lkeys length should equal lxkeys length
      lkeys.forEach ((lk, idx) => {
        const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
        const lxk = lxkeys[idx];
        const andOp = idx === 0 ? "" : "and ";

        wherePart += ` ${andOp}"${xTable}".${lxk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

        membersEnv.addValues (uniqRows);
      });

      membersEnv.writeToQuery (wherePart);

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;
    }

    if (exp.type === "Subselect") {
      const { tag, as } = exp;

      const sql = this.getSQLIfSQLTag (tag, env);

      if (sql) {
        env.writeToQuery (`'${as}', (${sql})`);
      } else {
        throw new Error ("A subselect should be a sql snippet or a function that returns a sql snippet");
      }

      return;
    }

    if (exp.type === "Call") {
      const { args, name, as, cast } = exp;
      const { inFunction } = env.record;

      const argumentEnv = new Environment ({
        inFunction: true,
        sql: "",
        next: []
      });

      // nested
      if (inFunction) {
        env.writeToQuery (`${name}(`);
      } else {
        env.writeToQuery (`'${as}', ${name}(`);
      }

      this.interpretEach (args, argumentEnv, true);

      env.writeToQuery (`)${cast ? `::${cast}` : ""}`);

      return;
    }

    if (exp.type === "Variable") {
      const { value, cast } = exp;
      // const { isRoot } = env.record;

      const sql = this.getSQLIfSQLTag (value, env);

      if (sql) {
        // if (!isRoot) {
        //   const invalid = /\b(limit|offset)\b/i.test (sql);
        //   if (invalid) {
        //     throw new Error ("Limit and offset can't be used inside a relation");
        //   }
        // }

        env.writeToSQL (sql);
      } else if (isRaw (value)) {
        env.writeToQuery (value.value);

      } else {
        // normal variable
        env.addValues ([value]);

        let query = "$" + env.lookup ("keyIdx");

        if (cast) {
          query += "::" + cast;
        }

        env.writeToQuery (query);
      }

      return;
    }

    if (exp.type === "StringLiteral") {
      const { value, as } = exp;
      const { inFunction } = env.record;

      if (inFunction) {
        env.writeToQuery (`'${value}'`);
      } else {
        env.writeToQuery (`'${as}', '${value}'`);
      }

      return;
    }

    if (
      exp.type === "NumericLiteral" ||
      exp.type === "BooleanLiteral" ||
      exp.type === "NullLiteral"
    ) {
      const { value, as } = exp;
      const { inFunction } = env.record;

      if (inFunction) {
        env.writeToQuery (`${value}`);
      } else {
        env.writeToQuery (`'${as}', ${value}`);
      }

      return;
    }

    throw new Error (`Unimplemented: ${JSON.stringify (exp)}`);
  }

  getOrderBy(orderBy: any, env: Environment) {
    if (!orderBy) return "";

    const orderBySql = this.getSQLIfSQLTag (orderBy, env);

    if (orderBySql == null) {
      throw new Error (
        "`orderBy` should be a sql snippet or a function that returns a sql snippet"
      );
    }

    return " " + orderBySql;
  }

  getSQLIfSQLTag(value: any, env: Environment) {
    const sqlTag = varToSQLTag (value, env.lookup ("table"));

    if (sqlTag == null) {
      return null;
    }

    const [sql, values] = compileSQLTag (sqlTag, env.lookup ("keyIdx"));

    env.addValues (values);

    return sql;
  }

  interpretEach(arr: ASTNode[], env: Environment, moveSQL = false) {
    arr.forEach (exp => {
      this.interpret (exp, env);

      if (moveSQL) {
        env.moveSQLToQuery ();
      }
    });
  }
}

export default Interpreter;