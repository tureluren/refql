import { flMap, refqlType } from "../common/consts";

interface Raw {
  value: boolean | number | string;
  map(f: (value: string) => string): Raw;
  toString(): string;
  [flMap]: Raw["map"];
}

const rawType = "refql/Raw";

const prototype = {
  constructor: Raw,
  [refqlType]: rawType,
  map, [flMap]: map,
  toString
};

function Raw(value: boolean | number | string) {
  let raw: Raw = Object.create (prototype);
  raw.value = value;

  return raw;
}

function map(this: Raw, f: (value: boolean | number | string) => string) {
  return Raw (f (this.value));
}

function toString(this: Raw) {
  return String (this.value);
}

Raw.isRaw = function (value: any): value is Raw {
  return value != null && value[refqlType] === rawType;
};

export default Raw;