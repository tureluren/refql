import { Rec } from "../types";

class Env<Params> {
  rec: Rec<Params>;

  constructor(rec: Rec<Params>) {
    this.rec = Object.assign ({}, rec);
  }

  extend(fn: (env: Env<Params>) => Rec<Params>) {
    return new Env<Params> (fn (this));
  }

  map(fn: (rec: Rec<Params>) => Rec<Params>) {
    return new Env<Params> (fn (this.rec));
  }

  static of<Params>(rec: Rec<Params>) {
    return new Env<Params> (rec);
  }
}

export default Env;