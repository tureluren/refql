import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";

const OperationSymbol: unique symbol = Symbol ("@@Operation");

interface Operation<Params = any> {
  [OperationSymbol]: true;
  params: Params;
  interpret<Params = any>(col: Raw | SQLTag, displayAnd: boolean): SQLTag<Params>;
}

export const operationPrototype = {
  [OperationSymbol]: true
};

export const isOperation = function (x: any): x is Operation {
  return x != null && !!x[OperationSymbol];
};

export default Operation;