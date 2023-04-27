import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";

interface Values<Params, Output> extends ASTNode<Params, Output> {
  run: TagFunctionVariable<Params, ValueType[]>;
}

const type = "refql/Values";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values,
  [refqlType]: type,
  caseOf
});

function Values<Params, Output>(run: ValueType[] | TagFunctionVariable<Params, any[]>) {
  let values: Values<Params, Output> = Object.create (prototype);
  values.run = typeof run === "function" ? run : () => run;

  return values;
}

function caseOf<Params, Output>(this: Values<Params, Output>, structureMap: StringMap) {
  return structureMap.Values (this.run);
}

Values.isValues = function <Params, Output> (x: any): x is Values<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Values;