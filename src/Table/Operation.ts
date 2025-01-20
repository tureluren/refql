import truePred from "../common/truePred";
import { InterpretedString, TagFunctionVariable } from "../common/types";

const OperationSymbol: unique symbol = Symbol ("@@Operation");

interface Operation<Params = any, Type = any> {
  [OperationSymbol]: true;
  precedence: number;
  params: Params;
  run: TagFunctionVariable<Params, Type>;
  interpret<Params = any>(pred: TagFunctionVariable<Params, boolean>): InterpretedString<Params>[];
}

export const operationPrototype = {
  [OperationSymbol]: true,
  pred: truePred
};

export const isOperation = function (x: any): x is Operation {
  return x != null && !!x[OperationSymbol];
};

export default Operation;