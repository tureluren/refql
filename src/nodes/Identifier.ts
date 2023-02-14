import { refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Identifier<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box>, CastAs {
  name: string;
}

const type = "refql/Identifier";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier,
  [refqlType]: type,
  caseOf
});

function Identifier<Params, Output, Box extends Boxes>(name: string, as?: string, cast?: string) {
  let identifier: Identifier<Params, Output, Box> = Object.create (prototype);

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function caseOf<Params, Output, Box extends Boxes>(this: Identifier<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Identifier (this.name, this.as, this.cast);
}

Identifier.isIdentifier = function<Params, Output, Box extends Boxes> (x: any): x is Identifier<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Identifier;