import { Rec } from "../types";

interface Env<Params = {}> {
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

function extend(this: Env, f: (env: Env) => Rec) {
  return Env (f (this));
}

function map(this: Env, f: (rec: Rec) => Rec) {
  return Env (f (this.rec));
}

export default Env;