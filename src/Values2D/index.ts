import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";
import Table from "../Table";

interface Values2D<Params> extends ASTNode<Params> {
  run(params: Params, table?: Table): any[][];
  compile(paramIdx?: number): [string, any[]];
}

const type = "refql/Values2D";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values2D,
  [refqlType]: type,
  caseOf
});

function Values2D<Params>(run: any[][] | ((params: Params, table?: Table) => any[][])) {
  let values2D: Values2D<Params> = Object.create (prototype);
  values2D.run = typeof run === "function" ? run : () => run;

  return values2D;
}

// function compile(this: In<unknown>, paramIdx: number = 0) {
//   let paramStr = this.arr.map ((_, idx) => `$${idx + paramIdx + 1}`).join (", ");

//   return [`in (${paramStr})`, this.arr];
// }

function caseOf(this: Values2D<unknown>, structureMap: StringMap) {
  return structureMap.Values2D (this.run);
}

Values2D.isValues2D = function <Params> (value: any): value is Values2D<Params> {
  return value != null && value[refqlType] === type;
};

export default Values2D;