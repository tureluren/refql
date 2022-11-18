import { refqlType } from "../common/consts";
import { HasManyInfo, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode from "./ASTNode";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode";

interface HasMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): HasMany<Params & Params2>;
  setMembers<Params2>(members: ASTNode<Params2>[]): HasMany<Params & Params2>;
  info: HasManyInfo;
}

const hasManyType = "refql/HasMany";

function HasMany<Params>(info: HasManyInfo, members: ASTNode<Params>[]) {

  let hasMany: HasMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, {
      constructor: HasMany,
      [refqlType]: hasManyType,
      setMembers
    })
  );
  hasMany.table = info.table;
  hasMany.info = info;
  hasMany.members = members;

  return hasMany;
}

function setMembers(this: HasMany<StringMap>, members: ASTNode<StringMap>[]) {
  let hasMany = HasMany (this.table, this.info);
  hasMany.members = members;

  return hasMany;
}

HasMany.isHasMany = function <Params> (value: any): value is HasMany<Params> {
  return value != null && value[refqlType] === hasManyType;
};

export default HasMany;