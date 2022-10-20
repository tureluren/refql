import { refqlType } from "../common/consts";

interface In<T> {
  arr: T[];
  compile(paramIdx?: number): [string, any[]];
  toString(): string;
}

const inType = "refql/In";

const prototype = {
  constructor: In,
  [refqlType]: inType,
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

function toString(this: In<unknown>) {
  return `In ([${this.arr.join (", ")}])`;
}

In.isIn = function <T> (value: any): value is In<T> {
  return value != null && value[refqlType] === inType;
};

export default In;