import { EnvRecord, Transformations } from "../types";
import get from "./get";

const evolve = <T extends keyof EnvRecord<any>>(transformations: Transformations<any>) => <Input>(obj: EnvRecord<Input>): EnvRecord<Input> => {
  return (Object.keys (obj) as Array<T>).reduce ((acc, key) => {
    const transformation = transformations[key];
    if (transformation) {
      acc[key] = transformation (get (key) (obj));
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as EnvRecord<Input>);
};

export default evolve;