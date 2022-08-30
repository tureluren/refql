class In<T> {
  arr: T[];
  constructor(arr: T[]) {
    this.arr = arr;
  }

  write(paramIdx: number) {
    let paramStr = "";

    for (let idx = 0; idx < this.arr.length; idx++) {
      const pre = idx === 0 ? "" : ",";
      paramStr += pre + "$" + (paramIdx + idx + 1);
    }

    return `in (${paramStr})`;
  }

  toString() {
    return `In ([${this.arr}])`;
  }

  static of<T>(arr: T[]) {
    return new In<T> (arr);
  }
}

export default In;