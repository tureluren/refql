import { EnvRecord, Transformations } from "../types";
import get from "./get";

function evolve <K extends keyof EnvRecord<any>>(transformations: Transformations<any>): <Input>(record: EnvRecord<Input>) => EnvRecord<Input>;
function evolve <Input, K extends keyof EnvRecord<Input>>(transformations: Transformations<Input>, record: EnvRecord<Input>): EnvRecord<Input>;
function evolve <K extends keyof EnvRecord<any>>(transformations: Transformations<any>, record?: EnvRecord<any>): EnvRecord<any> | (<Input>(record: EnvRecord<Input>) => EnvRecord<Input>) {
  const go = <Input>(record: EnvRecord<Input>): EnvRecord<Input> => {
    return (Object.keys (record) as Array<K>).reduce ((acc, key) => {
      const transformation = transformations[key];
      if (transformation) {
        acc[key] = transformation (get (key) (record));
      } else {
        acc[key] = record[key];
      }
      return acc;
    }, {} as typeof record);
  };

  return !record ? go : go (record);
}

export default evolve;