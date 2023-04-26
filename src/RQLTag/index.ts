import castAs from "../common/castAs";
import { flConcat, refqlType } from "../common/consts";
import joinMembers from "../common/joinMembers";
import { ConvertPromise, Querier, RefInfo, RefQLRows, Runnable } from "../common/types";
import unimplemented from "../common/unimplemented";
import { all, ASTNode, Raw, RefNode, When } from "../nodes";
import SQLTag from "../SQLTag";
import Table2 from "../Table2";
import { SQLTag2 } from "../SQLTag2";
import sql from "../SQLTag2/sql";

export interface Next<TableId, Params, Output> {
  tag: RQLTag<TableId, Params & RefQLRows, Output>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<TableId, Params, Output> {
  tag: SQLTag2<Params, Output>;
  next: Next<TableId, Params, Output>[];
}

interface Extra<Params, Output> {
  extra: SQLTag2<Params, Output>;
}

// As or Name ?
interface RQLTag<TableId, Params, Output> {
  (params: Params, querier?: Querier): Promise<Output>;
  tableId: TableId;
  type: Output;
  table: Table2<any, any>;
  nodes: ASTNode<Params, Output, any>[];
  defaultQuerier?: Querier;
  convertPromise: (p: Promise<Output>) => any;
  interpreted: InterpretedRQLTag<TableId, Params, Output>;
  concat<Params2, Output2>(other: RQLTag<TableId, Params2, Output2>): RQLTag<TableId, Params & Params2, Output & Output2>;
  [flConcat]: RQLTag<TableId, Params, Output>["concat"];
  interpret(): InterpretedRQLTag<TableId, Params, Output> & Extra<Params, Output>;
  compile(params: Params): [string, any[], Next<TableId, Params, Output>[]];
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
  aggregate,
  convertPromise: <T>(p: Promise<T>) => p
};

function RQLTag<TableId extends string, Params, Output>(table: Table2<TableId, any>, nodes: ASTNode<Params, Output, any>[], defaultQuerier?: Querier) {

  const tag = ((params: Params = {} as Params, querier?: Querier) => {
    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return tag.convertPromise (tag.aggregate (params, (querier || defaultQuerier) as Querier) as Promise<Output>);
  }) as RQLTag<TableId, Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes,
      defaultQuerier
    })
  );

  return tag;
}

type Deep<Params, Output> = { [tableId: string]: RefNode<Params, Output, any>} & { nodes: ASTNode<Params, Output, any>[]};

const concatDeep = <Params, Output>(nodes: ASTNode<Params, Output, any>[]): Deep<Params, Output> => {
  return nodes.reduce ((acc, node) => {
    if (RefNode.isRefNode<Params, Output, any> (node)) {
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
  }, { nodes: [] as ASTNode<Params, Output, any>[] } as Deep<Params, Output>);
};

function concat<As, Params, Output>(this: RQLTag<As, Params, Output>, other: RQLTag<As, Params, Output>) {
  // if (!this.table.equals (other.table)) {
  //   throw new Error ("U can't concat RQLTags that come from different tables");
  // }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  return RQLTag (
    this.table,
    [...nodes, ...Object.values (refs)],
    this.defaultQuerier
  );
}

const unsupported = unimplemented ("RQLTag");

function interpret<As, Params, Output>(this: RQLTag<As, Params, Output>): InterpretedRQLTag<As, Params, Output> & Extra<Params, Output> {
  const { nodes, table } = this,
    next = [] as Next<As, Params, Output>[],
    members = [] as (Raw<Params, Output, any> | SQLTag2<Params, Output>)[];

  let extra = sql<Params, Output>``;

  const caseOfRef = (tag: RQLTag<As, Params & RefQLRows, Output>, info: RefInfo<any>, single: boolean) => {
    members.push (Raw (info.lRef));

    next.push ({ tag, link: [info.as, info.lRef.as], single });
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      // RefNode: caseOfRef,
      // BelongsToMany: caseOfRef,
      // Call: (tag, name, as, cast) => {
      //   members.push (sql`
      //     ${Raw (name)} (${tag})${Raw (castAs (cast, as))}
      //   `);
      // },
      // All: sign => {
      //   members.push (
      //     Raw (`${table.name}.${sign}`)
      //   );
      // },
      // Identifier: (name, as, cast) => {
      //   members.push (
      //     Raw (`${table.name}.${name}${castAs (cast, as)}`)
      //   );
      // },
      // Variable: (x, as, cast) => {
      //   if (SQLTag.isSQLTag<Params, Output, Box> (x)) {
      //     if (as) {
      //       members.push (sql<Params, Output, Box>`
      //         (${x})${Raw (castAs (cast, as))}
      //       `);
      //     } else {
      //       extra = extra.concat (x);
      //     }

      //   } else {
      //     throw new Error (`U can't insert "${x}" in this section of the RQLTag`);
      //   }
      // },
      // Literal: (x, as, cast) => {
      //   members.push (Raw (`${x}${castAs (cast, as)}`));
      // },
      // StringLiteral: (x, as, cast) => {
      //   members.push (Raw (`'${x}'${castAs (cast, as)}`));
      // },
      When: (pred, tag) => {
        extra = extra.concat (sql<Params, Output>`${When (pred, tag)}`);
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

  let tag = sql<Params, Output>`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `;
  return { next, tag, extra };
}

function compile<As, Params, Output>(this: RQLTag<As, Params, Output>, params: Params) {
  if (!this.interpreted) {
    const { tag, extra, next } = this.interpret ();

    this.interpreted = {
      tag: tag.concat (sql`where 1 = 1`).concat (extra),
      next
    };
  }

  return [
    ...this.interpreted.tag.compile (params, this.table as any),
    this.interpreted.next
  ];
}

async function aggregate<As, Params, Output>(this: RQLTag<As, Params, Output>, params: Params, querier: Querier): Promise<any[]> {
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

RQLTag.isRQLTag = function <As, Params, Output> (x: any): x is RQLTag<As, Params, Output> {
  return x != null && x[refqlType] === type;
};

export default RQLTag;