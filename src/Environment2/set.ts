import { EnvRecord } from "../types";

const set = <T extends keyof EnvRecord<any>>(key: T) => (value: EnvRecord<any>[T]) => <Input>(obj: EnvRecord<Input>): EnvRecord<Input> =>
  Object.assign ({}, obj, { [key]: value });

export default set;