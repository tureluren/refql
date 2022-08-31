import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { AstNode, CaseType, InterpretF, Rec } from "../types";
import convertCase from "../more/convertCase";
import chain from "../more/chain";
import toNext from "./toNext";
import interpretSqlTag from "./interpretSqlTag";
import Env from "../Env";
import { evolve, get, over, set } from "../Env/access";
import createEnv from "../Env/createEnv";
import concat from "../more/concat";
import {
  byId, castAs, fromTable, joinOn,
  paginate, select, selectRefs, whereIn
} from "./sqlBuilders";
import Raw from "../Raw";
import SqlTag from "../SqlTag";

const Interpreter = <Params> (caseType: CaseType, params: Params) => {
  const next = toNext (caseType);
  const includeSql = interpretSqlTag (params);

  const interpretMembers = (members: AstNode<Params>[], table: Table, inCall = false) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => interpret (mem, env)), createEnv<Params> (table, undefined, inCall));

  const interpret: InterpretF<Params> = (node, env, rows) => {
    const { rec } = env;
    const { values, table: parent, refs, inCall } = rec;

    const patched = node.run (params, parent);

    return patched.cata<Rec<Params>> ({
      Root: (table, members, { id, limit, offset }) =>
        interpretMembers (members, table)
          .map (fromTable (table))
          .map (byId (table, id, "where"))
          .map (includeSql (table, id != null))
          .map (paginate (limit, offset))
          .rec,

      HasMany: (table, members, { id, limit, offset }) => {
        if (!rows) return next (patched, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rrefs))
          .map (fromTable (table))
          .map (whereIn (refs.lrefs, refs.rrefs, rows, table))
          .map (byId (table, id))
          .map (includeSql (table))
          .map (paginate (limit, offset))
          .rec;
      },

      BelongsTo: (table, members, { id, limit, offset }) => {
        if (!rows) return next (patched, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rrefs))
          .map (fromTable (table))
          .map (whereIn (refs.lrefs, refs.rrefs, rows, table))
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
          .map (selectRefs (x, refs.lxrefs))
          .map (fromTable (table))
          .map (joinOn (refs.rxrefs, refs.rrefs, table, x))
          .map (whereIn (refs.lrefs, refs.lxrefs, rows, x))
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
        if (value instanceof Raw) return select (value.value, rec);

        if (value instanceof SqlTag) {
          if (inCall || as) {
            const [query, vals] = compileSqlTag (value, values.length, params, parent);

            return evolve ({
              comps: concat (castAs (!inCall ? `(${query})` : query, as, cast)),
              values: concat (vals)
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

  return interpret;
};

export default Interpreter;