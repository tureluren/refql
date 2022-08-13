import { EnvRecord } from "../types";
import get from "./get";

const over = <T extends keyof EnvRecord<any>>(key: T) =>
  (fn: (value: EnvRecord<any>[T]) => EnvRecord<any>[T]) =>
    <Input>(obj: EnvRecord<Input>) =>
      Object.assign ({}, obj, { [key]: fn (get (key) (obj)) });

export default over;