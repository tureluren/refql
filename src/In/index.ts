// class In<T> {
//   arr: T[];
//   constructor(arr: T[]) {
//     this.arr = arr;
//   }

//   write(paramIdx: number) {
//     let paramStr = "";

//     for (let idx = 0; idx < this.arr.length; idx++) {
//       const pre = idx === 0 ? "" : ",";
//       paramStr += pre + "$" + (paramIdx + idx + 1);
//     }

//     return `in (${paramStr})`;
//   }

//   toString() {
//     return `In ([${this.arr}])`;
//   }

//   static of<T>(arr: T[]) {
//     return new In<T> (arr);
//   }
// }

interface In<T = any> {
  arr: T[];
  write(paramIdx: number): string;
  toString: () => string;
}

const prototype = {
  constructor: In,
  write, toString
};

function In<T = any>(arr: T[]) {
  let inn: In<T> = Object.create (prototype);
  inn.arr = arr;

  return inn;
}

function write(this: In, paramIdx: number) {
  let paramStr = "";

  for (let idx = 0; idx < this.arr.length; idx++) {
    const pre = idx === 0 ? "" : ",";
    paramStr += pre + "$" + (paramIdx + idx + 1);
  }

  return `in (${paramStr})`;
}

function toString(this: In) {
  return `In ([${this.arr}])`;
}

In.isIn = function <T = any> (value: any): value is In<T> {
  return value.constructor == In;
};

export default In;