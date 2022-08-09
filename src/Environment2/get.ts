import { EnvRecord } from "../types";

const get = <Input, K extends keyof EnvRecord<Input>>(prop: K) => (record: EnvRecord<Input>) =>
  record[prop];

export default get;