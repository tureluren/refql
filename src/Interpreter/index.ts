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
import RQLTag from "../RQLTag";
import { Ref, Refs, TagFunctionVariable } from "../common/types";

export type InterpretF<Params> = (exp: ASTNode<Params>, env: Env, rows?: any[]) => Rec;

export interface Next {
  tag: RQLTag<unknown, unknown>;
  lRef: Ref;
  rRef: Ref;
  as: string;
  refType: "BelongsTo" | "HasOne";
}

// export default interface Rec {
//   strings: TagFunctionVariable<unknown>[];
//   sqlTag: SQLTag<unknown, unknown>;
//   comps: (() => string)[];
//   values: TagFunctionVariable<unknown>[];
//   inCall: boolean;
// }

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

const interpret = <Params>(table: Table, nodes: ASTNode<Params>[], inCall = false) => {
  // const { rec } = env;
  // const { values, table: parent, refs, inCall } = rec;
  const comps = [] as (() => string)[];
  const next = [] as Next[];
  let strings = [] as TagFunctionVariable<Params>[];
  let values = [] as TagFunctionVariable<Params>[];
  let sqlTag = SQLTag.empty ();

  for (const node of nodes) {
    node.caseOf<void> ({
      BelongsTo: (tag, { as, lRef, rRef }) => {
        const child = tag.table;

        const refOf = createRef (as);
        const lr = refOf ("lref", lRef);
        const rr = refOf ("rref", rRef);

        const whereIn = sql<{refQLRows: any[]}, any>`
          where ${Raw (`${child.name}.${rr.name}`)}
          in ${Values (
            p =>
              [...new Set (p.refQLRows.map (r => r[lr.as]))]
          )}
        `;

        const refTag = child<{rows: any[]}, any>`
          ${Identifier (rr.name, rr.as)}
          ${Variable (whereIn)}
        `.concat (tag);

        comps.push (() => refToComp (table, lr));
        next.push ({ tag: refTag, lRef: lr, rRef: rr, as, single: true });
      },

      BelongsToMany: (tag, { as, lRef, rRef, lxRef, rxRef, xTable }) => {
        const child = tag.table;

        const refOf = createRef (as);
        const lr = refOf ("lref", lRef);
        const rr = refOf ("rref", rRef);

        const lxr = refOf ("lxref", lxRef);
        const rxr = refOf ("rxref", rxRef);

        const whereIn = sql<{refQLRows: any[]}, any>`
          join ${Raw (`${xTable.name} on ${xTable.name}.${rxr.name} = ${child.name}.${rr.name}`)}
          where ${Raw (`${xTable.name}.${lxr.name}`)}
          in ${Values (
            p =>
              [...new Set (p.refQLRows.map (r => r[lr.as]))]
          )}
        `;

        const refTag = child<{rows: any[]}, any>`
          ${Raw (`${xTable.name}.${lxr.name} ${lxr.as}`)}
          ${Variable (whereIn)}
        `.concat (tag);

        comps.push (() => refToComp (table, lr));
        next.push ({ tag: refTag, lRef: lr, rRef: lxr, as, single: false });
      },

      HasOne: (tag, { as, lRef, rRef }) => {
        const child = tag.table;

        const refOf = createRef (as);
        const lr = refOf ("lref", lRef);
        const rr = refOf ("rref", rRef);

        const whereIn = sql<{refQLRows: any[]}, any>`
          where ${Raw (`${child.name}.${rr.name}`)}
          in ${Values (
            p =>
              [...new Set (p.refQLRows.map (r => r[lr.as]))]
          )}
        `;

        const refTag = child<{rows: any[]}, any>`
          ${Identifier (rr.name, rr.as)}
          ${Variable (whereIn)}
        `.concat (tag);

        comps.push (() => refToComp (table, lr));
        next.push ({ tag: refTag, lRef: lr, rRef: rr, as, single: true });
      },

      HasMany: (tag, { as, lRef, rRef }) => {

        const child = tag.table;

        const refOf = createRef (as);
        const lr = refOf ("lref", lRef);
        const rr = refOf ("rref", rRef);

        const whereIn = sql<{refQLRows: any[]}, any>`
          where ${Raw (`${child.name}.${rr.name}`)}
          in ${Values (
            p =>
              [...new Set (p.refQLRows.map (r => r[lr.as]))]
          )}
        `;

        const refTag = child<{rows: any[]}, any>`
          ${Identifier (rr.name, rr.as)}
          ${Variable (whereIn)}
        `.concat (tag);

        comps.push (() => refToComp (table, lr));
        next.push ({ tag: refTag, lRef: lr, rRef: rr, as, single: false });
      },

      Call: (name, nodes, as, cast) => {
        // aparte interpret in compile voor call maken ?
        const call = interpret (table, nodes, true);

        comps.push (p => castAs (`${name} (${call.comps.map (c => c (p)).join (", ")})`, as, cast));
        // values: concat (callRecord.values)
      },

      Values: () => {
        throw new Error ("jdjdjd");
      },

      All: sign => {
        comps.push (() => `${table.name}.${sign}`);
      },

      Identifier: (name, as, cast) => {
        comps.push (() => castAs (`${table.name}.${name}`, as, cast));
      },

      StringLiteral: (value, as, cast) => {
        comps.push (() => castAs (`'${value}'`, as, cast));
      },

      NumericLiteral: (value, as, cast) => {
        comps.push (() => castAs (value, as, cast));
      },

      BooleanLiteral: (value, as, cast) => {
        comps.push (() => castAs (value, as, cast));
      },

      NullLiteral: (value, as, cast) => {
        comps.push (() => castAs (value, as, cast));
      },

      Raw: run => {
        comps.push (run);
      },

      Variable: (value, as, cast) => {

        if (SQLTag.isSQLTag<unknown, any> (value)) {
          // if (inCall || as) {
          //   const [query, vals] = value.compile (params, values.length, parent);

          //   return evolve ({
          //     comps: concat (castAs (`(${query})`, as, cast)),
          //     values: concat (vals)
          //   }, rec);
          // }

          sqlTag = sqlTag.concat (value);
        }

        // return evolve ({
        //   comps: concat (castAs (`$${values.length + 1}`, as, cast)),
        //   values: concat (value)
        // }, rec);
      }

    });


  }

  if (!inCall) {
    // distinct ?
    strings = [() => "select", p => `${comps.map (f => f (p)).join (", ")}`, () => `from ${table}`, p => {
      const [query] = sqlTag.compile (p);
      return query;
    }];
    // .map (includeSQL (table, false))
  }

  values = [p => {
    const [_q, values] = sqlTag.compile (p);
    return values;
  }].flat (1);

  return {
    next, strings, values, comps
  };

  // node.caseOf<Rec> ({

  //   Variable: (value, as, cast) => {
  //     if (Raw.isRaw (value)) return select (value.run, rec);

  //     if (SQLTag.isSQLTag<unknown, any> (value)) {
  //       if (inCall || as) {
  //         const [query, vals] = value.compile (params, values.length, parent);

  //         return evolve ({
  //           comps: concat (castAs (`(${query})`, as, cast)),
  //           values: concat (vals)
  //         }, rec);
  //       }

  //       return over ("sqlTag", concat (value), rec);
  //     }

  //     return evolve ({
  //       comps: concat (castAs (`$${values.length + 1}`, as, cast)),
  //       values: concat (value)
  //     }, rec);
  //   },

  // });
};

// };

export default interpret;