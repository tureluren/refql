import { EnvRecord } from "../types";
import concat from "./concat";
import lookup from "./lookup";

const over = <T extends keyof EnvRecord>(key: T) =>
  (f: (value: NonNullable<EnvRecord[T]>) => EnvRecord[T]) =>
    (obj: EnvRecord) =>
      concat ({ [key]: f (lookup (key) (obj)) }, obj);

export default over;