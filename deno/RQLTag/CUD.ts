import { RQLTag } from "./index.ts";
import { Table } from "../Table/index.ts";
import { InterpretedCUD, RequiredRefQLOptions, Runner, StringMap } from "../common/types.ts";

const CUDSymbol: unique symbol = Symbol ("@@CUD");

interface CUD<TableId extends string = any, Params = any, Output = any> {
  (params: {} extends Params ? Params | void : Params): Promise<Output[]>;
  tableId: TableId;
  table: Table<TableId>;
  params: Params;
  options: RequiredRefQLOptions;
  runner: Runner;
  [CUDSymbol]: true;
  interpret(): InterpretedCUD<Params, Output>;
  interpreted: InterpretedCUD<Params, Output>;
  compile(params: Params): [string, any[], RQLTag<any, Output>];
  run(params: Params): Promise<Output[]>;
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

async function run(this: CUD, params: StringMap): Promise<any[]> {
  const [query, values, returning] = this.compile (params);

  const rows = await this.options.querier (query, values);

  if (!returning) return rows;

  return returning ({ rows, ...params });
}

export const isCUD = function (x: any): x is CUD {
  return x != null && !!x[CUDSymbol];
};

export default CUD;