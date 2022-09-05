import RQLTag from "../RQLTag/index.ts";
import { Querier, RefQLValue } from "../types.ts";
import compileSQLTag from "./compileSQLTag.ts";
import formatTLString from "./formatTLString.ts";

class SQLTag<Params> {
  strings: string[];
  values: RefQLValue<Params>[];

  constructor(strings: string[], values: RefQLValue<Params>[]) {
    this.strings = strings.map (formatTLString);
    this.values = values;
  }

  concat<Params2>(other: RQLTag<Params2> | SQLTag<Params2>): SQLTag<Params & Params2> {
    if (other instanceof RQLTag) {
      return new SQLTag<Params & Params2> (this.strings, this.values);
    }
    const tag1Strings = Array.from (this.strings);
    const lastEl = tag1Strings.pop ();

    const tag2Strings = Array.from (other.strings);
    const firstEl = tag2Strings.shift ();

    const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
    const values = (this.values as RefQLValue<Params & Params2>[]).concat (other.values);

    return new SQLTag<Params & Params2> (
      strings, values
    );
  }

  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]> {
    return new Promise ((res, rej) => {
      let query, values;

      try {
        [query, values] = compileSQLTag<Params> (this, 0, params);
      } catch (err: any) {
        rej (err);
        return;
      }

      querier (query, values).then (res).catch (rej);
    });
  }

  static of<Params>(strings: string[], values: RefQLValue<Params>[]) {
    return new SQLTag<Params> (strings, values);
  }
}

export default SQLTag;