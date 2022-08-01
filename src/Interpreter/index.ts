import Environment from "../Environment2";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType, Dict, EnvRecord, RefsNew, Next, Values, NamedKeys } from "../types";
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
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import isSQLTag from "../SQLTag/isSQLTag";
import createEnv from "../RQLTag/createEnv";

const overComps = over ("comps");
const overQuery = over ("query");
const overSqlTag = over ("sqlTag");
const getComps = lookup ("comps");
const getValues = lookup ("values");
const getTable = lookup ("table");
const getRefs = lookup ("refs");
const getQuery = lookup ("query");
const setQuery = set ("query");

const concat = <T>(item: T | T[]) => <R> (arr: R[]): R[] =>
  arr.concat (item as unknown as R);

const keysToComp = (table: Table, keys: NamedKeys[]) =>
  keys.map (k => `${table.as}.${k.name} as ${k.as}`);

const concatKeys = (table: Table, keys: NamedKeys[]) =>
  concat (keysToComp (table, keys));

const concatQuery = (query1: string) => (query2: string) =>
  `${query2} ${query1}`;

const selectFrom = (table: Table) => chain (
  getComps,
  comps => setQuery (`select ${comps.join (", ")} from ${table.name} ${table.as}`));

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




class Interpreter<Input> {
  caseType: OptCaseType;
  useSmartAlias: boolean;
  params?: Input;

  constructor(caseType: OptCaseType, useSmartAlias: boolean, params?: Input) {
    this.caseType = caseType;
    this.useSmartAlias = useSmartAlias;
    this.params = params;
  }

  includeSql(table: Table) {
    return (record: EnvRecord<Input>) => {
      const { sqlTag, values } = record;

      const [query, newValues] = compileSQLTag (sqlTag, values.length, this.params, table);

      return evolve ({
        query: concatQuery (query),
        values: concat (newValues)
      }) (record);
    };
  }

  toCase(string: string) {
    return convertCase (this.caseType, string);
  }

  interpretEach(members: ASTNode[], env: Environment<Input>) {
    return members
      .reduce ((acc, mem) =>
        acc.extend (env => this.interpret (mem, env)), env);
  }

  interpret(exp: ASTNode, env: Environment<Input> = createEnv<Input> (), rows?: any[]): EnvRecord<Input> {
    // cata ?

    if (exp.type === "Root") {
      const { table, members } = exp;

      return this
        .interpretEach (members, createEnv<Input> (table))

        .map (selectFrom (table))

        .map (this.includeSql (table))

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

      const { table } = record;

      if (!table) {
        throw new Error ("No Table");
      }

      const callEnv = createEnv<Input> (table);

      const alias = as ? ` as ${as}` : "";

      const convert = cast ? `::${cast}` : "";

      const thisRecord = this.interpretEach (args, callEnv)

        .map (chain (
          getComps,
          comps =>
            setQuery (`${name} (${comps.join (", ")})${convert}${alias}`)))

        .record;

      return overComps (concat (getQuery (thisRecord))) (record);
    }

    if (exp.type === "Identifier") {
      const { name, as, cast } = exp;
      const { record } = env;

      const { table } = record;

      if (!table) {
        throw new Error ("No Table");
      }

      let sql = `${table.as}.${name}`;

      if (cast) {
        sql += `:: ${cast}`;
      }

      if (as) {
        sql += ` as ${as}`;
      }

      return overComps (concat (sql)) (record);
    }

    if (exp.type === "BelongsTo") {
      const { table, members, keywords } = exp;
      const { record } = env;

      if (!rows) {
        const { table: parent } = record;

        if (!parent) {
          throw new Error ("No Table");
        }

        const { lkey, rkey } = keywords;

        const refs = keysToRefs (table, {
          lkey: lkey || this.toCase (table.name + "_id"),
          rkey: rkey || "id"
        });

        return evolve ({
          comps: concatKeys (parent, refs.lkeys),
          next: concat ({ exp, refs })
        }) (record);
      }

      // lkeys length should equal rkeys length
      const { rkeys, lkeys } = record.refs;

      return this

        .interpretEach (members, createEnv<Input> (table))

        .map (overComps (concatKeys (table, rkeys)))

        .map (selectFrom (table))

        .map (chain (
          getValues,
          values => {
            const [query, newValues] = lkeys.reduce (([sql, vals], lk, idx) => {
              const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
              const rk = rkeys[idx];
              const op = idx === 0 ? "" : "and ";

              return [
                `${sql} ${op}${table.as}.${rk.name} in (${parameterize (values.length, uniqRows.length)})`,
                vals.concat (uniqRows)
              ];
            }, ["where", [] as Values]);


            return evolve ({
              query: concatQuery (query),
              values: concat (newValues)
            });
          }))

        .map (this.includeSql (table))

        .record;
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

    // if (exp.type === "Subselect") {
    //   const { tag, as } = exp;

    //   const sql = this.getSQLIfSQLTag (tag, env);

    //   if (sql) {
    //     env.writeToQuery (`'${as}', (${sql})`);
    //   } else {
    //     throw new Error ("A subselect should be a sql snippet or a function that returns a sql snippet");
    //   }

    //   return;
    // }


    if (exp.type === "Variable") {
      const { value, cast, as } = exp;
      const { record } = env;

      if (isSQLTag (value)) {
        if (as) {
          // subquery
          const values = lookup ("values") (record);
          const table = lookup ("table") (record);

          const [query, newValues] = compileSQLTag (value, values.length, this.params, table);

          return evolve ({
            comps: concat (`(${query}) as ${as}`),
            values: concat (newValues)
          }) (record);
        }
        return overSqlTag (sqlTag => sqlTag.concat (value)) (record);
      }

      // if as, subselect in ge val van sqlTAG

      // const sql = this.getSQLIfSQLTag (value, env);

      // if (sql) {
      //   env.writeToSQL (sql);
      // } else if (isRaw (value)) {
      //   env.writeToQuery (value.value);

      // } else {
      //   // normal variable
      //   env.addValues ([value]);

      //   let query = "$" + env.lookup ("keyIdx");

      //   if (cast) {
      //     query += "::" + cast;
      //   }

      //   env.writeToQuery (query);
      // }

      // return;
    }

    if (exp.type === "StringLiteral") {
      const { value, as } = exp;
      const { record } = env;

      let sql = `'${value}'`;

      if (as) {
        sql += ` as ${as}`;
      }

      return overComps (comps => comps.concat (sql)) (record);
    }

    if (
      exp.type === "NumericLiteral" ||
      exp.type === "BooleanLiteral" ||
      exp.type === "NullLiteral"
    ) {
      // const { value, as } = exp;
      // const { inFunction } = env.record;

      // if (inFunction) {
      //   env.writeToQuery (`${value}`);
      // } else {
      //   env.writeToQuery (`'${as}', ${value}`);
      // }

      return env.record;
    }

    throw new Error (`Unimplemented: ${JSON.stringify (exp)}`);
  }

  // getSQLIfSQLTag(value: any, env: Environment<Input>) {
  //   const sqlTag = varToSQLTag (value, env.lookup ("table"));

  //   if (sqlTag == null) {
  //     return null;
  //   }

  //   const [sql, values] = compileSQLTag (sqlTag, env.lookup ("keyIdx"), this.params, env.lookup ("table"));

  //   env.addValues (values);

  //   return sql;
  // }

}

export default Interpreter;