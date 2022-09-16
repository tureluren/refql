import { flExtend, flMap, refqlType } from "../common/consts";
import Rec from "./Rec";

interface Env {
  rec: Rec;
  extend: (f: (env: Env) => Rec) => Env;
  [flExtend]: Env["extend"];
  map(f: (rec: Rec) => Rec): Env;
  [flMap]: Env["map"];
}

const envType = "refql/Env";

const prototype = {
  constructor: Env,
  [refqlType]: envType,
  extend, [flExtend]: extend,
  map, [flMap]: map
};

function Env(rec: Rec) {
  let env: Env = Object.create (prototype);
  env.rec = Object.assign ({}, rec);

  return env;
}

function extend(this: Env, f: (env: Env) => Rec) {
  return Env (f (this));
}

function map(this: Env, f: (rec: Rec) => Rec) {
  return Env (f (this.rec));
}

Env.isEnv = function (value: any): value is Env {
  return value != null && value[refqlType] === envType;
};

export default Env;