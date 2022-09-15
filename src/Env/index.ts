import { Rec } from "../types";

interface Env {
  rec: Rec;
  extend(f: (env: Env) => Rec): Env;
  map(f: (rec: Rec) => Rec): Env;
}

const prototype = {
  constructor: Env,
  extend, map
};

function Env(rec: Rec) {
  let env: Env = Object.create (Env.prototype);
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