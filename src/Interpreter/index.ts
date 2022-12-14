import { ASTNode, Value } from "../nodes";
import Raw from "../Raw";
import SQLTag from "../SQLTag";
import {
  castAs, refToComp
} from "./sqlBuilders";
import sql from "../SQLTag/sql";
import Values from "../Values";
import RQLTag, { Next } from "../RQLTag";
import { refqlType } from "../common/consts";
import { BelongsToManyInfo, Ref, RefInfo, StringMap } from "../common/types";


// if (correctWhere) {
//   query = query.replace (/^\b(where)\b/i, "and");
// } else {
//   query = query.replace (/^\b(and|or)\b/i, "where");
// }

const rowValues = Values ((p: { refQL: { rows: any[]; lRef: Ref} }) =>
  [...new Set (p.refQL.rows.map (r => r[p.refQL.lRef.as]))]
);

const whereIn = sql<{refQL: RefInfo & { rows: any[] }}, unknown>`
  ${Raw ((p, t) => `where ${t!.name}.${p.refQL.rRef.name}`)}
  in ${rowValues}
`;

const joinWhereIn = sql<{refQL: BelongsToManyInfo & { rows: any[]}}, unknown>`
  ${Raw ((p, t) => `
    join ${p.refQL.xTable.name}
    on ${p.refQL.xTable.name}.${p.refQL.rxRef.name} = ${t!.name}.${p.refQL.rRef.name}
    where ${p.refQL.xTable.name}.${p.refQL.lxRef.name}
  `)}
  in ${rowValues}
`;

const createRefTag = (tag: RQLTag<unknown, unknown>) =>
  tag.table<{refQL: RefInfo & { rows: any[]}}, unknown>`
    ${Raw ((p, t) => `${t.name}.${p.refQL.rRef.name} ${p.refQL.rRef.as}`)}
    ${whereIn}
  `.concat (tag);


const interpret = <Params extends { refQL: StringMap }>(nodes: ASTNode<Params>[]) => {
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
        const refTag = tag.table<Params, unknown>`
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
    from ${Raw ((_p, t) => `${t}`)}
    ${sqlTag} 
  `;

  return { next, tag: finalTag };
};

export default interpret;