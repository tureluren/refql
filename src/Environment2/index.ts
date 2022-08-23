import { EnvRecord } from "../types";

class Environment<Params> {
  record: EnvRecord<Params>;

  constructor(record: EnvRecord<Params>) {
    this.record = Object.assign ({}, record);
  }

  extend(fn: (env: Environment<Params>) => EnvRecord<Params>) {
    return new Environment<Params> (fn (this));
  }

  map(fn: (record: EnvRecord<Params>) => EnvRecord<Params>) {
    return new Environment<Params> (fn (this.record));
  }

  static of<Params>(record: EnvRecord<Params>) {
    return new Environment<Params> (record);
  }
}

export default Environment;