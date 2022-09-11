interface Raw {
  value: string;
  toString: () => string;
}

const prototype = {
  constructor: Raw,
  toString
};

function Raw(value: boolean | number | string) {
  let raw: Raw = Object.create (Raw.prototype);
  raw.value = String (value);

  return raw;
}
Raw.prototype = Object.create (prototype);

function toString(this: Raw) {
  return `Raw (${this.value})`;
}

Raw.isRaw = function (value: any): value is Raw {
  return value instanceof Raw;
};

export default Raw;