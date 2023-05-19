import { RQLNode } from "../common/types";
import RQLNodeType from "./RQLNodeType";

export const rqlNodePrototype = {
  [RQLNodeType]: true
};

const isRQLNode = function (x: any): x is RQLNode {
  return x != null && !!x[RQLNodeType];
};

export default isRQLNode;