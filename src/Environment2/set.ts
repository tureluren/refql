import { EnvRecord } from "../types";

function set <K extends keyof EnvRecord<any>>(prop: K, value: EnvRecord<any>[K]): <Input>(record: EnvRecord<Input>) => EnvRecord<Input>;
function set <Input, K extends keyof EnvRecord<Input>>(prop: K, value: EnvRecord<Input>[K], record: EnvRecord<Input>): EnvRecord<Input>;
function set <K extends keyof EnvRecord<any>>(prop: K, value: EnvRecord<any>[K], record?: EnvRecord<any>): EnvRecord<any> | (<Input>(record: EnvRecord<Input>) => EnvRecord<Input>) {
  const go = <Input>(record: EnvRecord<Input>): EnvRecord<Input> => {
    return { ...record, [prop]: value };
  };

  return !record ? go : go (record);
}

export default set;