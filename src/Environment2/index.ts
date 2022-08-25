import { Rec } from "../types";

class Environment<Params> {
  rec: Rec<Params>;

  constructor(rec: Rec<Params>) {
    this.rec = Object.assign ({}, rec);
  }

  extend(fn: (env: Environment<Params>) => Rec<Params>) {
    return new Environment<Params> (fn (this));
  }

  map(fn: (rec: Rec<Params>) => Rec<Params>) {
    return new Environment<Params> (fn (this.rec));
  }

  static of<Params>(rec: Rec<Params>) {
    return new Environment<Params> (rec);
  }
}

export default Environment;