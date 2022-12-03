import { refqlType } from "../common/consts";
import { CastAs, ParamF2, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Param<Input> extends ASTNode<Input> {
  f: ParamF2<Input>;
}

const type = "refql/Param";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Param, caseOf, [refqlType]: type
});

function Param<Input>(f: ParamF2<Input>) {
  let param: Param<Input> = Object.create (prototype);
  param.f = f;

  return param;
}

function caseOf(this: Param<unknown>, structureMap: StringMap) {
  return structureMap.Param (this.f);
}

// Param.isParam = function (value: any): value is Identifier {
//   return value != null && value[refqlType] === type;
// };

export default Param;