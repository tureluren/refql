import { Rec } from "../types";

class Env<Params> {
  rec: Rec<Params>;

  constructor(rec: Rec<Params>) {
    this.rec = Object.assign ({}, rec);
  }

  extend(f: (env: Env<Params>) => Rec<Params>) {
    return new Env<Params> (f (this));
  }

  map(f: (rec: Rec<Params>) => Rec<Params>) {
    return new Env<Params> (f (this.rec));
  }

  static of<Params>(rec: Rec<Params>) {
    return new Env<Params> (rec);
  }
}

export default Env;