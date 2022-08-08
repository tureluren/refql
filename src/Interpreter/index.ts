import isRaw from "../Raw/isRaw";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType, Dict, EnvRecord, RefsNew, Next, Values, NamedKeys, InterpretFn, Keywords } from "../types";
import parameterize from "../more/parameterize";
import convertCase from "../more/convertCase";
import lookup from "../Environment2/lookup";
import over from "../Environment2/over";
import chain from "../more/chain";
import evolve from "../Environment2/evolve";
import set from "../Environment2/set";
import isSQLTag from "../SQLTag/isSQLTag";
import createEnv from "../RQLTag/createEnv";

const overComps = over ("comps");
const overQuery = over ("query");
const overSqlTag = over ("sqlTag");
const getComps = lookup ("comps");
const getValues = lookup ("values");
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

const mapToRef = (table: Table) => (ref: string, keys: string) =>
  splitKeys (keys).map ((name, idx) => ({
    name,
    as: `${table.as}${ref}${idx}`
  }));

const keysToRefs = (caseType: OptCaseType) => <Input>(exp: ASTNode, record: EnvRecord<Input>) => {
  const { table } = record;

  let refs: RefsNew = {
    lkeys: [],
    rkeys: [],
    lxkeys: [],
    rxkeys: []
  };

  const mapToTableRef = mapToRef (table);

  exp.cata<void> ({
    BelongsTo: (child, _members, keywords) => {
      refs.lkeys = mapToTableRef ("lkey", keywords.lkey || convertCase (caseType, child.name + "_id"));
      refs.rkeys = mapToTableRef ("rkey", keywords.rkey || "id");
    },
    HasMany: (_child, _members, keywords) => {
      refs.lkeys = mapToTableRef ("lkey", keywords.lkey || "id");
      refs.rkeys = mapToTableRef ("rkey", keywords.rkey || convertCase (caseType, table.name + "_id"));
    },
    ManyToMany: (child, _members, keywords) => {
      refs.lkeys = mapToTableRef ("lkey", keywords.lkey || "id");
      refs.rkeys = mapToTableRef ("rkey", keywords.rkey || "id");
      refs.lxkeys = mapToTableRef ("lxkey", keywords.lxkey || convertCase (caseType, table.name + "_id"));
      refs.rxkeys = mapToTableRef ("rxkey", keywords.rxkey || convertCase (caseType, child.name + "_id"));
    }
  });

  return evolve ({
    comps: concatKeys (table, refs.lkeys),
    next: concat ({ exp, refs })
  }) (record);

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

// overComps (concat (castAs (`${table.as}.${name}`, as, cast))) (record),

const addComp = (comps: string | string[]) =>
  overComps (c => c.concat (comps));

const addKeys = (table: Table, keys: NamedKeys[]) =>
  addComp (keys.map (k => `${table.as}.${k.name} as ${k.as}`));


const includeSql = <Input>(params?: Input) => (table: Table) => (record: EnvRecord<Input>) => {
  const { sqlTag, values } = record;

  const [query, newValues] = compileSQLTag (sqlTag, values.length, params, table);

  return evolve ({
    query: concatQuery (query),
    values: concat (newValues)
  }) (record);
};


const interpret = <Input> (caseType: OptCaseType, useSmartAlias: boolean, params?: Input) => {

  const interpretComps = (members: ASTNode[], table: Table) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), createEnv<Input> (table));


  const toRefs = keysToRefs (caseType);
  const addSql = includeSql (params);

  const goInterpret: InterpretFn<Input> = (exp, env, rows?) => {
    const { record } = env;
    const { values, table, refs } = record;

    return exp.cata<EnvRecord<Input>> ({
      Root: (table, members) =>
        interpretComps (members, table)
          .map (selectFrom (table))
          .map (addSql (table))
          .record,

      BelongsTo: (child, members) => {
        if (!rows) {
          return toRefs (exp, record);
        }

        return interpretComps (members, child)
          .map (addKeys (child, refs.rkeys))
          .map (selectFrom (child))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, child))
          .map (addSql (child))
          .record;
      },
      HasMany: (child, members) => {
        if (!rows) {
          return toRefs (exp, record);
        }

        return interpretComps (members, child)
          .map (addKeys (child, refs.rkeys))
          .map (selectFrom (child))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, child))
          .map (addSql (child))
          .record;
      },
      ManyToMany: (child, members, keywords) => {
        if (!rows) {
          return toRefs (exp, record);
        }

        const xTable = new Table (keywords.x || convertCase (caseType, `${table.name}_${child.name}`));

        return interpretComps (members, child)
          .map (addKeys (child, refs.rkeys))
          .map (addKeys (xTable, refs.lxkeys.concat (refs.rxkeys)))
          .map (selectFrom (child))
          .map (join (refs.rxkeys, refs.rkeys, child, xTable))
          .map (whereIn (refs.lkeys, refs.lxkeys, rows, xTable))
          .map (addSql (child))

          .record;
      },
      Call: (name, args, as, cast) => {
        const thisRecord = interpretComps (args, table)
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
          return addComp (value.value) (record);
        }

        return evolve ({
          values: concat (value),
          comps: concat (castAs (`$${values.length + 1}`, as, cast))
        }) (record);
      },
      Identifier: (name, as, cast) =>
        addComp (castAs (`${table.as}.${name}`, as, cast)) (record),

      StringLiteral: (value, as, cast) =>
        addComp (castAs (`'${value}'`, as, cast)) (record),

      NumericLiteral: (value, as, cast) =>
        addComp (castAs (value, as, cast)) (record),

      BooleanLiteral: (value, as, cast) =>
        addComp (castAs (value, as, cast)) (record),

      NullLiteral: (value, as, cast) =>
        addComp (castAs (value, as, cast)) (record)
    });

  };
  return goInterpret;
};

export default interpret;