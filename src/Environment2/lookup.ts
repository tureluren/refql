import { EnvRecord } from "../types";

const lookup = <K extends keyof EnvRecord>(prop: K) => (record: EnvRecord): NonNullable<EnvRecord[K]> => {
  if (record.hasOwnProperty (prop)) {
    return record[prop]!;
  }
  throw new ReferenceError (`Variable "${prop}" is undefined`);
};

export default lookup;