import isRaw from "../Raw/isRaw";
import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { ASTNode, OptCaseType, EnvRecord, RQLValue } from "../types";
import convertCase from "../more/convertCase";
import get from "../Environment2/get";
import over from "../Environment2/over";
import chain from "../more/chain";
import evolve from "../Environment2/evolve";
import set from "../Environment2/set";
import isSqlTag from "../SqlTag/isSqlTag";
import createEnv from "../RqlTag/createEnv";
import moveToNext from "./moveToNext";
import whereIn from "./whereIn";
import fromTable from "./fromTable";
import joinOn from "./joinOn";
import select from "./select";
import interpretSqlTag from "./interpretSqlTag";
import castAs from "./castAs";
import selectRefs from "./selectRefs";
import isFunction from "../predicate/isFunction";
import runKeyword from "./runKeyword";
import Environment from "../Environment2";
import concat from "../more/concat";

const interpret = <Input> (caseType: OptCaseType, params: Input) => {
  const next = moveToNext (caseType, params);
  const includeSql = interpretSqlTag (params);

  const interpretMembers = (members: ASTNode[], table: Table, inCall = false) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), createEnv<Input> (table, undefined, inCall));

  const goInterpret = (exp: ASTNode, env: Environment<Input>, rows?: any[]): EnvRecord<Input> => {
    const { record } = env;
    const { values, table: parent, refs, inCall } = record;

    return exp.cata<Input, EnvRecord<Input>> ({
      Root: (table, members) =>
        interpretMembers (members, table)
          .map (fromTable (table))
          .map (includeSql (table))
          .record,

      BelongsTo: (table, members) => {
        if (!rows) return next (exp, record);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (includeSql (table))
          .record;
      },
      HasMany: (table, members) => {
        if (!rows) return next (exp, record);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (includeSql (table))
          .record;
      },
      ManyToMany: (table, members, { x }) => {
        if (!rows) return next (exp, record);

        const xTable = new Table (
          runKeyword (params, table) (x)
          || convertCase (caseType, `${parent.name}_${table.name}`)
        );

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (selectRefs (xTable, refs.lxkeys.concat (refs.rxkeys)))
          .map (fromTable (table))
          .map (joinOn (refs.rxkeys, refs.rkeys, table, xTable))
          .map (whereIn (refs.lkeys, refs.lxkeys, rows, xTable))
          .map (includeSql (table))
          .record;
      },
      Call: (name, args, as, cast) => {
        const callRecord = interpretMembers (args, parent, true)
          .map (chain (
            get ("comps"),
            comps =>
              set ("query") (castAs (`${name} (${comps.join (", ")})`, as, cast))))
          .record;

        return evolve ({
          comps: concat (callRecord.query),
          values: concat (callRecord.values)
        }) (record);

      },
      Variable: (value, as, cast) => {
        const processVar = (variable: RQLValue<Input>) => {
          if (isSqlTag<Input> (variable)) {
            if (inCall || as) {
              const [query, newValues] = compileSqlTag (variable, values.length, params, parent);

              const sql = !inCall ? `(${query})` : query;

              return evolve ({
                comps: concat (castAs (sql, as, cast)),
                values: concat (newValues)
              }) (record);
            }

            return over ("sqlTag") (concat (variable)) (record);
          }

          if (isRaw (variable)) {
            return select (variable.value) (record);
          }

          return evolve ({
            comps: concat (castAs (`$${values.length + 1}`, as, cast)),
            values: concat (variable)
          }) (record);
        };

        return isFunction (value)
          ? processVar (value (params, parent))
          : processVar (value);

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