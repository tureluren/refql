import { refqlType } from "../common/consts";
import Table from "../Table";

interface List<Input> {
  run(params: Input, table?: Table): any[];
  compile(paramIdx?: number): [string, any[]];
  toString(): string;
}

const type = "refql/List";

const prototype = {
  constructor: List,
  [refqlType]: type,
  toString
};

function List<Input>(run: (params: Input, table?: Table) => any[] | any[]) {
  let list: List<Input> = Object.create (prototype);
  list.run = typeof run === "function" ? run : () => run;

  return list;
}

// function compile(this: In<unknown>, paramIdx: number = 0) {
//   let paramStr = this.arr.map ((_, idx) => `$${idx + paramIdx + 1}`).join (", ");

//   return [`in (${paramStr})`, this.arr];
// }

List.isList = function <Input> (value: any): value is List<Input> {
  return value != null && value[refqlType] === type;
};

export default List;