import castAs from "../common/castAs";
import { flConcat, refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import joinMembers from "../common/joinMembers";
import { ConvertPromise, Querier, RefInfo, RefQLRows, Runnable } from "../common/types";
import unimplemented from "../common/unimplemented";
import { all, ASTNode, Raw, RefNode, When } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";

export interface Next<Params, Output, Box extends Boxes> {
  tag: RQLTag<Params & RefQLRows, Output, Box>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<Params, Output, Box extends Boxes> {
  tag: SQLTag<Params, Output, Box>;
  next: Next<Params, Output, Box>[];
}

interface Extra<Params, Output, Box extends Boxes> {
  extra: SQLTag<Params, Output, Box>;
}

interface RQLTag<Params, Output, Box extends Boxes> {
  table: Table<Box>;
  nodes: ASTNode<Params, Output, Box>[];
  defaultQuerier?: Querier;
  convertPromise?: ConvertPromise<Box, Output>;
  interpreted: InterpretedRQLTag<Params, Output, Box>;
  concat<Params2, Output2, Box2 extends Boxes>(other: RQLTag<Params2, Output2, Box2>): RQLTag<Params & Params2, Output & Output2, Box> & Runnable<Params & Params2, ReturnType<ConvertPromise<Box, Output & Output2>>>;
  [flConcat]: RQLTag<Params, Output, Box>["concat"];
  interpret(): InterpretedRQLTag<Params, Output, Box> & Extra<Params, Output, Box>;
  compile(params: Params): [string, any[], Next<Params, Output, Box>[]];
  aggregate(params: Params, querier: Querier): Promise<Output>;
}

const type = "refql/RQLTag";

const prototype = {
  constructor: RQLTag,
  [refqlType]: type,
  concat,
  [flConcat]: concat,
  interpret,
  compile,
  aggregate
};

function RQLTag<Params, Output, Box extends Boxes>(table: Table<Box>, nodes: ASTNode<Params, Output, Box>[], defaultQuerier?: Querier, convertPromise?: ConvertPromise<Box, Output>) {
  const convert = convertPromise || (x => x);

  const tag = ((params: Params = {} as Params, querier?: Querier) => {
    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return convert (tag.aggregate (params, (querier || defaultQuerier) as Querier) as Promise<Output>);
  }) as RQLTag<Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes,
      defaultQuerier,
      convertPromise
    })
  );

  return tag;
}

type Deep<Params, Output, Box extends Boxes> = { [tableId: string]: RefNode<Params, Output, Box>} & { nodes: ASTNode<Params, Output, Box>[]};

const concatDeep = <Params, Output, Box extends Boxes>(nodes: ASTNode<Params, Output, Box>[]): Deep<Params, Output, Box> => {
  return nodes.reduce ((acc, node) => {
    if (RefNode.isRefNode<Params, Output, Box> (node)) {
      const { table } = node.tag;
      const id = table.toString ();

      if (acc[id]) {
        acc[id].tag = acc[id].tag.concat (node.tag);
      } else {
        acc[id] = node;
      }
    } else {
      acc.nodes.push (node);
    }
    return acc;
  }, { nodes: [] as ASTNode<Params, Output, Box>[] } as Deep<Params, Output, Box>);
};

function concat<Params, Output, Box extends Boxes>(this: RQLTag<Params, Output, Box>, other: RQLTag<Params, Output, Box>) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags that come from different tables");
  }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  return RQLTag (
    this.table,
    [...nodes, ...Object.values (refs)],
    this.defaultQuerier,
    this.convertPromise
  );
}

const unsupported = unimplemented ("RQLTag");

function interpret<Params, Output, Box extends Boxes>(this: RQLTag<Params, Output, Box>): InterpretedRQLTag<Params, Output, Box> & Extra<Params, Output, Box> {
  const { nodes, table } = this,
    next = [] as Next<Params, Output, Box>[],
    members = [] as (Raw<Params, Output, Box> | SQLTag<Params, Output, Box>)[];

  let extra = sql<Params, Output, Box>``;

  const caseOfRef = (tag: RQLTag<Params & RefQLRows, Output, Box>, info: RefInfo<Box>, single: boolean) => {
    members.push (Raw (info.lRef));

    next.push ({ tag, link: [info.as, info.lRef.as], single });
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      RefNode: caseOfRef,
      BelongsToMany: caseOfRef,
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
      Variable: (x, as, cast) => {
        if (SQLTag.isSQLTag<Params, Output, Box> (x)) {
          if (as) {
            members.push (sql<Params, Output, Box>`
              (${x})${Raw (castAs (cast, as))} 
            `);
          } else {
            extra = extra.concat (x);
          }

        } else {
          throw new Error (`U can't insert "${x}" in this section of the RQLTag`);
        }
      },
      Literal: (x, as, cast) => {
        members.push (Raw (`${x}${castAs (cast, as)}`));
      },
      StringLiteral: (x, as, cast) => {
        members.push (Raw (`'${x}'${castAs (cast, as)}`));
      },
      When: (pred, tag) => {
        extra = extra.concat (sql<Params, Output, Box>`${When (pred, tag)}`);
      },
      Raw: unsupported ("Raw"),
      Value: unsupported ("Value"),
      Values: unsupported ("Values"),
      Values2D: unsupported ("Values2D")
    });
  }

  const refMemberLength = nodes.reduce ((n, node) =>
    RefNode.isRefNode (node) ? n + 1 : n
  , 0);

  if (refMemberLength === members.length) {
    members.push (Raw (`${table.name}.${all.sign}`));
  }

  let tag = sql<Params, Output, Box>`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `;

  return { next, tag, extra };
}

function compile<Params, Output, Box extends Boxes>(this: RQLTag<Params, Output, Box>, params: Params) {
  if (!this.interpreted) {
    const { tag, extra, next } = this.interpret ();

    this.interpreted = {
      tag: tag.concat (sql`where 1 = 1`).concat (extra),
      next
    };
  }

  return [
    ...this.interpreted.tag.compile (params, this.table),
    this.interpreted.next
  ];
}

async function aggregate<Params, Output, Box extends Boxes>(this: RQLTag<Params, Output, Box>, params: Params, querier: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await querier<any> (query, values);

  if (!refQLRows.length) return [];

  const nextData = await Promise.all (next.map (
    // { ...null } = {}
    n => n.tag.aggregate ({ ...params, refQLRows }, querier)
  )) as any[][];

  return refQLRows.map (row =>
    nextData.reduce ((agg, nextRows, idx) => {
      const { single, link: [lAs, rAs] } = next[idx];

      agg[lAs] = nextRows
        .filter ((r: any) =>
          r[rAs] === row[rAs]
        )
        .map ((r: any) => {
          let matched = { ...r };
          delete matched[rAs];
          return matched;
        });

      if (single) {
        agg[lAs] = agg[lAs][0] || null;
      }

      delete agg[rAs];

      return agg;
    }, row)
  );
}

RQLTag.isRQLTag = function <Params, Output, Box extends Boxes> (x: any): x is RQLTag<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default RQLTag;