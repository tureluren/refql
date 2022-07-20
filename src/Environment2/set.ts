import { EnvRecord } from "../types";

const set = <T extends keyof EnvRecord>(key: T) => (value: EnvRecord[T]) => (obj: EnvRecord) =>
    Object.assign ({ [key]: value }, obj);

export default set;