import { Rec } from "../types";

// class Env<Params> {
//   rec: Rec<Params>;

//   constructor(rec: Rec<Params>) {
//     this.rec = Object.assign ({}, rec);
//   }

//   extend(f: (env: Env<Params>) => Rec<Params>) {
//     return new Env<Params> (f (this));
//   }

//   map(f: (rec: Rec<Params>) => Rec<Params>) {
//     return new Env<Params> (f (this.rec));
//   }

//   static of<Params>(rec: Rec<Params>) {
//     return new Env<Params> (rec);
//   }
// }

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
  let env: Env<Params> = Object.create (prototype);
  env.rec = Object.assign ({}, rec);

  return env;
}

function extend(this: Env, f: (env: Env) => Rec) {
  return Env (f (this));
}

function map(this: Env, f: (rec: Rec) => Rec) {
  return Env (f (this.rec));
}

export default Env;