import { flConcat, refqlType } from "../common/consts";
import isEmptyTag from "../common/isEmptyTag";
import joinMembers from "../common/joinMembers";
import { Querier, RefInfo, RefQLRows, StringMap } from "../common/types";
import Prop from "../Prop";
import RefProp from "../Prop/RefProp";
import { isSQLTag, SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Limit from "./Limit";
import Offset from "./Offset";
import OrderBy from "./OrderBy";
import RefNode from "./RefNode";
import RQLNode from "./RQLNode";
import runnableTag from "./runnableTag";

export interface Next {
  tag: RQLTag<any, RefQLRows>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  next: Next[];
}

export interface RQLTag<TableId extends string = any, Params = any, Output = any> {
  (params?: Params, querier?: Querier): Promise<Output[]>;
  tableId: TableId;
  params: Params;
  type: Output;
  table: Table<TableId>;
  nodes: RQLNode[];
  interpreted: InterpretedRQLTag<Params, Output>;
  concat<Params2, Output2>(other: RQLTag<TableId, Params2, Output2>): RQLTag<TableId, Params & Params2, Output & Output2>;
  [flConcat]: RQLTag<TableId, Params, Output>["concat"];
  interpret(where?: SQLTag<Params>): InterpretedRQLTag<Params, Output>;
  compile(params: Params): [string, any[], Next[]];
  run(params: Params, querier: Querier): Promise<Output[]>;
}

const type = "refql/RQLTag";

let prototype = {
  constructor: createRQLTag,
  [refqlType]: type,
  concat,
  [flConcat]: concat,
  interpret,
  compile,
  run
};

export function createRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[]) {
  const tag = runnableTag<RQLTag<TableId, Params, Output>> ();

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes
    })
  );

  return tag;
}

type Deep = { [tableId: string]: RQLTag } & { nodes: RQLNode[]};

const concatDeep = (nodes: RQLNode[]): Deep => {
  return nodes.reduce ((acc, node) => {
    if (RefNode.isRefNode (node)) {
      const { table } = node.tag;
      const id = table.toString ();

      if (acc[id]) {
        acc[id] = acc[id].concat (node.tag);
      } else {
        acc[id] = node.tag;
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

  const refNodes = Object.values (this.table.props)
    .filter (prop => RefProp.isRefProp (prop) && refs[prop.child.toString ()])
    .map ((prop: any) =>
      RefNode (createRQLTag (prop.child, refs[prop.child.toString ()].nodes), prop, this.table));

  return createRQLTag (
    this.table,
    [...nodes, ...refNodes as RefNode[]]
  );
}

function interpret(this: RQLTag, where = sql`where 1 = 1`): InterpretedRQLTag {
  const { nodes, table } = this,
    next = [] as Next[],
    members = [] as (Raw | SQLTag)[];

  let filters = sql``;
  let orderBies = sql``;
  let limit = sql``;
  let offset = sql``;

  const caseOfRef = (tag: RQLTag, info: RefInfo, single: boolean) => {
    members.push (Raw (info.lRef));

    next.push ({ tag, link: [info.as, info.lRef.as], single });
  };

  for (const node of nodes) {
    if (Prop.isProp (node)) {
      const col = isSQLTag (node.col)
        ? sql`(${node.col})`
        : Raw (`${table.name}.${node.col || node.as}`);

      if (!node.isOmitted) {
        members.push (sql`${col} ${Raw (`"${node.as}"`)}`);
      }

      for (const op of node.operations) {
        if (OrderBy.isOrderBy (op)) {
          const delimiter = isEmptyTag (orderBies) ? "order by " : ", ";
          orderBies = orderBies.join (
            delimiter,
            op.interpret (col)
          );
        } else {
          filters = filters.concat (
            op.interpret (col)
          );
        }
      }
    } else if (Limit.isLimit (node)) {
      limit = node.interpret ();

    } else if (Offset.isOffset (node)) {
      offset = node.interpret ();

    } else if (RefNode.isRefNode (node)) {
      caseOfRef (node.joinLateral (), node.info, node.single);

    } else if (isSQLTag (node)) {
      filters = filters.concat (node);
    } else {
      throw new Error (`Unknown RQLNode Type: "${String (node)}"`);
    }
  }

  let tag = sql`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `
    .concat (where)
    .concat (filters)
    .concat (orderBies)
    .concat (limit)
    .concat (offset);

  return {
    next,
    tag
  };
}

function compile(this: RQLTag, params: StringMap) {
  if (!this.interpreted) {
    let { next, tag } = this.interpret ();

    this.interpreted = {
      tag,
      next
    };
  }

  return [
    ...this.interpreted.tag.compile (params),
    this.interpreted.next
  ];
}

async function run(this: RQLTag, params: StringMap, querier: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await querier (query, values);

  if (!refQLRows.length) return [];

  const nextData = await Promise.all (next.map (
    // { ...null } = {}
    n => n.tag.run ({ ...params, refQLRows }, querier)
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