import { Querier, RQLValue } from "../types";
import compileSqlTag from "./compileSqlTag";
import formatTlString from "./formatTlString";

class SqlTag<Params> {
  strings: string[];
  values: RQLValue<Params>[];

  constructor(strings: string[], values: RQLValue<Params>[]) {
    this.strings = strings.map (formatTlString);
    this.values = values;
  }

  concat<Params2>(other: SqlTag<Params2>): SqlTag<Params & Params2> {
    const tag1Strings = Array.from (this.strings);
    const lastEl = tag1Strings.pop ();

    const tag2Strings = Array.from (other.strings);
    const firstEl = tag2Strings.shift ();

    const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
    const values = (this.values as RQLValue<Params & Params2>[]).concat (other.values);

    return new SqlTag<Params & Params2> (
      strings, values
    );
  }

  interpret(params: Params) {
    return compileSqlTag<Params> (this, 0, params);
  }

  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]> {
    return new Promise ((res, rej) => {
      let query, values;

      try {
        [query, values] = this.interpret (params);
      } catch (err: any) {
        rej (err);
        return;
      }

      querier (query, values).then (res).catch (rej);
    });

  }

  static of<Params>(strings: string[], values: RQLValue<Params>[]) {
    return new SqlTag<Params> (strings, values);
  }
}

export default SqlTag;