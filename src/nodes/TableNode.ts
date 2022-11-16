import { ParamF, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";
import BelongsTo from "./BelongsTo";
import HasMany from "./HasMany";
import BelongsToMany from "./BelongsToMany";
import Root from "./Root";


interface TableNode<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
  // addMember<Params2>(node: ASTNode<Params>): TableNode<Params & Params2>;
  setAs(as: string): TableNode<Params>;
  toRoot(): Root<Params>;
  toHasMany(): HasMany<Params>;
  toBelongsTo(): BelongsTo<Params>;
  toBelongsToMany(): BelongsToMany<Params>;
}

export const tableNodePrototype = Object.assign ({}, astNodePrototype, {
  caseOf, setAs,
  toRoot, toHasMany,
  toBelongsTo, toBelongsToMany
});

// function addMember(this: TableNode<unknown>, node: ASTNode<unknown>) {
//   return this.constructor (
//     this.table,
//     this.members.concat (node),
//     this.keywords
//   );
// }

function caseOf(this: TableNode<unknown>, structureMap: StringMap) {
  return structureMap[this.constructor.name] (
    this.table,
    this.members,
    this.info
  );
}

function setAs(this: TableNode<unknown>, as: string) {
  return this.constructor (
    Table (this.table.name, as, this.table.schema),
    this.members,
    this.keywords
  );
}

function toRoot(this: TableNode<unknown>) {
  return Root (this.table, this.members, this.keywords);
}

function toHasMany(this: TableNode<unknown>) {
  return HasMany (this.table, this.members, this.keywords);
}

function toBelongsTo(this: TableNode<unknown>) {
  return BelongsTo (this.table, this.members, this.keywords);
}

function toBelongsToMany(this: TableNode<unknown>) {
  return BelongsToMany (this.table, this.members, this.info);
}

export default TableNode;