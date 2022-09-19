import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";
import CastAs from "./CastAs";

interface Identifier extends ASTNode<unknown>, CastAs {
  name: string;
}

const identifierPrototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier, cata
});

function Identifier(name: string, as?: string, cast?: string) {
  let identifier: Identifier = Object.create (identifierPrototype);

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function cata(this: Identifier, pattern: StringMap) {
  return pattern.Identifier (this.name, this.as, this.cast);
}

export default Identifier;