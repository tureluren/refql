import { refqlType } from "../common/consts";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Identifier<Params, Output> extends ASTNode<Params, Output>, CastAs {
  name: string;
}

const type = "refql/Identifier";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier,
  [refqlType]: type,
  caseOf
});

function Identifier<Params, Output>(name: string, as?: string, cast?: string) {
  let identifier: Identifier<Params, Output> = Object.create (prototype);

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function caseOf<Params, Output>(this: Identifier<Params, Output>, structureMap: StringMap) {
  return structureMap.Identifier (this.name, this.as, this.cast);
}

Identifier.isIdentifier = function<Params, Output> (x: any): x is Identifier<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Identifier;