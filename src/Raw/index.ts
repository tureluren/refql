// class Raw {
//   value: string;
//   constructor(value: boolean | number | string) {
//     this.value = String (value);
//   }

//   toString() {
//     return `Raw (${this.value})`;
//   }

//   static of(value: boolean | number | string) {
//     return new Raw (String (value));
//   }
// }

interface Raw {
  value: string;
  toString: () => string;
}

const prototype = {
  constructor: Raw,
  toString
};

function Raw(value: boolean | number | string) {
  let raw: Raw = Object.create (prototype);
  raw.value = String (value);

  return raw;
}

function toString(this: Raw) {
  return `Raw (${this.value})`;
}

Raw.isRaw = function (value: any): value is Raw {
  return value.constructor == Raw;
};

export default Raw;