import { EnvRecord } from "../types";

const get = <K extends keyof EnvRecord<any>>(prop: K) => <Input>(record: EnvRecord<Input>) =>
  record[prop];

export default get;