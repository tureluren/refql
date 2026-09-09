import { TagFunctionVariable } from "../common/types.ts";

const SQLNodeSymbol: unique symbol = Symbol ("@@SQLNode");

interface SQLNode<Params = any> {
  params: Params;
  run: TagFunctionVariable<Params, any>;
  [SQLNodeSymbol]: true;
}

export const sqlNodePrototype = {
  [SQLNodeSymbol]: true
};

export const isSQLNode = function (x: any): x is SQLNode {
  return x != null && !!x[SQLNodeSymbol];
};

export default SQLNode;