import { refqlType } from "../common/consts.ts";
import Table from "../Table/index.ts";
import ASTNode from "./ASTNode.ts";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode.ts";

interface BelongsTo<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): BelongsTo<Params & Params2>;
}

const belongsToType = "refql/BelongsTo";

function BelongsTo<Params>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let belongsTo: BelongsTo<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: BelongsTo, [refqlType]: belongsToType })
  );

  belongsTo.table = table;
  belongsTo.members = members;
  belongsTo.keywords = keywords;

  return belongsTo;
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === belongsToType;
};

export default BelongsTo;