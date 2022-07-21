import Environment from "../Environment2";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType, Dict, EnvRecord, RefsNew } from "../types";
import varToSQLTag from "../JBOInterpreter/varToSQLTag";
import parameterize from "../more/parameterize";
import isFunction from "../predicate/isFunction";
import convertCase from "../more/convertCase";
import keys from "../more/keys";
import lookup from "../Environment2/lookup";
import over from "../Environment2/over";
import chain from "../more/chain";
import evolve from "../Environment2/evolve";
import set from "../Environment2/set";

const overCols = over ("comps");
const overQuery = over ("query");
const overFn = over ("fn");
const getComps = lookup ("comps");
const getTable = lookup ("table");
const getRefs = lookup ("refs");
const getFn = lookup ("fn");
const setQuery = set ("query");
const setFn = set ("fn");


const splitKeys = (keys: string = "") =>
  keys.split (",").map (s => s.trim ());

interface Keys extends Dict {
  lkey: string;
  rkey: string;
  lxkey?: string;
  rxkey?: string;
}

const keysToRefs = (table: Table, keys: Keys) => {
  let refs: RefsNew = {
    lkeys: [],
    rkeys: [],
    lxkeys: [],
    rxkeys: []
  };

  Object.keys (keys).forEach (key => {
    refs[key + "s" as keyof RefsNew] = splitKeys (keys[key])
      .map ((name, idx) => {
        return {
          name,
          as: `${table.as}${key}${idx}`
        };
      });

  });

  return refs;
};


const createEnv = (table: Table) => new Environment ({
  table,
  sql: "",
  query: "",
  // valueIdx ?
  keyIdx: 0,
  values: [],
  next: [],
  comps: []
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

    if (exp.type === "Root") {
      const { table, members } = exp;

      const rootEnv = createEnv (table);

      return members
        .reduce ((acc, mem) =>
          acc.extend (env => this.interpret (mem, env)), rootEnv)

        .map (chain (
          getComps,
          comps =>
            setQuery (`select ${comps.join (", ")} from ${table.name} ${table.as}`)))

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

    if (exp.type === "Call") {
      const { args, name, as, cast } = exp;
      const { record } = env;

      const callEnv = new Environment ({
        table: getTable (record),
        fn: "",
        inFunction: true,
        sql: "", // sql can be used inside fns
        comps: []
      });

      const alias = as ? ` as ${as}` : "";

      const convert = cast ? `::${cast}` : "";

      const thisRecord = args
        .reduce ((acc, arg) =>
          acc.extend (env => this.interpret (arg, env)), callEnv)

        .map (chain (
          getComps,
          comps =>
            setFn (`${name} (${comps.join (", ")})${convert}${alias}`)))

        .record;

      return overCols (comps => comps.concat (getFn (thisRecord))) (record);
    }

    if (exp.type === "Identifier") {
      const { name, as, cast } = exp;
      const { record } = env;

      const table = getTable (record);

      let sql = `${table.as}.${name}`;

      if (cast) {
        sql += `:: ${cast}`;
      }

      if (as) {
        sql += ` as ${as}`;
      }

      return overCols (comps => comps.concat (sql)) (record);
    }

    if (exp.type === "BelongsTo") {
      const { table, members, keywords } = exp;
      const { record } = env;

      if (!rows) {
        const parent = getTable (record);

        const { lkey, rkey } = keywords;

        const refs = keysToRefs (table, {
          lkey: lkey || this.toCase (table.name + "_id"),
          rkey: rkey || "id"
        });

        return evolve ({
          comps: comps => comps.concat (refs.lkeys.map (lk =>
            `${parent}.${lk.name} as ${lk.as}`)),

          next: next => next.concat ({ exp, refs })

        }, record);
      }

      const { rkeys, lkeys } = getRefs (record);

      const belongsToEnv = createEnv (table);

      const eachInterpreted = members.reduce ((acc, mem) => {
        return acc.extend (env => this.interpret (mem, env));
      }, belongsToEnv);

      const requiredHere = rkeys.map (rk => `${table.as}.${rk.name} as ${rk.as}`);

      const almost = eachInterpreted.map (record =>
        overQuery (query => query + "select " + getComps (record).concat (requiredHere).join (", ") + ",") (record)
      );

      let wherePart = ` from "${table.name}" "${table.as}" where`;

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
        overQuery (query => query.slice (0, -1) + `${wherePart}`) (record)
      );

      final.writeSQLToQuery (true);

      return final.record;
    }

    // if (exp.type === "HasMany") {
    //   const { name, as, members, keywords } = exp;
    //   const { lkey, rkey } = keywords;

    //   const table = env.lookup ("table");

    //   const { lkeys, rkeys } = keysToRefs (as || name, {
    //     lkey: lkey || "id",
    //     rkey: rkey || this.toCase (table.name + "_id")
    //   });

    //   const required = lkeys.map (lk => `"${table.as || table.name}".${lk.name} as ${lk.as}`);

    //   if (!rows) {
    //     env.addToRequired (required);
    //     env.addToNext ({
    //       exp,
    //       refs: {
    //         lkeys,
    //         rkeys,
    //         lxkeys: [],
    //         rxkeys: []
    //       }
    //     });
    //     return;
    //   }

    //   const membersEnv = new Environment ({
    //     table: new Table (name, as),
    //     query: "select",
    //     sql: "",
    //     keyIdx: 0,
    //     values: [],
    //     next: [],
    //     comps: []
    //   });

    //   this.interpretEach (members, membersEnv);

    //   const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

    //   membersEnv.addToRequired (requiredHere);

    //   membersEnv.lookup ("comps").forEach (req => {
    //     membersEnv.writeToQuery (req);
    //   });

    //   let wherePart = `from "${name}" "${as}" where`;

    //   lkeys.forEach ((lk, idx) => {
    //     const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
    //     const rk = rkeys[idx];
    //     const andOp = idx === 0 ? "" : "and ";

    //     wherePart += ` ${andOp}${rk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

    //     membersEnv.addValues (uniqRows);
    //   });

    //   membersEnv.writeToQuery (wherePart);

    //   membersEnv.writeSQLToQuery (true);

    //   return membersEnv.record;
    // }

    // if (exp.type === "ManyToMany") {
    //   const { name, as, members, keywords } = exp;
    //   const { x, lkey, lxkey, rkey, rxkey } = keywords;
    //   const table = env.lookup ("table");
    //   const xTable = x || this.toCase (`${table.name}_${name}`);

    //   const { lkeys, rkeys, lxkeys, rxkeys } = keysToRefs (as || name, {
    //     lkey: lkey || "id",
    //     rkey: rkey || "id",
    //     lxkey: lxkey || this.toCase (table.name + "_id"),
    //     rxkey: rxkey || this.toCase (name + "_id")
    //   });

    //   const required = lkeys.map (lk => `${lk.name} as ${lk.as}`);

    //   if (!rows) {
    //     env.addToRequired (required);
    //     env.addToNext ({
    //       exp,
    //       refs: {
    //         lkeys,
    //         rkeys,
    //         lxkeys,
    //         rxkeys
    //       }
    //     });
    //     return;
    //   }

    //   const membersEnv = new Environment ({
    //     table: new Table (name, as),
    //     query: "select",
    //     sql: "",
    //     keyIdx: 0,
    //     values: [],
    //     next: [],
    //     comps: []
    //   });

    //   this.interpretEach (members, membersEnv);

    //   const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

    //   const requiredHere2 = lxkeys.map (lxk => `"${xTable}".${lxk.name} as ${lxk.as}`);

    //   const requiredHere3 = rxkeys.map (rxk => `"${xTable}".${rxk.name} as ${rxk.as}`);

    //   membersEnv.addToRequired (requiredHere.concat (requiredHere2).concat (requiredHere3));

    //   membersEnv.lookup ("comps").forEach (req => {
    //     membersEnv.writeToQuery (req);
    //   });

    //   let wherePart = `from ${name} as "${as}" join ${xTable} as "${xTable}" on`;

    //   /**
    //    * select * from game
    //    * join x on rxkey = rkey
    //    * where lxkey = lkey
    //    */

    //   rkeys.forEach ((rk, idx) => {
    //     const andOp = idx === 0 ? "" : "and ";
    //     const rxk = rxkeys[idx];

    //     wherePart += ` ${andOp}"${xTable}".${rxk.name} = "${as || name}".${rk.name}`;
    //   });

    //   wherePart += " where";

    //   // lkeys length should equal lxkeys length
    //   lkeys.forEach ((lk, idx) => {
    //     const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
    //     const lxk = lxkeys[idx];
    //     const andOp = idx === 0 ? "" : "and ";

    //     wherePart += ` ${andOp}"${xTable}".${lxk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

    //     membersEnv.addValues (uniqRows);
    //   });

    //   membersEnv.writeToQuery (wherePart);

    //   membersEnv.writeSQLToQuery (true);

    //   return membersEnv.record;
    // }

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
      const { record } = env;

      let sql = `'${value}'`;

      if (as) {
        sql += ` as ${as}`;
      }

      return overCols (comps => comps.concat (sql)) (record);
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