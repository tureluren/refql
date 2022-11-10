import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Table from "../Table";
import ASTNode from "./ASTNode";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode";

interface HasManyInfo {
  as?: string;
  lRef: string;
  rRef: string;
}

interface HasMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): HasMany<Params & Params2>;
  setMembers<Params2>(members: ASTNode<Params2>[]): HasMany<Params & Params2>;
  info: HasManyInfo;
}

const hasManyType = "refql/HasMany";

function HasMany<Params>(table: Table, info: HasManyInfo) {
  const hasManyInfo = info || {};


  if (!Table.isTable (table)) {
    throw new Error ("expected table");
  }

  if (typeof hasManyInfo.lRef !== "string") {
    throw new Error ("lref must be a string");
  }

  if (typeof hasManyInfo.rRef !== "string") {
    throw new Error ("lref must be a string");
  }


  let hasMany: HasMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, {
      constructor: HasMany,
      [refqlType]: hasManyType,
      setMembers
    })
  );

  hasMany.table = table;
  hasMany.members = [];
  hasMany.info = Object.assign ({}, { as: table.name }, info);

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