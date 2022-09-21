import { flBimap, flConcat, flMap, refqlType } from "../common/consts";
import { Querier, RefQLValue, StringMap } from "../common/types";
import compileSQLTag from "./compileSQLTag";
import formatTLString from "./formatTLString";

interface SQLTag<Params> {
  strings: string[];
  values: RefQLValue<Params>[];
  concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2>;
  map<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  mapLeft(f: (strings: string[]) => string[]): SQLTag<Params>;
  bimap<Params2>(g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
  [flConcat]: SQLTag<Params>["concat"];
  [flMap]: SQLTag<Params>["map"];
  [flBimap]: SQLTag<Params>["bimap"];
}

const sqlTagType = "refql/SQLTag";

const prototype = {
  constructor: SQLTag,
  [refqlType]: sqlTagType,
  concat, [flConcat]: concat,
  map, [flMap]: map,
  bimap, [flBimap]: bimap,
  mapLeft, run
};

function SQLTag<Params>(strings: string[], values: RefQLValue<Params>[]) {
  let tag: SQLTag<Params> = Object.create (prototype);
  tag.strings = strings.map (formatTLString);
  tag.values = values;

  return tag;
}

function concat(this: SQLTag<unknown>, other: SQLTag<unknown>) {
  const tag1Strings = Array.from (this.strings);
  const lastEl = tag1Strings.pop ();

  const tag2Strings = Array.from (other.strings);
  const firstEl = tag2Strings.shift ();

  const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
  const values = this.values.concat (other.values);

  return SQLTag (strings, values);
}

function map(this: SQLTag<unknown>, f: (values: RefQLValue<unknown>[]) => RefQLValue<unknown>[]) {
  return SQLTag<unknown> (this.strings, f (this.values));
}

function mapLeft(this: SQLTag<unknown>, f: (strings: string[]) => string[]) {
  return SQLTag (f (this.strings), this.values);
}

function bimap(this: SQLTag<unknown>, g: (strings: string[]) => string[], f: (values: RefQLValue<unknown>[]) => RefQLValue<unknown>[]) {
  return SQLTag (g (this.strings), f (this.values));
}

function run(this: SQLTag<unknown>, querier: Querier<StringMap>, params: unknown) {
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
  return value != null && value[refqlType] === sqlTagType;
};

export default SQLTag;