import { refqlType } from "../common/consts.ts";
import Table from "../Table/index.ts";
import ASTNode from "./ASTNode.ts";
import TableNode, { Keywords, tableNodePrototype } from "./TableNode.ts";

interface Root<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode<Params2>): Root<Params & Params2>;
}

const rootType = "refql/Root";

function Root<Params>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let root: Root<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, {
      constructor: Root,
      [refqlType]: rootType
    })
  );

  root.table = table;
  root.members = members;
  root.keywords = keywords;

  return root;
}

Root.isRoot = function<Params> (value: any): value is Root<Params> {
  return value != null && value[refqlType] === rootType;
};

export default Root;