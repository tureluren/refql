import { flExtend, flMap, refqlType } from "../common/consts";
import Rec from "./Rec";

interface Env {
  rec: Rec;
  extend: (f: (env: Env) => Rec) => Env;
  map(f: (rec: Rec) => Rec): Env;
  [flExtend]: Env["extend"];
  [flMap]: Env["map"];
}

const type = "refql/Env";

const prototype = {
  constructor: Env,
  [refqlType]: type,
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
  return value != null && value[refqlType] === type;
};

export default Env;