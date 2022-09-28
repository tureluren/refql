import { refqlType } from "../common/consts.ts";
import Table from "../Table/index.ts";
import ASTNode from "./ASTNode.ts";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode.ts";

interface ManyToMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): ManyToMany<Params & Params2>;
}

const manyToManyType = "refql/ManyToMany";

function ManyToMany<Params>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let manyToMany: ManyToMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: ManyToMany, [refqlType]: manyToManyType })
  );

  manyToMany.table = table;
  manyToMany.members = members;
  manyToMany.keywords = keywords;

  return manyToMany;
}

ManyToMany.isManyToMany = function <Params> (value: any): value is ManyToMany<Params> {
  return value != null && value[refqlType] === manyToManyType;
};

export default ManyToMany;