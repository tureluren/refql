import { flConcat, refqlType } from "../common/consts.ts";
import isEmptyTag from "../common/isEmptyTag.ts";
import joinMembers from "../common/joinMembers.ts";
import { Querier, RefInfo, RefQLRows, RequiredRefQLOptions, RQLOutput, RQLParams, Selectable, StringMap } from "../common/types.ts";
import Prop from "../Prop/index.ts";
import RefProp from "../Prop/RefProp.ts";
import SQLProp from "../Prop/SQLProp.ts";
import { isSQLTag, SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
import { Table } from "../Table/index.ts";
import Limit from "./Limit.ts";
import Offset from "./Offset.ts";
import OrderBy from "./OrderBy.ts";
import RefNode from "./RefNode.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

export interface Next {
  tag: RQLTag<any, any, any, RefQLRows>;
  link: [string, string[]];
  single: boolean;
}

interface InterpretedRQLTag<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  next: Next[];
}

export interface RQLTag<
  TableId extends string = any, Props = any, Components extends Selectable<TableId, Props>[] = Selectable<TableId, Props>[], Params = any, Output = any> extends RQLNode {
    (params: {} extends Params ? Params | void : Params): Promise<Output[]>;
    tableId: TableId;
    props: Props;
    params: Params;
    output: Output;
    table: Table<TableId>;
    nodes: RQLNode[];
    options: RequiredRefQLOptions;
    interpreted: InterpretedRQLTag<Params, Output>;
    concat<Components2 extends Selectable<TableId, Props>[]>(other: RQLTag<TableId, Props, Components2>): RQLTag<TableId, Props, [...Components, ...Components2], RQLParams<TableId, Props, [...Components, ...Components2]>, RQLOutput<TableId, Props, [...Components, ...Components2]>>;
    [flConcat]: this["concat"];
    interpret(where?: SQLTag): InterpretedRQLTag<Params, Output>;
    compile(params: Params): [string, any[], Next[]];
    run(params: Params, querier?: Querier): Promise<Output[]>;
}

const type = "refql/RQLTag";

let prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: createRQLTag,
  [refqlType]: type,
  concat,
  [flConcat]: concat,
  interpret,
  compile,
  run
});

export function createRQLTag(table: Table, nodes: RQLNode[], options: RequiredRefQLOptions) {
  const tag = ((params: any) => {
    return options.runner (tag, params);
  }) as RQLTag;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes,
      options
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
    .map ((prop: any) => {
      const ref = refs[prop.child.toString ()];
      return RefNode (createRQLTag (ref.table, ref.nodes, this.options), prop, this.table, this.options);
    });

  return createRQLTag (
    this.table,
    [...nodes, ...refNodes as RefNode[]],
    this.options
  );
}

function interpret(this: RQLTag, where = sqlX`where 1 = 1`): InterpretedRQLTag {
  const { nodes, table } = this,
    next = [] as Next[],
    members = [] as { as: string; node: Raw | SQLTag; isOmitted: boolean }[];

  let filters = sqlX``;
  let orderBies = sqlX``;
  let limit = sqlX``;
  let offset = sqlX``;
  let memberCount = 0;

  const caseOfRef = (tag: RQLTag, info: RefInfo, single: boolean) => {
    for (const lr of info.lRef) {
      members.push ({ as: lr.as, node: Raw (lr), isOmitted: false });
    }

    next.push ({ tag, link: [info.as, info.lRef.map (lr => lr.as)], single });
  };

  for (const node of nodes) {
    if (Prop.isProp (node) || SQLProp.isSQLProp (node)) {
      const col = node.interpret ();

      members.push ({ as: node.as, node: sqlX`${col} ${Raw (`"${node.as}"`)}`, isOmitted: node.isOmitted });

      if (node.operations.length === 0 && !node.isOmitted && !SQLProp.isSQLProp (node)) {
        memberCount += 1;
      }

      let propFilters = sqlX``;
      let filterIdx = 0;

      for (const op of node.operations) {
        if (OrderBy.isOrderBy (op)) {
          const delimiter = isEmptyTag (orderBies) ? "order by " : ", ";
          orderBies = orderBies.join (
            delimiter,
            op.interpret (col, true)
          );
        } else {
          propFilters = propFilters.join (
            filterIdx > 0 ? " " : "",
            op.interpret (col, filterIdx > 0)
          );
          filterIdx += 1;
        }
      }

      if (!isEmptyTag (propFilters)) {
        filters = filters.join (" ", sqlX`and (${propFilters})`);
      }

    } else if (Limit.isLimit (node)) {
      limit = node.interpret ();

    } else if (Offset.isOffset (node)) {
      offset = node.interpret ();

    } else if (RefNode.isRefNode (node)) {
      caseOfRef (node.joinLateral (), node.info, node.single);

    } else if (isSQLTag (node)) {
      filters = filters.join (" ", node);
    } else {
      throw new Error (`Unknown RQLNode Type: "${String (node)}"`);
    }
  }

  // Select all columns
  if (memberCount === 0) {
    const fieldProps = Object.entries (table.props)
      .map (([, prop]) => prop as Prop)
      .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col))
      .map (prop => ({
        as: prop.as,
        node: sqlX`${prop.interpret ()} ${Raw (`"${prop.as}"`)}`,
        isOmitted: false
      }));

    members.push (...fieldProps);
  }

  let tag = sqlX`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `
    .concat (where)
    .join ("", filters)
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

async function run(this: RQLTag, params: StringMap, querier?: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await (querier || this.options.querier) (query, values);

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
          rAs.reduce ((acc, as) =>
            acc && r[as] === row[as]
          , true)
        )
        .map ((r: any) => {
          let matched = { ...r };
          for (const as of rAs) {
            delete matched[as];
          }
          return matched;
        });

      if (single) {
        agg[lAs] = agg[lAs][0] || null;
      }

      for (const as of rAs) {
        delete agg[as];
      }

      return agg;
    }, row)
  );
}

export const isRQLTag = function (x: any): x is RQLTag {
  return x != null && x[refqlType] === type;
};