import { refqlType } from "../common/consts";

interface In<T> {
  arr: T[];
  compile(paramIdx?: number): [string, any[]];
  toString(): string;
}

const type = "refql/In";

const prototype = {
  constructor: In,
  [refqlType]: type,
  compile, toString
};

function In<T>(arr: T[]) {
  let inn: In<T> = Object.create (prototype);
  inn.arr = arr;

  return inn;
}

function compile(this: In<unknown>, paramIdx: number = 0) {
  let paramStr = this.arr.map ((_, idx) => `$${idx + paramIdx + 1}`).join (", ");

  return [`in (${paramStr})`, this.arr];
}

In.isIn = function <T> (value: any): value is In<T> {
  return value != null && value[refqlType] === type;
};

export default In;