import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Table from "../Table";
import ASTNode from "./ASTNode";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode";

interface BelongsToInfo {
  as?: string;
  lRef: string;
  rRef: string;
}

interface BelongsTo<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): BelongsTo<Params & Params2>;
  setMembers<Params2>(members: ASTNode<Params2>[]): BelongsTo<Params & Params2>;
  info: BelongsToInfo;
}

const belongsToType = "refql/BelongsTo";

function BelongsTo<Params>(table: Table, info: BelongsToInfo) {
  const belongsToInfo = info || {};

  let belongsTo: BelongsTo<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: BelongsTo, [refqlType]: belongsToType, setMembers })
  );

  belongsTo.table = table;
  belongsTo.members = [];
  belongsTo.info = Object.assign ({}, { as: table.name }, belongsToInfo);

  return belongsTo;
}

function setMembers(this: BelongsTo<StringMap>, members: ASTNode<StringMap>[]) {
  let belongsTo = BelongsTo (this.table, this.info);
  belongsTo.members = members;

  return belongsTo;
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === belongsToType;
};

export default BelongsTo;