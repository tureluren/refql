import { flExtend, flMap, refqlType } from "../common/consts.ts";
import Rec from "./Rec.ts";

interface Env {
  rec: Rec;
  extend: (f: (env: Env) => Rec) => Env;
  map(f: (rec: Rec) => Rec): Env;
  [flExtend]: Env["extend"];
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
  env.rec = rec;

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