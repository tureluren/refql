import { Rec } from "../types";

interface Env<Params> {
  rec: Rec<Params>;
  extend(f: (env: Env<Params>) => Rec<Params>): Env<Params>;
  map(f: (rec: Rec<Params>) => Rec<Params>): Env<Params>;
}

const prototype = {
  constructor: Env,
  extend, map
};

function Env<Params = {}>(rec: Rec<Params>) {
  let env: Env<Params> = Object.create (Env.prototype);
  env.rec = Object.assign ({}, rec);

  return env;
}

Env.prototype = Object.create (prototype);

function extend<Params>(this: Env<Params>, f: (env: Env<Params>) => Rec<Params>) {
  return Env (f (this));
}

function map<Params>(this: Env<Params>, f: (rec: Rec<Params>) => Rec<Params>) {
  return Env (f (this.rec));
}

export default Env;