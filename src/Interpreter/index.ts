import isRaw from "../Raw/isRaw";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTNode, OptCaseType, EnvRecord, InterpretFn } from "../types";
import convertCase from "../more/convertCase";
import get from "../Environment2/get";
import over from "../Environment2/over";
import chain from "../more/chain";
import evolve from "../Environment2/evolve";
import set from "../Environment2/set";
import isSQLTag from "../SQLTag/isSQLTag";
import createEnv from "../RQLTag/createEnv";
import moveToNext from "./moveToNext";
import whereIn from "./whereIn";
import fromTable from "./fromTable";
import joinOn from "./joinOn";
import select from "./select";
import interpretSQLTag from "./interpretSQLTag";
import castAs from "./castAs";
import selectRefs from "./selectRefs";

const interpret = <Input> (caseType: OptCaseType, params?: Input) => {
  const next = moveToNext (caseType);
  const includeSQL = interpretSQLTag (params);

  const interpretMembers = (members: ASTNode[], table: Table) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), createEnv<Input> (table));

  const goInterpret: InterpretFn<Input> = (exp, env, rows?) => {
    const { record } = env;
    const { values, table: parent, refs } = record;

    return exp.cata<EnvRecord<Input>> ({
      Root: (table, members) =>
        interpretMembers (members, table)
          .map (fromTable (table))
          .map (includeSQL (table))
          .record,

      BelongsTo: (table, members) => {
        if (!rows) return next (exp, record);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (includeSQL (table))
          .record;
      },
      HasMany: (table, members) => {
        if (!rows) return next (exp, record);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (includeSQL (table))
          .record;
      },
      ManyToMany: (table, members, keywords) => {
        if (!rows) return next (exp, record);

        const xTable = new Table (
          keywords.x || convertCase (caseType, `${parent.name}_${table.name}`)
        );

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (selectRefs (xTable, refs.lxkeys.concat (refs.rxkeys)))
          .map (fromTable (table))
          .map (joinOn (refs.rxkeys, refs.rkeys, table, xTable))
          .map (whereIn (refs.lkeys, refs.lxkeys, rows, xTable))
          .map (includeSQL (table))
          .record;
      },
      Call: (name, args, as, cast) => {
        const call = interpretMembers (args, parent)
          .map (chain (
            get ("comps"),
            comps =>
              set ("query") (castAs (`${name} (${comps.join (", ")})`, as, cast))))
          .record
          .query;

        return select (call) (record);
      },
      Variable: (value, as, cast) => {
        if (isSQLTag (value)) {
          if (as) {
            // subquery
            const [query, newValues] = compileSQLTag (value, values.length, params, parent);

            return evolve ({
              comps: c => c.concat (castAs (`(${query})`, as, cast)),
              values: v => v.concat (newValues)
            }) (record);
          }
          return over ("sqlTag") (tag => tag.concat (value)) (record);

        } else if (isRaw (value)) {
          return select (value.value) (record);
        }

        return evolve ({
          values: v => v.concat (value),
          comps: c => c.concat (castAs (`$${values.length + 1}`, as, cast))
        }) (record);
      },
      Identifier: (name, as, cast) =>
        select (castAs (`${parent.as}.${name}`, as, cast)) (record),

      StringLiteral: (value, as, cast) =>
        select (castAs (`'${value}'`, as, cast)) (record),

      NumericLiteral: (value, as, cast) =>
        select (castAs (value, as, cast)) (record),

      BooleanLiteral: (value, as, cast) =>
        select (castAs (value, as, cast)) (record),

      NullLiteral: (value, as, cast) =>
        select (castAs (value, as, cast)) (record)
    });
  };

  return goInterpret;
};

export default interpret;