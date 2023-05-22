import { flConcat, refqlType } from "../common/consts";
import { getConvertPromise } from "../common/convertPromise";
import getDefaultQuerier from "../common/defaultQuerier";
import isEmptyTag from "../common/isEmptyTag";
import joinMembers from "../common/joinMembers";
import { Querier, RefInfo, RefQLRows, StringMap } from "../common/types";
import When from "../common/When";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
import { isSQLTag, SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Values from "../SQLTag/Values";
import Table from "../Table";
import Eq from "./Eq";
import In from "./In";
import Limit from "./Limit";
import Offset from "./Offset";
import OrderBy from "./OrderBy";
import RefNode from "./RefNode";
import RQLNode from "./RQLNode";

export interface Next {
  tag: RQLTag<any, RefQLRows>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  next: Next[];
}

interface Extra<Params = any, Output = any> {
  extra: SQLTag<Params, Output>;
}

export interface RQLTag<TableId extends string = any, Params = any, Output = any> {
  (params?: Params, querier?: Querier): Promise<Output>;
  tableId: TableId;
  params: Params;
  type: Output;
  table: Table<TableId>;
  nodes: RQLNode[];
  interpreted: InterpretedRQLTag<Params, Output>;
  concat<Params2, Output2>(other: RQLTag<TableId, Params2, Output2>): RQLTag<TableId, Params & Params2, Output & Output2>;
  [flConcat]: RQLTag<TableId, Params, Output>["concat"];
  interpret(): InterpretedRQLTag<Params, Output> & Extra<Params, Output>;
  compile(params: Params): [string, any[], Next[]];
  aggregate(params: Params, querier: Querier): Promise<Output>;
}

const type = "refql/RQLTag";

let prototype = {
  constructor: createRQLTag,
  [refqlType]: type,
  concat,
  [flConcat]: concat,
  interpret,
  compile,
  aggregate
};

export function createRQLTag<TableId extends string, Params = any, Output = any>(table: Table<TableId>, nodes: RQLNode[]) {
  const tag = ((params = {} as Params, querier?: Querier) => {
    const defaultQuerier = getDefaultQuerier ();
    const convertPromise = getConvertPromise ();

    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return convertPromise (tag.aggregate (params, (querier || defaultQuerier) as Querier) as Promise<Output>);
  }) as RQLTag<TableId, Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes
    })
  );

  return tag;
}

type Deep = { [tableId: string]: RefNode } & { nodes: RQLNode[]};

const concatDeep = (nodes: RQLNode[]): Deep => {
  return nodes.reduce ((acc, node) => {
    if (RefNode.isRefNode (node)) {
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
  }, { nodes: [] as RQLNode[] } as Deep);
};

function concat(this: RQLTag, other: RQLTag) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags that come from different tables");
  }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  return createRQLTag (
    this.table,
    [...nodes, ...Object.values (refs)]
  );
}

function interpret(this: RQLTag): InterpretedRQLTag & Extra {
  const { nodes, table } = this,
    next = [] as Next[],
    members = [] as (Raw | SQLTag)[];

  let extra = sql``;
  let orderBy = sql``;
  let limit = sql``;
  let offset = sql``;

  const caseOfRef = (tag: RQLTag, info: RefInfo, single: boolean) => {
    members.push (Raw (info.lRef));

    next.push ({ tag, link: [info.as, info.lRef.as], single });
  };

  for (const node of nodes) {
    if (Prop.isProp (node)) {
        members.push (
          Raw (`${table.name}.${node.col || node.as} "${node.as}"`)
        );
    } else if (SQLProp.isSQLProp (node)) {
      members.push (sql`
        (${node.col}) ${Raw (`"${node.as}"`)}`
      );
    } else if (isSQLTag (node)) {
      extra = extra.concat (node);
    } else if (RefNode.isRefNode (node)) {
      caseOfRef (node.joinLateral (), node.info, node.single);
    } else if (When.isWhen (node)) {
      extra = extra.concat (sql`${node}`);
    } else if (Eq.isEq (node)) {
      if (isSQLTag (node.prop)) {
        extra = extra.concat (sql`
          and (${node.prop}) = ${node.run}
        `);
      } else {
        extra = extra.concat (sql`
          and ${Raw (`${table.name}.${node.prop}`)} = ${node.run}
        `);
      }
    } else if (In.isIn (node)) {
      if (isSQLTag (node.prop)) {
        extra = extra.concat (sql`
          and (${node.prop}) in ${Values (node.run)}
        `);
      } else {
        extra = extra.concat (sql`
          and ${Raw (`${table.name}.${node.prop}`)} in ${Values (node.run)}
        `);
      }
    } else if (OrderBy.isOrderBy (node)) {
      if (isSQLTag (node.prop)) {
        orderBy = orderBy.join (", ", sql`
          (${node.prop}) ${Raw (node.descending ? "desc" : "asc")}
        `);
      } else {
        orderBy = orderBy.join (", ", sql`
          ${Raw (`${table.name}.${node.prop} ${node.descending ? "desc" : "asc"}`)}
        `);
      }
    } else if (Limit.isLimit (node)) {
      limit = sql<typeof node["params"]>`limit ${p => p[node.prop]}`;
    } else if (Offset.isOffset (node)) {
      offset = sql<typeof node["params"]>`offset ${p => p[node.prop]}`;
    } else {
      throw new Error (`Unknown RQLNode Type: "${String (node)}"`);
    }
  }

  let tag = sql`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `;

  if (!isEmptyTag (orderBy)) {
    extra = extra.concat (sql`
      order by ${orderBy} 
    `);
  }

  if (!isEmptyTag (limit)) {
    extra = extra.concat (limit);
  }

  if (!isEmptyTag (offset)) {
    extra = extra.concat (offset);
  }

  return {
    next,
    tag,
    extra
  };
}

function compile(this: RQLTag, params: StringMap) {
  if (!this.interpreted) {
    const { tag, extra, next } = this.interpret ();

    this.interpreted = {
      tag: tag.concat (sql`where 1 = 1`).concat (extra),
      next
    };
  }

  return [
    ...this.interpreted.tag.compile (params),
    this.interpreted.next
  ];
}

async function aggregate(this: RQLTag, params: StringMap, querier: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await querier (query, values);

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

export const isRQLTag = function <As extends string = any, Params = any, Output = any> (x: any): x is RQLTag<As, Params, Output> {
  return x != null && x[refqlType] === type;
};