import isRaw from "../Raw/isRaw";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType, Dict, EnvRecord, RefsNew, Next, Values, NamedKeys, InterpretFn, Keywords } from "../types";
import parameterize from "../more/parameterize";
import convertCase from "../more/convertCase";
import view from "../Environment2/view";
import over from "../Environment2/over";
import chain from "../more/chain";
import evolve from "../Environment2/evolve";
import set from "../Environment2/set";
import isSQLTag from "../SQLTag/isSQLTag";
import createEnv from "../RQLTag/createEnv";

const overComps = over ("comps");
const overQuery = over ("query");
const overSqlTag = over ("sqlTag");
const getComps = view ("comps");
const getValues = view ("values");
const getQuery = view ("query");
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
  comps => setQuery (`select ${comps.join (", ")} from ${table.name} ${table.as}`)
);

const splitKeys = (keys: string = "") =>
  keys.split (",").map (s => s.trim ());

const mapToRef = (table: Table) => (ref: string, keys: string) =>
  splitKeys (keys).map ((name, idx) => ({
    name,
    as: `${table.as}${ref}${idx}`
  }));

const moveToNext = (caseType: OptCaseType) => <Input>(exp: ASTNode, record: EnvRecord<Input>) => {
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

const whereIn = (lkeys: NamedKeys[], rkeys: NamedKeys[], rows: any[], table: Table) => chain (
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
  }
);

const joinOn = (lkeys: NamedKeys[], rkeys: NamedKeys[], table: Table, xTable: Table) =>
  overQuery (query =>
    lkeys.reduce ((q, lk, idx) => {
      const rk = rkeys[idx];
      const op = idx === 0 ? "" : "and ";

      return `${q} ${op}${xTable.as}.${lk.name} = ${table.as}.${rk.name}`;

    }, `${query} join ${xTable.name} as ${xTable.as} on`)
  );

const addComp = (comp: string | string[]) =>
  over ("comps") (c => c.concat (comp));

const addKeys = (table: Table, keys: NamedKeys[]) =>
  addComp (keys.map (k => `${table.as}.${k.name} as ${k.as}`));


const interpretSQLTag = <Input>(params?: Input) => (table: Table) => (record: EnvRecord<Input>) => {
  const { sqlTag, values } = record;

  const [query, newValues] = compileSQLTag (sqlTag, values.length, params, table);

  return evolve ({
    query: concatQuery (query),
    values: concat (newValues)
  }) (record);
};


const interpret = <Input> (caseType: OptCaseType, params?: Input) => {
  const next = moveToNext (caseType);
  const includeSql = interpretSQLTag (params);

  const interpretMembers = (members: ASTNode[], table: Table) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), createEnv<Input> (table));

  const goInterpret: InterpretFn<Input> = (exp, env, rows?) => {
    const { record } = env;
    const { values, table: parent, refs } = record;

    return exp.cata<EnvRecord<Input>> ({
      Root: (table, members) =>
        interpretMembers (members, table)
          .map (selectFrom (table))
          .map (includeSql (table))
          .record,

      BelongsTo: (table, members) => {
        if (!rows) return next (exp, record);

        return interpretMembers (members, table)
          .map (addKeys (table, refs.rkeys))
          .map (selectFrom (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (includeSql (table))
          .record;
      },
      HasMany: (table, members) => {
        if (!rows) return next (exp, record);

        return interpretMembers (members, table)
          .map (addKeys (table, refs.rkeys))
          .map (selectFrom (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (includeSql (table))
          .record;
      },
      ManyToMany: (table, members, keywords) => {
        if (!rows) return next (exp, record);

        const xTable = new Table (
          keywords.x || convertCase (caseType, `${parent.name}_${table.name}`)
        );

        return interpretMembers (members, table)
          .map (addKeys (table, refs.rkeys))
          .map (addKeys (xTable, refs.lxkeys.concat (refs.rxkeys)))
          .map (selectFrom (table))
          .map (joinOn (refs.rxkeys, refs.rkeys, table, xTable))
          .map (whereIn (refs.lkeys, refs.lxkeys, rows, xTable))
          .map (includeSql (table))
          .record;
      },
      Call: (name, args, as, cast) => {
        const callRecord = interpretMembers (args, parent)
          .map (chain (
            getComps,
            comps =>
              setQuery (castAs (`${name} (${comps.join (", ")})`, as, cast))))

          .record;

        return addComp (getQuery (callRecord)) (record);
      },
      Variable: (value, as, cast) => {
        if (isSQLTag (value)) {
          if (as) {
            const [query, newValues] = compileSQLTag (value, values.length, params, parent);

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
        addComp (castAs (`${parent.as}.${name}`, as, cast)) (record),

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