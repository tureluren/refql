import { evolve, get, over, set } from "../Env/access";
import Env from "../Env";
import createEnv from "../Env/createEnv";
import Rec from "../Env/Rec";
import chain from "../common/chain";
import concat from "../common/concat";
import { ASTNode } from "../nodes";
import Raw from "../Raw";
import SQLTag from "../SQLTag";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import interpretSQLTag from "./interpretSQLTag";
import {
  byId, castAs, fromTable, joinOn,
  paginate, select, selectRefs, whereIn
} from "./sqlBuilders";
import next from "./next";

export type InterpretF<Params> = (exp: ASTNode<Params>, env: Env, rows?: any[]) => Rec;

const Interpreter = <Params> (params: Params) => {
  const includeSQL = interpretSQLTag (params);
  const toNext = next (params);

  const interpretMembers = (members: ASTNode<Params>[], table: Table, inCall = false) =>
    members.reduce ((acc, mem) =>
      acc.extend (env => interpret (mem, env)), createEnv (table, undefined, inCall));

  const interpret: InterpretF<Params> = (node, env, rows) => {
    const { rec } = env;
    const { values, table: parent, refs, inCall } = rec;

    return node.caseOf<Rec> ({
      Root: (table, members) =>
        interpretMembers (members, table)
          .map (fromTable (table))
          // .map (byId (table, id, "where"))
          // .map (includeSQL (table, id != null))
          // .map (paginate (limit, offset))
          .rec,

      HasMany: (table, members) => {
        if (!rows) return toNext (node, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rrefs))
          .map (fromTable (table))
          .map (whereIn (refs.lrefs, refs.rrefs, rows, table))
          // .map (byId (table, id))
          .map (includeSQL (table))
          // .map (paginate (limit, offset))
          .rec;
      },

      HasOne: (table, members) => {
        if (!rows) return toNext (node, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rrefs))
          .map (fromTable (table))
          .map (whereIn (refs.lrefs, refs.rrefs, rows, table))
          // .map (byId (table, id))
          .map (includeSQL (table))
          // .map (paginate (limit, offset))
          .rec;
      },

      BelongsTo: (table, members) => {
        if (!rows) return toNext (node, rec);

        return interpretMembers (members, table)
          .map (selectRefs (table, refs.rrefs))
          .map (fromTable (table))
          .map (whereIn (refs.lrefs, refs.rrefs, rows, table))
          // .map (byId (table, id))
          .map (includeSQL (table))
          // .map (paginate (limit, offset))
          .rec;
      },

      // als includeSQL niet empty is, empty monoid sqlTag, gebruik dan LITERAL
      BelongsToMany: (table, members, { xTable }) => {
        if (!rows) return toNext (node, rec);

        // const x = Table (
        //   xtable || `${parent.name}_${table.name}`
        // );

        // MAAK AL TABLE DOOR USER
        // const x = Table (
        //   // `${parent.name}_${table.name}`
        //   xTable
        // );

        return interpretMembers (members, table)
          .map (selectRefs (xTable, refs.lxrefs))
          .map (fromTable (table, true))
          .map (joinOn (refs.rxrefs, refs.rrefs, table, xTable))
          .map (whereIn (refs.lrefs, refs.lxrefs, rows, xTable))
          // .map (byId (table, id))
          .map (includeSQL (table))
          // .map (paginate (limit, offset))
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
        if (Raw.isRaw (value)) return select (value.value, rec);

        if (SQLTag.isSQLTag<Params> (value)) {
          if (inCall || as) {
            const [query, vals] = compileSQLTag (value, values.length, params, parent);

            return evolve ({
              comps: concat (castAs (`(${query})`, as, cast)),
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
        select (castAs (`${parent.name}.${name}`, as, cast), rec),

      StringLiteral: (value, as, cast) =>
        select (castAs (`'${value}'`, as, cast), rec),

      NumericLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), rec),

      BooleanLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), rec),

      NullLiteral: (value, as, cast) =>
        select (castAs (value, as, cast), rec)
    }, params, parent);
  };

  return interpret;
};

export default Interpreter;