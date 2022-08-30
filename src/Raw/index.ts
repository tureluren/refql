class Raw {
  value: string;
  constructor(value: boolean | number | string) {
    this.value = String (value);
  }

  toString() {
    return `Raw (${this.value})`;
  }

  static of(value: boolean | number | string) {
    return new Raw (String (value));
  }
}

export default Raw;