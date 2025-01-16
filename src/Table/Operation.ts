import truePred from "../common/truePred";

const OperationSymbol: unique symbol = Symbol ("@@Operation");

interface Operation<Params = any> {
  [OperationSymbol]: true;
  pred(p: any): boolean;
  setPred (fn: (p: any) => boolean): Operation;
  precedence: number;
  params: Params;
}

export const operationPrototype = {
  [OperationSymbol]: true,
  pred: truePred
};

export const isOperation = function (x: any): x is Operation {
  return x != null && !!x[OperationSymbol];
};

export default Operation;