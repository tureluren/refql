import isRaw from "../Raw/isRaw";
import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { AstNode, OptCaseType, Rec } from "../types";
import convertCase from "../more/convertCase";
import chain from "../more/chain";
import isSqlTag from "../SqlTag/isSqlTag";
import toNext from "./toNext";
import interpretSqlTag from "./interpretSqlTag";
import Environment from "../Environment2";
import { evolve, get, over, set } from "../Environment2/access";
import createEnv from "../Environment2/createEnv";
import concat from "../more/concat";
import {
  byId, castAs, fromTable, joinOn,
  paginate, select, selectRefs, whereIn
} from "./sqlBuilders";

const interpret = <Input> (caseType: OptCaseType, params: Input) => {
  const next = toNext (caseType);
  const includeSql = interpretSqlTag (params);

  const interpretMembers = (members: AstNode<Input>[], table: Table, inCall = false) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => goInterpret (mem, env)), createEnv<Input> (table, undefined, inCall));

  const goInterpret = (node: AstNode<Input>, env: Environment<Input>, rows?: any[]): Rec<Input> => {
    const { rec } = env;
    const { values, table: parent, refs, inCall } = rec;

    const patched = node.run (params, parent);

    return patched.cata<Rec<Input>> ({
      Root: (table, members, { id, limit, offset }) =>
        interpretMembers (members, table)
          .map (fromTable (table))
          .map (byId (table, id, "where"))
          .map (includeSql (table, id != null))
          .map (paginate (limit, offset))
          .rec,

      BelongsTo: (table, members, { id, limit, offset }) => {
        if (!rows) return next (patched, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (byId (table, id))
          .map (includeSql (table))
          .map (paginate (limit, offset))
          .rec;
      },

      HasMany: (table, members, { id, limit, offset }) => {
        if (!rows) return next (patched, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rkeys))
          .map (fromTable (table))
          .map (whereIn (refs.lkeys, refs.rkeys, rows, table))
          .map (byId (table, id))
          .map (includeSql (table))
          .map (paginate (limit, offset))
          .rec;
      },

      ManyToMany: (table, members, { id, limit, offset, xtable }) => {
        if (!rows) return next (patched, rec);

        const x = Table.of (
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
          .rec;
      },

      Call: (name, args, as, cast) => {
        const callRecord = interpretMembers (args, parent, true)
          .map (chain (
            get ("comps"), comps =>
              set ("query", castAs (`${name} (${comps.join (", ")})`, as, cast))))

          .rec;

        return evolve ({
          comps: concat (callRecord.query),
          values: concat (callRecord.values)
        }, rec);
      },

      Variable: (value, as, cast) => {
        if (isRaw (value)) return select (value.value, rec);

        if (isSqlTag<Input> (value)) {
          if (inCall || as) {
            const [query, newValues] = compileSqlTag (value, values.length, params, parent);

            return evolve ({
              comps: concat (castAs (!inCall ? `(${query})` : query, as, cast)),
              values: concat (newValues)
            }, rec);
          }

          return over ("sqlTag", concat (value), rec);
        }

        return evolve ({
          comps: concat (castAs (`$${values.length + 1}`, as, cast)),
          values: concat (value)
        }, rec);
      },

      All: sign =>
        select (`${parent.as}.${sign}`, rec),

      Identifier: (name, as, cast) =>
        select (castAs (`${parent.as}.${name}`, as, cast), rec),

      StringLiteral: (value, as, cast) =>
        select (castAs (`'${value}'`, as, cast), rec),

      NumericLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), rec),

      BooleanLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), rec),

      NullLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), rec)
    });
  };

  return goInterpret;
};

export default interpret;