import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import truePred from "../common/truePred";
import { TagFunctionVariable } from "../common/types";

const OperationSymbol: unique symbol = Symbol ("@@Operation");

interface Operation<Params = any> {
  [OperationSymbol]: true;
  params: Params;
  interpret<Params = any>(col: Raw | SQLTag): SQLTag<Params>;
  pred: TagFunctionVariable<Params, boolean>;
}

export const operationPrototype = {
  [OperationSymbol]: true,
  pred: truePred
};

export const isOperation = function<Params = any> (x: any): x is Operation<Params> {
  return x != null && !!x[OperationSymbol];
};

export default Operation;