import { all, ASTNode, Raw, Ref, Value } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import RQLTag, { Next } from "../RQLTag";
import { RefInfo } from "../common/types";
import Table from "../Table";
import joinMembers from "../common/joinMembers";
import { isRefNode } from "../nodes/RefNode";
import unimplemented from "../common/unimplemented";
import castAs from "../common/castAs";


// if (correctWhere) {
//   query = query.replace (/^\b(where)\b/i, "and");
// } else {
//   query = query.replace (/^\b(and|or)\b/i, "where");
// }
const unsupported = unimplemented ("RQLTag");

const interpret = <Params>(nodes: ASTNode<Params>[], table: Table) => {
  const next = [] as Next<Params>[];
  const members = [] as (Raw<Params> | SQLTag<Params>)[];
  let sqlTag = SQLTag.empty<Params> ();

  const caseOfRef = (single: boolean) => (tag: RQLTag<Params>, info: RefInfo) => {
    members.push (Raw (`${info.lRef}`));
    next.push ({ tag, info, single });
  };

  const caseOfLiteral = (value: number | boolean | null, as?: string, cast?: string) => {
    members.push (Raw (`${value}${castAs (cast, as)}`));
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      BelongsTo: caseOfRef (true),
      HasOne: caseOfRef (true),
      HasMany: caseOfRef (false),
      BelongsToMany: caseOfRef (false),
      Call: (tag, name, as, cast) => {
        members.push (sql`
          ${Raw (name)} (${tag})${Raw (castAs (cast, as))}
        `);
      },
      All: sign => {
        members.push (
          Raw (`${table.name}.${sign}`)
        );
      },
      Identifier: (name, as, cast) => {
        members.push (
          Raw (`${table.name}.${name}${castAs (cast, as)}`)
        );
      },
      Raw: run => {
        members.push (Raw (run));
      },
      Ref: (name, as) => {
        members.push (Raw (`${name} ${as}`));
      },
      Variable: (value, as, cast) => {
        if (SQLTag.isSQLTag (value)) {
          if (as) {
            members.push (sql`
              (${value})${Raw (castAs (cast, as))} 
            `);
          } else {
            sqlTag = sqlTag.concat (value);
          }

        } else {
          members.push (sql`
            ${Value (value)}${Raw (castAs (cast, as))}
          `);
        }
      },
      NumericLiteral: caseOfLiteral,
      BooleanLiteral: caseOfLiteral,
      NullLiteral: caseOfLiteral,
      StringLiteral: (value, as, cast) => {
        members.push (Raw (`'${value}'${castAs (cast, as)}`));
      },
      Value: unsupported ("Value"),
      Values: unsupported ("Values"),
      Values2D: unsupported ("Values2D")
    });
  }

  const refMemberLength = nodes.reduce ((n, node) =>
    isRefNode (node) || Ref.isRef (node) ? n + 1 : n
  , 0);

  if (refMemberLength === members.length) {
    members.push (Raw (`${table.name}.${all.sign}`));
  }

  const tag = sql<Params>`
    select ${joinMembers (members)}
    from ${Raw (`${table}`)}
    ${sqlTag} 
  `;

  return { next, tag };
};

export default interpret;