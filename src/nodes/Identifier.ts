import { refqlType } from "../common/consts";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Identifier extends ASTNode<unknown>, CastAs {
  name: string;
}

const identifierType = "refql/Identifier";

const identifierPrototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier, caseOf, [refqlType]: identifierType
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

Identifier.isIdentifier = function (value: any): value is Identifier {
  return value != null && value[refqlType] === identifierType;
};

export default Identifier;