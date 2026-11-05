import { flConcat, refqlType } from "../common/consts.ts";
import copyObj from "../common/copyObj.ts";
import isEmptyTag from "../common/isEmptyTag.ts";
import joinMembers from "../common/joinMembers.ts";
import { ConcatRQLOutput, Querier, RefInfo, RefQLRows, RequiredRefQLOptions, RQLParams, Selectable, StringMap } from "../common/types.ts";
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
  TableId extends string = any,
  Props = any,
  Components extends Selectable<TableId, Props>[] = Selectable<TableId, Props>[],
  Params = any,
  Output = any,
  ExplicitKeys extends PropertyKey = never,
  One extends boolean = false,
  Required extends boolean = false,
  Exists extends boolean = false
> extends RQLNode {
    (params: {} extends Params ? Params | void : Params): Promise<Exists extends true ? boolean : One extends true ? Required extends true ? Output : Output | null : Output[]>;
    tableId: TableId;
    props: Props;
    params: Params;
    output: Output;
    table: Table<TableId>;
    nodes: RQLNode[];
    options: RequiredRefQLOptions;
    isRequired: Required;
    isOne: One;
    isExists: Exists;
    interpreted: InterpretedRQLTag<Params, Output>;
    projected(): RQLTag<TableId, Props, Components, Params, Output, ExplicitKeys, One, false, false>;
    concat<Components2 extends Selectable<TableId, Props>[], Params2, Output2, ExplicitKeys2 extends PropertyKey, One2 extends boolean, Required2 extends boolean, Exists2 extends boolean>(other: RQLTag<TableId, Props, Components2, Params2, Output2, ExplicitKeys2, One2, Required2, Exists2>): RQLTag<TableId, Props, [...Components, ...Components2], RQLParams<TableId, Props, [...Components, ...Components2]>, ConcatRQLOutput<TableId, Props, Components, Components2, Output, Output2, ExplicitKeys, ExplicitKeys2>, ExplicitKeys | ExplicitKeys2, true extends One | One2 ? true : false, true extends Required | Required2 ? true : false, true extends Exists | Exists2 ? true : false>;
    [flConcat]: this["concat"];
    interpret(where?: SQLTag): InterpretedRQLTag<Params, Output>;
    compile(params: Params): [string, any[], Next[]];
    runRows(params: Params, querier?: Querier): Promise<Output[]>;
    run(params: Params, querier?: Querier): Promise<Exists extends true ? boolean : One extends true ? Required extends true ? Output : Output | null : Output[]>;
}

const type = "refql/RQLTag";

let prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: createRQLTag,
  [refqlType]: type,
  projected,
  concat,
  [flConcat]: concat,
  interpret,
  compile,
  runRows,
  run
});

export function createRQLTag(table: Table, nodes: RQLNode[], options: RequiredRefQLOptions, isRequired = false, isOne = false, isExists = false) {
  const tag = ((params: any) => {
    return options.runner (tag, params);
  }) as RQLTag;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes,
      options,
      isRequired,
      isOne,
      isExists
    })
  );

  return tag;
}

function projected(this: RQLTag) {
  const nodes = this.nodes.flatMap (node => {
    if (Prop.isProp (node) || SQLProp.isSQLProp (node)) {
      const prop = copyObj (node) as Prop | SQLProp;
      prop.operations = prop.operations.filter (OrderBy.isOrderBy);
      return [prop];
    }

    if (RefNode.isRefNode (node)) return [node.projected ()];
    if (Limit.isLimit (node) || Offset.isOffset (node) || isSQLTag (node)) return [];
    return [node];
  });

  return createRQLTag (this.table, nodes, this.options, false, this.isOne, false);
}

type DeepRef = { tag: RQLTag; existsTags: RQLTag[] };
type Deep = { [tableId: string]: DeepRef } & { nodes: RQLNode[]};

const concatDeep = (nodes: RQLNode[]): Deep => {
  return nodes.reduce ((acc, node) => {
    if (RefNode.isRefNode (node)) {
      const { table } = node.tag;
      const id = table.toString ();

      if (acc[id]) {
        acc[id] = {
          tag: acc[id].tag.concat (node.tag),
          existsTags: acc[id].existsTags.concat (node.existsTags)
        };
      } else {
        acc[id] = { tag: node.tag, existsTags: node.existsTags };
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
  if (this.isExists !== other.isExists) {
    throw new Error ("U can't concat an exists RQLTag with a projected RQLTag");
  }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  const refNodes = Object.values (this.table.props)
    .filter (prop => RefProp.isRefProp (prop) && refs[prop.child.toString ()])
    .map ((prop: any) => {
      const { tag, existsTags } = refs[prop.child.toString ()];
      return RefNode (
        createRQLTag (tag.table, tag.nodes, this.options, tag.isRequired, tag.isOne, false),
        prop,
        this.table,
        this.options,
        existsTags
      );
    });

  return createRQLTag (
    this.table,
    [...nodes, ...refNodes as RefNode[]],
    this.options,
    this.isRequired || other.isRequired,
    this.isOne || other.isOne,
    this.isExists || other.isExists
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
      if (node.tag.isRequired) {
        filters = filters.join (" ", sqlX`and exists (${node.requiredExists ()})`);
      }
      for (const existsTag of node.existsTags) {
        filters = filters.join (" ", sqlX`and exists (${node.requiredExists (existsTag)})`);
      }
      caseOfRef (node.joinLateral (), node.info, node.single || node.tag.isOne);

    } else if (isSQLTag (node)) {
      filters = filters.join (" ", node);
    } else {
      throw new Error (`Unknown RQLNode Type: "${String (node)}"`);
    }
  }

  // Select all columns
  if (memberCount === 0) {
    const omitted = new Set (nodes
      .filter (node => (Prop.isProp (node) || SQLProp.isSQLProp (node)) && node.isOmitted)
      .map (node => (node as Prop | SQLProp).as));

    const fieldProps = Object.entries (table.props)
      .map (([, prop]) => prop as Prop)
      .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col) && !omitted.has (prop.as))
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
    .concat (this.isExists || this.isOne ? sqlX`limit 1` : limit)
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

async function runRows(this: RQLTag, params: StringMap, querier?: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await (querier || this.options.querier) (query, values);

  if (!refQLRows.length) return [];

  const nextData = await Promise.all (next.map (
    // Nested materialization always needs rows, even when the relation uses `.one()`.
    n => n.tag.runRows ({ ...params, refQLRows }, querier)
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

async function run(this: RQLTag, params: StringMap, querier?: Querier): Promise<any> {
  if (this.isExists) {
    const [query, values] = this.compile (params);
    const rows = await (querier || this.options.querier) (query, values);
    return rows.length > 0;
  }

  const rows = await this.runRows (params, querier);
  if (!this.isOne) return rows;
  if (rows.length > 0) return rows[0];
  if (!this.isRequired) return null;

  throw new Error (`Required one query returned no ${this.table.name} row`);
}

export const isRQLTag = function (x: any): x is RQLTag {
  return x != null && x[refqlType] === type;
};