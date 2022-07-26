import { EnvRecord } from "../types";
import lookup from "./lookup";

const over = <Input, T extends keyof EnvRecord<Input>>(key: T) =>
  (f: (value: NonNullable<EnvRecord<Input>[T]>) => EnvRecord<Input>[T]) =>
    (obj: EnvRecord<Input>) =>
      Object.assign ({}, obj, { [key]: f (lookup (key) (obj)) });

export default over;