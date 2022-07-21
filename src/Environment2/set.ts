import { EnvRecord } from "../types";

const set = <T extends keyof EnvRecord>(key: T) => (value: EnvRecord[T]) => (obj: EnvRecord) =>
    Object.assign ({}, obj, { [key]: value });

export default set;