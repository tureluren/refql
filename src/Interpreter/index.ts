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
  select, selectRefs
} from "./sqlBuilders";
import sql from "../SQLTag/sql";
import Values from "../Values";
import RQLTag from "../RQLTag";
import { Ref, Refs, TagFunctionVariable } from "../common/types";

export type InterpretF<Params> = (exp: ASTNode<Params>, env: Env, rows?: any[]) => Rec;

export interface Next {
  tag: RQLTag<unknown, unknown>;
  lRef: string;
  rRef: string;
  as: string;
  single: boolean;
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


const interpretMembers = <Params>(members: ASTNode<Params>[], table: Table, inCall = false) => {
  const nodes = members.filter (m =>
      Identifier.isIdentifier (m) || isLiteral (m) || All.isAll (m) || Call.isCall (m)
    ).length ? members : members.concat (all);

  return nodes.reduce ((acc, mem) =>
      acc.extend (env => interpret (mem, env)), createEnv (table, undefined, inCall));
};

const rowValues = Values (p =>
  [...new Set (p.refQL.rows.map (r => r[p.refQL.lRef.as]))]
);

const whereIn = sql<{refQLRows: any[]}, any>`
  ${Raw ((p, t) => `where ${t.name}.${p.refQL.rRef.name}`)}
  in ${rowValues}
`;

const joinWhereIn = sql<{refQLRows: any[]}, any>`
  ${Raw ((p, t) => `
    join ${p.refQL.xTable.name}
    on ${p.refQL.xTable.name}.${p.refQL.rxRef.name} = ${t.name}.${p.refQL.rRef.name}
    where ${p.refQL.xTable.name}.${p.refQL.lxRef.name}
  `)}
  in ${rowValues}
`;

const createRefTag = tag =>
  tag.table<{rows: any[]}, any>`
    ${Raw ((p, t) => `${t.name}.${p.refQL.rRef.name} ${p.refQL.rRef.as}`)}
    ${Variable (whereIn)}
  `.concat (tag);


const interpret = <Params>(nodes: ASTNode<Params>[]) => {
  // const { rec } = env;
  // const { values, table: parent, refs, inCall } = rec;
  const comps = [] as (() => string)[];
  const next = [] as Next[];
  let strings = [] as TagFunctionVariable<Params>[];
  let values = [] as TagFunctionVariable<Params>[];
  let sqlTag = SQLTag.empty ();

  const caseOfRef = (single: boolean) => (tag, params) => {
    const refTag = createRefTag (tag);

    comps.push ((p, t) => refToComp (t, params.lRef));
    next.push ({ tag: refTag, params, single });
  };

  const caseOfLiteral = (value, as, cast) => {
    comps.push (() => castAs (value, as, cast));
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      BelongsTo: caseOfRef (true),
      HasOne: caseOfRef (true),
      HasMany: caseOfRef (false),

      BelongsToMany: (tag, params) => {
        const refTag = tag.table<{rows: any[]}, any>`
          ${Raw (p => `${p.refQL.xTable.name}.${p.refQL.lxRef.name} ${p.refQL.lxRef.as}`)}
          ${Variable (joinWhereIn)}
        `.concat (tag);

        comps.push ((_p, t) => refToComp (t, params.lRef));
        next.push ({ tag: refTag, params, single: false });
      },


      Call: compileCall => {
        // const call = interpret (table, nodes, true);
        comps.push ((p, t) => compileCall (p, t));

        // comps.push (p => castAs (`${name} (${call.comps.map (c => c (p)).join (", ")})`, as, cast));
        // values: concat (callRecord.values)
      },

      Values: () => {
        throw new Error ("jdjdjd");
      },

      All: sign => {
        comps.push ((p, t) => `${t.name}.${sign}`);
      },

      Identifier: (name, as, cast) => {
        comps.push ((_p, t) => castAs (`${t.name}.${name}`, as, cast));
      },

      Raw: run => {
        comps.push (run);
      },

      Variable: (value, as, cast) => {
        if (SQLTag.isSQLTag<unknown, any> (value)) {
          if (as) {

            comps.push ((p, t) => {
              const [query, vals] = value.compile (p, values.length, t);
              return castAs (`(${query})`, as, cast);
            });
            // values: concat (vals)
          } else {

            sqlTag = sqlTag.concat (value);
          }

        }

        // return evolve ({
        //   comps: concat (castAs (`$${values.length + 1}`, as, cast)),
        //   values: concat (value)
        // }, rec);
      },

      StringLiteral: (value, as, cast) => {
        comps.push (() => castAs (`'${value}'`, as, cast));
      },

      NumericLiteral: caseOfLiteral,
      BooleanLiteral: caseOfLiteral,
      NullLiteral: caseOfLiteral
    });


  }

  // distinct ?
  strings = [(p, t) => `select ${comps.map (f => f (p, t)).join (", ")} from ${t}`, (p, t) => {
    const [query] = sqlTag.compile (p, 0, t);
    return query;
  }];
  // .map (includeSQL (table, false))

  values = [(p, t) => {
    const [_q, values] = sqlTag.compile (p, 0, t);
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