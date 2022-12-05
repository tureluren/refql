import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";
import Table from "../Table";

interface Values<Params> extends ASTNode<Params> {
  run(params: Params, table?: Table): any[];
  compile(paramIdx?: number): [string, any[]];
}

const type = "refql/Values";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values,
  [refqlType]: type,
  caseOf
});

function Values<Params>(run: (params: Params, table?: Table) => any[] | any[]) {
  let values: Values<Params> = Object.create (prototype);
  values.run = typeof run === "function" ? run : () => run;

  return values;
}

// function compile(this: In<unknown>, paramIdx: number = 0) {
//   let paramStr = this.arr.map ((_, idx) => `$${idx + paramIdx + 1}`).join (", ");

//   return [`in (${paramStr})`, this.arr];
// }

function caseOf(this: Values<unknown>, structureMap: StringMap) {
  return structureMap.Values (this.run);
}

Values.isValues = function <Params> (value: any): value is Values<Params> {
  return value != null && value[refqlType] === type;
};

export default Values;