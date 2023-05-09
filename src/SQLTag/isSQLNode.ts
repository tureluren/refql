import { SQLNode } from "../common/types";

const sqlNode: symbol = Symbol ("@@SQLNode");

export const sqlNodePrototype = {
  [sqlNode]: true
};

const isSQLNode = function<Params> (x: any): x is SQLNode<Params> {
  return x != null && !!x[sqlNode];
};

export default isSQLNode;