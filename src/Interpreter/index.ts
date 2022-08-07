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

const castAs = (sql: string | number | boolean | null, as?: string, cast?: string) =>
  `${sql}${cast ? `::${cast}` : ""}${as ? ` as ${as}` : ""}`;

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


  const goInterpret: InterpretFn<Input> = (exp, env, rows?) => {
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
        const sql = `${table.as}.${name}`;

        return overComps (concat (castAs (sql, as, cast))) (record);
      },
      Call: (name, args, as, cast) => {
        const thisRecord = interpretComps (args, createEnv<Input> (table))
          .map (chain (
            getComps,
            comps =>
              setQuery (castAs (`${name} (${comps.join (", ")})`, as, cast))))

          .record;

        return overComps (concat (getQuery (thisRecord))) (record);
      },
      Variable: (value, as, cast) => {
        if (isSQLTag (value)) {
          if (as) {
            const [query, newValues] = compileSQLTag (value, values.length, params, table);

            return evolve ({
              comps: concat (castAs (`(${query})`, as, cast)),
              values: concat (newValues)
            }) (record);
          }
          return overSqlTag (sqlTag => sqlTag.concat (value)) (record);

        } else if (isRaw (value)) {
          return overComps (concat (value.value)) (record);
        }

        return evolve ({
          values: concat (value),
          comps: concat (castAs (`$${values.length + 1}`, as, cast))
        }) (record);
      },
      StringLiteral: (value, as, cast) =>
        overComps (concat (castAs (`'${value}'`, as, cast))) (record),

      NumericLiteral: (value, as, cast) =>
        overComps (concat (castAs (value, as, cast))) (record),

      BooleanLiteral: (value, as, cast) =>
        overComps (concat (castAs (value, as, cast))) (record),

      NullLiteral: (value, as, cast) =>
        overComps (concat (castAs (value, as, cast))) (record)
    });

  };
  return goInterpret;
};

export default interpret;