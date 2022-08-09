import { EnvRecord } from "../types";
import get from "./get";

const over = <Input, T extends keyof EnvRecord<Input>>(key: T) =>
  (f: (value: EnvRecord<Input>[T]) => EnvRecord<Input>[T]) =>
    (obj: EnvRecord<Input>) =>
      Object.assign ({}, obj, { [key]: f (get (key) (obj)) });

export default over;