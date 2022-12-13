import { evolve, get, over, set } from "../Env/access";
import Env from "../Env";
import createEnv from "../Env/createEnv";
import Rec from "../Env/Rec";
import chain from "../common/chain";
import concat from "../common/concat";
import { all, All, ASTNode, Call, Identifier, isLiteral, Value, Variable } from "../nodes";
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
    ${whereIn}
  `.concat (tag);


const interpret = <Params>(nodes: ASTNode<Params>[]) => {
  const next = [] as Next[];
  const members = [] as any[];
  let sqlTag = SQLTag.empty ();

  const caseOfRef = (single: boolean) => (tag, params) => {
    members.push (Raw ((p, t) => refToComp (t, params.lRef)));
    next.push ({ tag: createRefTag (tag), params, single });
  };

  const caseOfLiteral = (value, as, cast) => {
    members.push (Raw (castAs (value, as, cast)));
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      BelongsTo: caseOfRef (true),
      HasOne: caseOfRef (true),
      HasMany: caseOfRef (false),
      BelongsToMany: (tag, params) => {
        const refTag = tag.table<{rows: any[]}, any>`
          ${Raw (p => `${p.refQL.xTable.name}.${p.refQL.lxRef.name} ${p.refQL.lxRef.as}`)}
          ${joinWhereIn}
        `.concat (tag);

        members.push (Raw ((_p, t) => refToComp (t, params.lRef)));
        next.push ({ tag: refTag, params, single: false });
      },

      Call: (tag, name, as, cast) => {
        members.push (sql`
          ${Raw (name)} (${tag}) ${Raw (`${as}${cast ? `::${cast}` : ""}`)} 
        `);
      },

      Values: () => {
        throw new Error ("jdjdjd");
      },

      All: sign => {
        members.push (Raw ((p, t) => `${t.name}.${sign}`));
      },

      Identifier: (name, as, cast) => {
        members.push (Raw ((_p, t) => castAs (`${t.name}.${name}`, as, cast)));
      },

      Raw: run => {
        members.push (Raw (run));
      },

      Variable: (value, as, cast) => {
        if (SQLTag.isSQLTag<unknown, any> (value)) {
          if (as) {
            select.concat (sql`
              (${value}) ${Raw (`${as}${cast ? `::${cast}` : ""}`)} 
            `);
          } else {
            sqlTag = sqlTag.concat (value);
          }

        } else {
          members.push (sql`
            ${Value (value)} ${Raw (`${as}${cast ? `::${cast}` : ""}`)}
          `);
        }
      },

      NumericLiteral: caseOfLiteral,
      BooleanLiteral: caseOfLiteral,
      NullLiteral: caseOfLiteral,
      StringLiteral: (value, as, cast) => {
        members.push (Raw (castAs (`'${value}'`, as, cast)));
      }
    });


  }

  const select = members.reduce ((tag, member, idx) => {
    return tag.concat (sql`
      ${Raw (idx ? ", " : "")}${member} 
    `);
  }, SQLTag.empty ());

  const finalTag = sql`
    select ${select}
    from ${Raw ((p, t) => `${t}`)}
    ${sqlTag} 
  `;

  return {
    next, tag: finalTag
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