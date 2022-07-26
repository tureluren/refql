import { EnvRecord, Transformations } from "../types";
import lookup from "./lookup";

const evolve = <Input, T extends keyof EnvRecord<Input>>(transformations: Transformations<Input>) => (obj: EnvRecord<Input>): EnvRecord<Input> => {
  return (Object.keys (obj) as Array<T>).reduce ((acc, key) => {
    const transformation = transformations[key];
    if (transformation) {
      acc[key] = transformation (lookup (key) (obj));
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as EnvRecord<Input>);
};

export default evolve;