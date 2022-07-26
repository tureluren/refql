import { EnvRecord } from "../types";

const lookup = <Input, K extends keyof EnvRecord<Input>>(prop: K) => (record: EnvRecord<Input>): NonNullable<EnvRecord<Input>[K]> => {
  if (record.hasOwnProperty (prop)) {
    return record[prop]!;
  }
  throw new ReferenceError (`Variable "${prop}" is undefined`);
};

export default lookup;