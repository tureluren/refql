import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Identifier extends ASTNode<unknown>, CastAs {
  name: string;
}

const identifierPrototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier, caseOf
});

function Identifier(name: string, as?: string, cast?: string) {
  let identifier: Identifier = Object.create (identifierPrototype);

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function caseOf(this: Identifier, structureMap: StringMap) {
  return structureMap.Identifier (this.name, this.as, this.cast);
}

export default Identifier;