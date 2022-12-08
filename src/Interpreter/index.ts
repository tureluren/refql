import { evolve, get, over, set } from "../Env/access";
import Env from "../Env";
import createEnv from "../Env/createEnv";
import Rec from "../Env/Rec";
import chain from "../common/chain";
import concat from "../common/concat";
import { all, All, ASTNode, Call, Identifier, isLiteral, Variable } from "../nodes";
import Raw from "../Raw";
import SQLTag from "../SQLTag";
import Table from "../Table";
import interpretSQLTag from "./interpretSQLTag";
import {
  castAs, fromTable, joinOn, refsToComp,
  refToComp,
  select, selectRefs, whereIn
} from "./sqlBuilders";
import next from "./next";
import sql from "../SQLTag/sql";
import Values from "../Values";

export type InterpretF<Params> = (exp: ASTNode<Params>, env: Env, rows?: any[]) => Rec;

// move comps to sqlTag ??
// const Interpreter = <Params> (params: Params) => {
// const includeSQL = interpretSQLTag (params);
// const toNext = next (params);
const includeSQL = interpretSQLTag ({});
const toNext = next ({});

const createRef = (as: string) => (kw: string, ref: string) => ({
  name: ref.trim (),
  as: `${(as).replace (/_/g, "").toLowerCase ()}${kw}`
});

const interpretMembers = <Params>(members: ASTNode<Params>[], table: Table, inCall = false) => {
  const nodes = members.filter (m =>
      Identifier.isIdentifier (m) || isLiteral (m) || All.isAll (m) || Call.isCall (m)
    ).length ? members : members.concat (all);

  return nodes.reduce ((acc, mem) =>
      acc.extend (env => interpret (mem, env)), createEnv (table, undefined, inCall));
};

const interpret: InterpretF<unknown> = (node, env, rows) => {
  const { rec } = env;
  const { values, table: parent, refs, inCall } = rec;

  return node.caseOf<Rec> ({
    Root: (table, members) =>
      interpretMembers (members, table)
        .map (fromTable (table))
      // .map (includeSQL (table, false))
        .rec,

    HasMany: (table, members) => {
      if (!rows) return toNext (node, rec);

      return interpretMembers (members, table)
        .map (selectRefs (table, refs.rRefs))
        .map (fromTable (table))
        .map (whereIn (refs.lRefs, refs.rRefs, rows, table))
        .map (includeSQL (table))
        .rec;
    },

    HasOne: (table, members) => {
      if (!rows) return toNext (node, rec);

      return interpretMembers (members, table)
        .map (selectRefs (table, refs.rRefs))
        .map (fromTable (table))
        .map (whereIn (refs.lRefs, refs.rRefs, rows, table))
        .map (includeSQL (table))
        .rec;
    },

    BelongsTo: (tag, { as, lRef, rRef }) => {
      const { table } = tag.node;

      const refOf = createRef (as);
      const lr = refOf ("lref", lRef);
      const rr = refOf ("rref", rRef);

      const whereIn = sql<{rows: any[]}, any>`
        where ${Raw (`${table.name}.${rr.name}`)} 
        in ${Values (
          p =>
            [...new Set (p.rows.map (r => r[lr.as]))]
        )}
      `;

      const refTag = table<{rows: any[]}, any>`
        ${Identifier (rr.name, rr.as)}
        ${Variable (whereIn)} 
      `.concat (tag);

      return evolve ({
        comps: concat (() => refToComp (parent, lr)),
        next: concat ({ tag: refTag, lRef: lr, rRef: rr, as, refType: "BelongsTo" })
      }, rec);
    },

    // als includeSQL niet empty is, empty monoid sqlTag, gebruik dan LITERAL
    BelongsToMany: (table, members, { xTable }) => {
      if (!rows) return toNext (node, rec);

      return interpretMembers (members, table)
        .map (selectRefs (xTable, refs.lxRefs))
        .map (fromTable (table, true))
        .map (joinOn (refs.rxRefs, refs.rRefs, table, xTable))
        .map (whereIn (refs.lRefs, refs.lxRefs, rows, xTable))
        .map (includeSQL (table))
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
      if (Raw.isRaw (value)) return select (value.run, rec);

      if (SQLTag.isSQLTag<unknown, any> (value)) {
        if (inCall || as) {
          const [query, vals] = value.compile (params, values.length, parent);

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
      select (`${parent.name}.${sign}`, rec),

    Identifier: (name, as, cast) =>
      select (() => castAs (`${parent.name}.${name}`, as, cast), rec),

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

// };

export default interpret;