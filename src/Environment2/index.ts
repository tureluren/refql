import { EnvRecord } from "../types";

class Environment<Input> {
  record: EnvRecord<Input>;

  constructor(record: EnvRecord<Input>) {
    this.record = Object.assign ({}, record);
  }

  extend(fn: (env: Environment<Input>) => EnvRecord<Input>) {
    return new Environment (fn (this));
  }

  map(fn: (record: EnvRecord<Input>) => EnvRecord<Input>) {
    return new Environment<Input> (fn (this.record));
  }
}

export default Environment;