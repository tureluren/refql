import { EnvRecord, Transformations } from "../types";
import lookup from "./lookup";

const evolve = <T extends keyof EnvRecord>(transformations: Transformations) => (obj: EnvRecord): EnvRecord => {
  return (Object.keys (obj) as Array<T>).reduce ((acc, key) => {
    const transformation = transformations[key];
    if (transformation) {
      acc[key] = transformation (lookup (key) (obj));
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as EnvRecord);
};

export default evolve;