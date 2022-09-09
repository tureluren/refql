import { Querier, RefQLValue } from "../types";
import compileSQLTag from "./compileSQLTag";
import formatTLString from "./formatTLString";

class SQLTag<Params> {
  strings: string[];
  values: RefQLValue<Params>[];

  constructor(strings: string[], values: RefQLValue<Params>[]) {
    this.strings = strings.map (formatTLString);
    this.values = values;
  }

  concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2> {
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

  map<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]) {
    return new SQLTag<Params2> (this.strings, f (this.values));
  }

  ["fantasy-land/map"]<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2> {
    return this.map (f);
  }

  mapLeft(f: (strings: string[]) => string[]) {
    return new SQLTag<Params> (f (this.strings), this.values);
  }

  bimap<Params2>(g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]) {
    return new SQLTag<Params2> (g (this.strings), f (this.values));
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