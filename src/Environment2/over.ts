import { EnvRecord } from "../types";
import lookup from "./lookup";

const over = <T extends keyof EnvRecord>(key: T) =>
  (f: (value: NonNullable<EnvRecord[T]>) => EnvRecord[T]) =>
    (obj: EnvRecord) =>
      Object.assign ({}, obj, { [key]: f (lookup (key) (obj)) });

export default over;