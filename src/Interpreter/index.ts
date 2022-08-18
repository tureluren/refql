import isRaw from "../Raw/isRaw";
import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { AstNode, OptCaseType, EnvRecord } from "../types";
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
import Environment from "../Environment2";
import concat from "../more/concat";
import byId from "./byId";
import paginate from "./paginate";

const interpret = <Input> (caseType: OptCaseType, params: Input) => {
  const next = moveToNext (caseType);
  const includeSql = interpretSqlTag (params);

  const interpretMembers = (members: AstNode<Input>[], table: Table, inCall = false) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), createEnv<Input> (table, undefined, inCall));

  const goInterpret = (node: AstNode<Input>, env: Environment<Input>, rows?: any[]): EnvRecord<Input> => {
    const { record } = env;
    const { values, table: parent, refs, inCall } = record;

    const patched = node.run (params, parent);

    return patched.cata<EnvRecord<Input>> ({
      Root: (table, members, { id, limit, offset }) =>
        interpretMembers (members, table)
          .map (fromTable (table))
          .map (byId (table, id, "where"))
          .map (includeSql (table, id != null))
          .map (paginate (limit, offset))
          .record,

      BelongsTo: (table, members, { id, limit, offset }) => {
        if (!rows) return next (patched, record);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (byId (table, id))
          .map (includeSql (table))
          .map (paginate (limit, offset))
          .record;
      },

      HasMany: (table, members, { id, limit, offset }) => {
        if (!rows) return next (patched, record);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (byId (table, id))
          .map (includeSql (table))
          .map (paginate (limit, offset))
          .record;
      },

      ManyToMany: (table, members, { id, limit, offset, xtable }) => {
        if (!rows) return next (patched, record);

        const x = new Table (
          xtable || convertCase (caseType, `${parent.name}_${table.name}`)
        );

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (selectRefs (x, concat (refs.rxkeys, refs.lxkeys)))
          .map (fromTable (table))
          .map (joinOn (refs.rxkeys, refs.rkeys, table, x))
          .map (whereIn (refs.lkeys, refs.lxkeys, rows, x))
          .map (byId (table, id))
          .map (includeSql (table))
          .map (paginate (limit, offset))
          .record;
      },

      Call: (name, args, as, cast) => {
        const callRecord = interpretMembers (args, parent, true)
          .map (chain (
            get ("comps"), comps =>
              set ("query", castAs (`${name} (${comps.join (", ")})`, as, cast))))

          .record;

        return evolve ({
          comps: concat (callRecord.query),
          values: concat (callRecord.values)
        }, record);
      },

      Variable: (value, as, cast) => {
        if (isRaw (value)) return select (value.value, record);

        if (isSqlTag<Input> (value)) {
          if (inCall || as) {
            const [query, newValues] = compileSqlTag (value, values.length, params, parent);

            return evolve ({
              comps: concat (castAs (!inCall ? `(${query})` : query, as, cast)),
              values: concat (newValues)
            }, record);
          }

          return over ("sqlTag", concat (value), record);
        }

        return evolve ({
          comps: concat (castAs (`$${values.length + 1}`, as, cast)),
          values: concat (value)
        }, record);
      },

      All: sign =>
        select (`${parent.as}.${sign}`, record),

      Identifier: (name, as, cast) =>
        select (castAs (`${parent.as}.${name}`, as, cast), record),

      StringLiteral: (value, as, cast) =>
        select (castAs (`'${value}'`, as, cast), record),

      NumericLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), record),

      BooleanLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), record),

      NullLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), record)
    });
  };

  return goInterpret;
};

export default interpret;