import { EnvRecord } from "../types";
import view from "./view";

const over = <Input, T extends keyof EnvRecord<Input>>(key: T) =>
  (f: (value: EnvRecord<Input>[T]) => EnvRecord<Input>[T]) =>
    (obj: EnvRecord<Input>) =>
      Object.assign ({}, obj, { [key]: f (view (key) (obj)) });

export default over;