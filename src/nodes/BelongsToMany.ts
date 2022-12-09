import { refqlType } from "../common/consts";
import { BelongsToManyInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface BelongsToMany<Params> extends ASTNode<Params> {
  tag: RQLTag<Params, unknown>;
  info: BelongsToManyInfo;
}

const type = "refql/BelongsToMany";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: BelongsToMany,
  [refqlType]: type,
  caseOf
});

function BelongsToMany<Params>(info: BelongsToManyInfo, tag: RQLTag<Params, unknown>) {
  let belongsToMany: BelongsToMany<Params> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;

  return belongsToMany;
}

function caseOf(this: BelongsToMany<unknown>, structureMap: StringMap) {
  return structureMap.BelongsToMany (
    this.tag,
    this.info
  );
}

BelongsToMany.isBelongsToMany = function <Params> (value: any): value is BelongsToMany<Params> {
  return value != null && value[refqlType] === type;
};

export default BelongsToMany;