import { Querier, RefQLValue, StringMap } from "../types";
import compileSQLTag from "./compileSQLTag";
import formatTLString from "./formatTLString";

interface SQLTag<Params = {}> {
  strings: string[];
  values: RefQLValue<Params>[];
  concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2>;
  map(f: (values: RefQLValue<Params>[]) => RefQLValue<Params>[]): SQLTag<Params>;
  "fantasy-land/map": typeof map;
  mapLeft(f: (strings: string[]) => string[]): SQLTag<Params>;
  bimap(g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params>[]): SQLTag<Params>;
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
}

const prototype = {
  constructor: SQLTag,
  concat, map, "fantasy-land/map": map,
  mapLeft, bimap, run
};

function SQLTag<Params = {}>(strings: string[], values: RefQLValue<Params>[]) {
  let tag: SQLTag<Params> = Object.create (SQLTag.prototype);
  tag.strings = strings.map (formatTLString);
  tag.values = values;

  return tag;
}

SQLTag.prototype = Object.create (prototype);

function concat(this: SQLTag, other: SQLTag): SQLTag {
  const tag1Strings = Array.from (this.strings);
  const lastEl = tag1Strings.pop ();

  const tag2Strings = Array.from (other.strings);
  const firstEl = tag2Strings.shift ();

  const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
  const values = this.values.concat (other.values);

  return SQLTag (strings, values);
}

function map(this: SQLTag, f: (values: any[]) => any[]) {
  return SQLTag (this.strings, f (this.values));
}

function mapLeft(this: SQLTag, f: (strings: string[]) => string[]) {
  return SQLTag (f (this.strings), this.values);
}

function bimap(this: SQLTag, g: (strings: string[]) => string[], f: (values: any[]) => any[]) {
  return SQLTag (g (this.strings), f (this.values));
}

function run(this: SQLTag, querier: Querier, params: StringMap) {
  return new Promise ((res, rej) => {
    let query, values;

    try {
      [query, values] = compileSQLTag (this, 0, params);
    } catch (err: any) {
      rej (err);
      return;
    }

    querier (query, values).then (res).catch (rej);
  });
}

SQLTag.isSQLTag = function <Params> (value: any): value is SQLTag<Params> {
  return value instanceof SQLTag;
};

export default SQLTag;