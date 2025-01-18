import { flConcat, refqlType } from "../common/consts";
import { getConvertPromise } from "../common/convertPromise";
import getDefaultQuerier from "../common/defaultQuerier";
import joinMembers from "../common/joinMembers";
import { Querier, RefInfo, RefQLRows, StringMap } from "../common/types";
import Prop from "../Prop";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import SelectableType, { isSelectableType } from "../Table/SelectableType";
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
  selectables: SelectableType[];
  props: Prop[];
  ending?: string;
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
  interpret(): InterpretedRQLTag<Params, Output>;
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

export function createRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[]) {
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

function interpret(this: RQLTag): InterpretedRQLTag {
  const { nodes, table } = this,
    next = [] as Next[],
    members = [] as (Raw | SQLTag)[],
    selectables = [] as SelectableType[],
    props = [] as Prop[];

  const caseOfRef = (tag: RQLTag, info: RefInfo, single: boolean) => {
    members.push (Raw (info.lRef));

    next.push ({ tag, link: [info.as, info.lRef.as], single });
  };

  for (const node of nodes) {
    if (Prop.isProp (node)) {
      members.push (
        Raw (`${table.name}.${node.col || node.as} "${node.as}"`)
      );

      props.push (node);
    // } else if (SQLProp.isSQLProp (node)) {
    //   members.push (sql`
    //     (${node.col}) ${Raw (`"${node.as}"`)}`
    //   );
    } else if (RefNode.isRefNode (node)) {
      caseOfRef (node.joinLateral (), node.info, node.single);
    } else if (isSelectableType (node)) {
      selectables.push (node);
    } else {
      throw new Error (`Unknown RQLNode Type: "${String (node)}"`);
    }
  }

  let tag = sql`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `;

  return {
    next,
    tag,
    props,
    selectables: sortSelectables (selectables)
  };
}

const sortSelectables = (selectables: SelectableType[]) =>
  selectables.sort ((a, b) => a.precedence - b.precedence);

function compile(this: RQLTag, params: StringMap) {
  if (!this.interpreted) {
    let { next, tag, selectables, props } = this.interpret ();

    this.interpreted = {
      tag: tag.concat (sql`where 1 = 1`),
      next,
      selectables,
      props
    };
  }

  return [
    ...this.interpreted.tag.compile (params, this.interpreted.props, this.interpreted.selectables, this.table, this.interpreted.ending),
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