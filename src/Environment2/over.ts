import { EnvRecord } from "../types";
import lookup from "./lookup";

const concat = <T>(obj1: T, obj2: T) => {
  const result = {} as T;
  (Object.keys (obj2) as Array<keyof T>).forEach (k => { result[k] = obj2[k]; });
  (Object.keys (obj1) as Array<keyof T>).forEach (k => { result[k] = obj1[k]; });
  return result;
};

const over = <T extends keyof EnvRecord>(key: T) =>
  (f: (value: NonNullable<EnvRecord[T]>) => EnvRecord[T]) =>
    (obj: EnvRecord) =>
      concat ({ [key]: f (lookup (key) (obj)) }, obj);

export default over;