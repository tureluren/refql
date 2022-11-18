import { refqlType } from "../common/consts";
import { HasOneInfo, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode from "./ASTNode";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode";

interface HasOne<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): HasOne<Params & Params2>;
  setMembers<Params2>(members: ASTNode<Params2>[]): HasOne<Params & Params2>;
  info: HasOneInfo;
}

const hasOneType = "refql/HasOne";

function HasOne<Params>(info: HasOneInfo, members: ASTNode<Params>[]) {

  let hasOne: HasOne<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, {
      constructor: HasOne,
      [refqlType]: hasOneType,
      setMembers
    })
  );

  hasOne.table = info.table;
  hasOne.info = info;
  hasOne.members = members;

  return hasOne;
}

function setMembers(this: HasOne<StringMap>, members: ASTNode<StringMap>[]) {
  let hasOne = HasOne (this.table, this.info);
  hasOne.members = members;

  return hasOne;
}

HasOne.isHasOne = function <Params> (value: any): value is HasOne<Params> {
  return value != null && value[refqlType] === hasOneType;
};

export default HasOne;