import { EnvRecord } from "../types";
import get from "./get";

function over <K extends keyof EnvRecord<any>>(prop: K, fn: (value: EnvRecord<any>[K]) => EnvRecord<any>[K]): <Input>(record: EnvRecord<Input>) => EnvRecord<Input>;
function over <Input, K extends keyof EnvRecord<Input>>(prop: K, fn: (value: EnvRecord<Input>[K]) => EnvRecord<Input>[K], record: EnvRecord<Input>): EnvRecord<Input>;
function over <K extends keyof EnvRecord<any>>(prop: K, fn: (value: EnvRecord<any>[K]) => EnvRecord<any>[K], record?: EnvRecord<any>): EnvRecord<any> | (<Input>(record: EnvRecord<Input>) => EnvRecord<Input>) {
  const go = <Input>(record: EnvRecord<Input>): EnvRecord<Input> => {
    return { ...record, [prop]: fn (get (prop, record)) };
  };
  return !record ? go : go (record);
}

export default over;