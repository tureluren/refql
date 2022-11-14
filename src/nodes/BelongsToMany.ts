import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Table from "../Table";
import ASTNode from "./ASTNode";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode";

interface BelongsToManyInfo {
  as?: string;
  lRef: string;
  rRef: string;
  lxRef: string;
  rxRef: string;
  xTable: Table;
}

interface BelongsToMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): BelongsToMany<Params & Params2>;
  setMembers<Params2>(members: ASTNode<Params2>[]): BelongsToMany<Params & Params2>;
  info: BelongsToManyInfo;
}

const belongsToManyType = "refql/BelongsToMany";

function BelongsToMany<Params>(table: Table, info: BelongsToManyInfo) {
  const belongsToManyInfo = info || {};

  let belongsToMany: BelongsToMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: BelongsToMany, [refqlType]: belongsToManyType, setMembers })
  );

  belongsToMany.table = table;
  belongsToMany.members = [];
  belongsToMany.info = Object.assign ({}, { as: table.name }, belongsToManyInfo);

  return belongsToMany;
}

function setMembers(this: BelongsToMany<StringMap>, members: ASTNode<StringMap>[]) {
  let belongsToMany = BelongsToMany (this.table, this.info);
  belongsToMany.members = members;

  return belongsToMany;
}

BelongsToMany.isBelongsToMany = function <Params> (value: any): value is BelongsToMany<Params> {
  return value != null && value[refqlType] === belongsToManyType;
};

export default BelongsToMany;