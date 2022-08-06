import Environment from "../Environment2";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType, Dict, EnvRecord, RefsNew, Next, Values, NamedKeys, InterpretFn, Keywords } from "../types";
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

const whereIn = (lkeys: NamedKeys[], rkeys: NamedKeys[], rows: any[], table: Table) => chain (getValues, values => {
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
});

const join = (lkeys: NamedKeys[], rkeys: NamedKeys[], table: Table, xTable: Table) => overQuery (q => {
  return lkeys.reduce ((q, lk, idx) => {
    const rk = rkeys[idx];
    const op = idx === 0 ? "" : "and ";

    return `${q} ${op}${xTable.as}.${lk.name} = ${table.as}.${rk.name}`;

  }, `${q} join ${xTable.name} as ${xTable.as} on`);

});


const interpret = <Input> (caseType: OptCaseType, useSmartAlias: boolean, params?: Input) => {
  const interpretComps = (members: ASTNode[], env: Environment<Input>): Environment<Input> =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), env);

  const includeSql = (table: Table) => (record: EnvRecord<Input>) => {
    const { sqlTag, values } = record;

    const [query, newValues] = compileSQLTag (sqlTag, values.length, params, table);

    return evolve ({
      query: concatQuery (query),
      values: concat (newValues)
    }) (record);
  };

  const toCase = (string: string) => {
    return convertCase (caseType, string);
  };


  const goInterpret: InterpretFn<Input> = (exp, env = createEnv<Input> (), rows?) => {
    const { record } = env;
    const { values, table, refs } = record;

    return exp.cata<EnvRecord<Input>> ({
      Root: (table, members) =>
        interpretComps (members, createEnv<Input> (table))

          .map (selectFrom (table))

          .map (includeSql (table))

          .record,

      BelongsTo: (child, members, keywords) => {
        if (!rows) {
          if (!table) {
            throw new Error ("No Table");
          }

          const { lkey, rkey } = keywords;

          const refs = keysToRefs (child, {
            lkey: lkey || toCase (child.name + "_id"),
            rkey: rkey || "id"
          });

          return evolve ({
            comps: concatKeys (table, refs.lkeys),
            next: concat ({ exp, refs })
          }) (record);
        }

        return interpretComps (members, createEnv<Input> (child))

          .map (overComps (concatKeys (child, refs.rkeys)))

          .map (selectFrom (child))

          .map (whereIn (refs.lkeys, refs.rkeys, rows, child))

          .map (includeSql (child))

          .record;
      },
      HasMany: (child, members, keywords) => {
        if (!rows) {
          if (!table) {
            throw new Error ("No Table");
          }

          const { lkey, rkey } = keywords;

          const refs = keysToRefs (child, {
            lkey: lkey || "id",
            rkey: rkey || toCase (table.name + "_id")
          });

          return evolve ({
            comps: concatKeys (table, refs.lkeys),
            next: concat ({ exp, refs })
          }) (record);
        }

        return interpretComps (members, createEnv<Input> (child))

          .map (overComps (concatKeys (child, refs.rkeys)))

          .map (selectFrom (child))

          .map (whereIn (refs.lkeys, refs.rkeys, rows, child))

          .map (includeSql (child))

          .record;
      },
      ManyToMany: (child, members, keywords) => {
        if (!rows) {
          if (!table) {
            throw new Error ("No Table");
          }

          const { lkey, rkey, lxkey, rxkey } = keywords;

          const refs = keysToRefs (child, {
            lkey: lkey || "id",
            rkey: rkey || "id",
            lxkey: lxkey || toCase (table.name + "_id"),
            rxkey: rxkey || toCase (child.name + "_id")
          });

          return evolve ({
            comps: concatKeys (table, refs.lkeys),
            next: concat ({ exp, refs })
          }) (record);
        }

        if (!table) {
          throw new Error ("No Table");
        }

        const xTable = new Table (keywords.x || toCase (`${table.name}_${child.name}`));

        return interpretComps (members, createEnv<Input> (child))
          .map (overComps (concatKeys (child, refs.rkeys)))
          .map (overComps (concatKeys (xTable, refs.lxkeys)))
          .map (overComps (concatKeys (xTable, refs.rxkeys)))
          .map (selectFrom (child))
          .map (join (refs.rxkeys, refs.rkeys, child, xTable))
          .map (whereIn (refs.lkeys, refs.lxkeys, rows, xTable))
          .map (includeSql (child))

          .record;

      },
      Identifier: (name, as, cast) => {
        if (!table) {
          throw new Error ("No Table");
        }

        let sql = `${table.as}.${name}`;

        if (cast) {
          sql += `::${cast}`;
        }

        if (as) {
          sql += ` as ${as}`;
        }

        return overComps (concat (sql)) (record);
      },
      Call: (name, args, as, cast) => {
        if (!table) {
          throw new Error ("No Table");
        }

        const alias = as ? ` as ${as}` : "";
        const convert = cast ? `::${cast}` : "";

        const thisRecord = interpretComps (args, createEnv<Input> (table))
          .map (chain (
            getComps,
            comps =>
              setQuery (`${name} (${comps.join (", ")})${convert}${alias}`)))

          .record;

        return overComps (concat (getQuery (thisRecord))) (record);
      },
      Variable: (value, as, cast) => {

        if (isSQLTag (value)) {
          if (as) {
            // subquery

            const [query, newValues] = compileSQLTag (value, values.length, params, table);

            return evolve ({
              comps: concat (`(${query}) as ${as}`),
              values: concat (newValues)
            }) (record);
          }
          return overSqlTag (sqlTag => sqlTag.concat (value)) (record);
        }
        return env.record;

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
        // }

      },
      StringLiteral: (value, as, cast) => {
        let sql = `'${value}'`;

        if (cast) {
          sql += `::${cast}`;
        }

        if (as) {
          sql += ` as ${as}`;
        }

        return overComps (concat (sql)) (record);
      },
      NumericLiteral: (value, as, cast) => {
        let sql = `${value}`;

        if (cast) {
          sql += `::${cast}`;
        }

        if (as) {
          sql += ` as ${as}`;
        }

        return overComps (concat (sql)) (record);
      },
      BooleanLiteral: (value, as, cast) => {
        let sql = `${value}`;

        if (cast) {
          sql += `::${cast}`;
        }

        if (as) {
          sql += ` as ${as}`;
        }

        return overComps (concat (sql)) (record);
      },
      NullLiteral: (value, as, cast) => {
        let sql = `${value}`;

        if (cast) {
          sql += `::${cast}`;
        }

        if (as) {
          sql += ` as ${as}`;
        }

        return overComps (concat (sql)) (record);
      }
    });

  };
  return goInterpret;
};




// class Interpreter<Input> {




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



// if (exp.type === "StringLiteral") {
//   const { value, as } = exp;
//   const { record } = env;

// }

// if (
//   exp.type === "NumericLiteral" ||
//   exp.type === "BooleanLiteral" ||
//   exp.type === "NullLiteral"
// ) {
// const { value, as } = exp;
// const { inFunction } = env.record;

// if (inFunction) {
//   env.writeToQuery (`${value}`);
// } else {
//   env.writeToQuery (`'${as}', ${value}`);
// }

//   return env.record;
// }

export default interpret;