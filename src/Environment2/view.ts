import { EnvRecord } from "../types";

const view = <Input, K extends keyof EnvRecord<Input>>(prop: K) => (record: EnvRecord<Input>) =>
  record[prop];

export default view;