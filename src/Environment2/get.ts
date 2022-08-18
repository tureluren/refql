import { EnvRecord } from "../types";

function get <K extends keyof EnvRecord<any>>(prop: K): <Input>(record: EnvRecord<Input>) => EnvRecord<Input>[K];
function get <Input, K extends keyof EnvRecord<Input>>(prop: K, record: EnvRecord<Input>): EnvRecord<Input>[K];
function get <K extends keyof EnvRecord<any>>(prop: K, record?: EnvRecord<any>): EnvRecord<any>[K] | (<Input>(record: EnvRecord<Input>) => EnvRecord<Input>[K]) {
  const go = <Input>(record: EnvRecord<Input>): EnvRecord<Input>[K] =>
    record[prop];

  return !record ? go : go (record);
}

export default get;