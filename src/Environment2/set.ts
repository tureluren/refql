import { EnvRecord } from "../types";

const set = <Input, T extends keyof EnvRecord<Input>>(key: T) => (value: EnvRecord<Input>[T]) => (obj: EnvRecord<Input>) =>
  Object.assign ({}, obj, { [key]: value });

export default set;