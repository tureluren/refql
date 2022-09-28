import { refqlType } from "../common/consts.ts";
import Table from "../Table/index.ts";
import ASTNode from "./ASTNode.ts";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode.ts";

interface HasMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): HasMany<Params & Params2>;
}

const hasManyType = "refql/HasMany";

function HasMany<Params>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let hasMany: HasMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, {
      constructor: HasMany,
      [refqlType]: hasManyType
    })
  );

  hasMany.table = table;
  hasMany.members = members;
  hasMany.keywords = keywords;

  return hasMany;
}

HasMany.isHasMany = function <Params> (value: any): value is HasMany<Params> {
  return value != null && value[refqlType] === hasManyType;
};

export default HasMany;