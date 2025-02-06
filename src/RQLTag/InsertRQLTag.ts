import { RQLTag } from ".";
import { refqlType } from "../common/consts";
import { getConvertPromise } from "../common/convertPromise";
import getDefaultQuerier from "../common/defaultQuerier";
import { Querier, StringMap } from "../common/types";
import Prop from "../Prop";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Values2D from "../SQLTag/Values2D";
import Table from "../Table";
import RQLNode from "./RQLNode";

interface InterpretedInsertRQLTag<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  returning?: RQLTag<any, Output>;
}

export interface InsertRQLTag<TableId extends string = any, Params = any, Output = any> {
  (params?: Params, querier?: Querier): Promise<Output>;
  tableId: TableId;
  params: Params;
  type: Output;
  table: Table<TableId>;
  nodes: RQLNode[];
  interpreted: InterpretedInsertRQLTag<Params, Output>;
  interpret(): InterpretedInsertRQLTag<Params, Output>;
  compile(params: Params): [string, any[], RQLTag<any, Output>];
  run(params: Params, querier: Querier): Promise<Output>;
}

const type = "refql/InsertableRQLTag";

let prototype = {
  constructor: createInsertRQLTag,
  [refqlType]: type,
  interpret,
  compile,
  run
};

export function createInsertRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[]) {
  const tag = ((params = {} as Params, querier?: Querier) => {
    const defaultQuerier = getDefaultQuerier ();
    const convertPromise = getConvertPromise ();

    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return convertPromise (tag.run (params, (querier || defaultQuerier) as Querier) as Promise<Output>);
  }) as InsertRQLTag<TableId, Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes
    })
  );

  return tag;
}

function interpret(this: InsertRQLTag): InterpretedInsertRQLTag {
  const { nodes, table } = this,
    members = [] as Prop[];

  let returning: RQLTag | undefined;

  for (const node of nodes) {
    if (Prop.isProp (node)) {
      members.push (node);

    } else {
      throw new Error (`Unknown RQLNode Type: "${String (node)}"`);
    }
  }

  let tag = sql`
    insert into ${Raw (`${table} (${members.map (f => f.col || f.as).join (", ")})`)}
    values ${Values2D ((batch: any[]) => batch.map (x => members.map (f => x[f.as])))}
  `;

  return {
    tag,
    returning
  };
}

function compile(this: InsertRQLTag, params: StringMap) {
  if (!this.interpreted) {
    let { returning, tag } = this.interpret ();

    this.interpreted = {
      tag,
      returning
    };
  }

  return [
    ...this.interpreted.tag.compile (params),
    this.interpreted.returning
  ];
}

async function run(this: InsertRQLTag, params: StringMap, querier: Querier): Promise<any[]> {
  const [query, values, returning] = this.compile (params);

  const inserts = await querier (query, values);

  if (!inserts.length || !returning) return [];

  // check if cached
  return returning ({ inserts });
}

export const isInsertRQLTag = function <As extends string = any, Params = any, Output = any> (x: any): x is InsertRQLTag<As, Params, Output> {
  return x != null && x[refqlType] === type;
};