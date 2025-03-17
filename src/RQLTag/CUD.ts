import { RQLTag } from ".";
import Table from "../Table";
import { InterpretedCUD, Querier, StringMap } from "../common/types";

const CUDSymbol: unique symbol = Symbol ("@@CUD");

interface CUD<TableId extends string = any, Params = any, Output = any> {
  (params?: Params, querier?: Querier): Promise<Output[]>;
  tableId: TableId;
  table: Table<TableId>;
  params: Params;
  output: Output;
  [CUDSymbol]: true;
  interpret(): InterpretedCUD<Params, Output>;
  interpreted: InterpretedCUD<Params, Output>;
  compile(params: Params): [string, any[], RQLTag<any, Output>];
  run(params: Params, querier: Querier): Promise<Output[]>;
}

export const CUDPrototype = {
  [CUDSymbol]: true,
  compile,
  run
};

function compile(this: CUD, params: StringMap) {
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

async function run(this: CUD, params: StringMap, querier: Querier): Promise<any[]> {
  const [query, values, returning] = this.compile (params);

  const rows = await querier (query, values);

  if (!returning) return rows;

  return returning ({ rows, ...params });
}

export const isCUD = function (x: any): x is CUD {
  return x != null && !!x[CUDSymbol];
};

export default CUD;