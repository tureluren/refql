import { EnvRecord } from "../types";
import concat from "./concat";

const set = <T extends keyof EnvRecord>(key: T) => (value: EnvRecord[T]) => (obj: EnvRecord) =>
    concat ({ [key]: value }, obj);

export default set;