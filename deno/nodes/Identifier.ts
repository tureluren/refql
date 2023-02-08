import { refqlType } from "../common/consts.ts";
import { CastAs, StringMap } from "../common/types.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";

interface Identifier extends ASTNode, CastAs {
  name: string;
}

const type = "refql/Identifier";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier,
  [refqlType]: type,
  caseOf
});

function Identifier<Params, Output>(name: string, as?: string, cast?: string) {
  let identifier: Identifier = Object.create (prototype);

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function caseOf(this: Identifier, structureMap: StringMap) {
  return structureMap.Identifier (this.name, this.as, this.cast);
}

Identifier.isIdentifier = function<Params, Output> (x: any): x is Identifier {
  return x != null && x[refqlType] === type;
};

export default Identifier;