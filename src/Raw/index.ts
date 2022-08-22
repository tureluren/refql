import isString from "../predicate/isString";

class Raw {
  value: string;
  constructor(value: string) {
    if (!isString (value)) {
      throw TypeError ("Raw must wrap a String");
    }
    this.value = value;
  }

  static of(value: string) {
    return new Raw (value);
  }
}

export default Raw;