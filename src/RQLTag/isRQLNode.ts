import { RQLNode } from "../common/types";

const rqlNode: symbol = Symbol ("@@RQLNode");

export const rqlNodePrototype = {
  [rqlNode]: true
};

const isRQLNode = function (x: any): x is RQLNode {
  return x != null && !!x[rqlNode];
};

export default isRQLNode;