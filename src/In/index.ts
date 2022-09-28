import { refqlType } from "../common/consts";

interface In<T> {
  arr: T[];
  write(paramIdx: number): string;
  toString(): string;
}

const inType = "refql/In";

const prototype = {
  constructor: In,
  [refqlType]: inType,
  write, toString
};

function In<T>(arr: T[]) {
  let inn: In<T> = Object.create (prototype);
  inn.arr = arr;

  return inn;
}

function write(this: In<unknown>, paramIdx: number) {
  let paramStr = "";

  for (let idx = 0; idx < this.arr.length; idx++) {
    const pre = idx === 0 ? "" : ",";
    paramStr += pre + "$" + (paramIdx + idx + 1);
  }

  return `in (${paramStr})`;
}

function toString(this: In<unknown>) {
  return `In ([${this.arr}])`;
}

In.isIn = function <T> (value: any): value is In<T> {
  return value != null && value[refqlType] === inType;
};

export default In;