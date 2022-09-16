import { flBimap, flConcat, flMap, refqlType } from "../common/consts";
import { Querier, RefQLValue } from "../common/types";
import compileSQLTag from "./compileSQLTag";
import formatTLString from "./formatTLString";

interface SQLTag<Params> {
  strings: string[];
  values: RefQLValue<Params>[];
  concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2>;
  [flConcat]: SQLTag<Params>["concat"];
  map<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  [flMap]: SQLTag<Params>["map"];
  mapLeft(f: (strings: string[]) => string[]): SQLTag<Params>;
  bimap<Params2>(g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  [flBimap]: SQLTag<Params>["bimap"];
  map<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
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

function concat<Params, Params2>(this: SQLTag<Params>, other: SQLTag<Params2>) {
  const tag1Strings = Array.from (this.strings);
  const lastEl = tag1Strings.pop ();

  const tag2Strings = Array.from (other.strings);
  const firstEl = tag2Strings.shift ();

  const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
  const values = this.values.concat (other.values);

  return SQLTag<Params & Params2> (strings, values);
}

function map<Params, Params2>(this: SQLTag<Params>, f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]) {
  return SQLTag<Params2> (this.strings, f (this.values));
}

function mapLeft<Params>(this: SQLTag<Params>, f: (strings: string[]) => string[]) {
  return SQLTag (f (this.strings), this.values);
}

function bimap<Params, Params2>(this: SQLTag<Params>, g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]) {
  return SQLTag<Params2> (g (this.strings), f (this.values));
}

function run<Params, Return>(this: SQLTag<Params>, querier: Querier<Return>, params: Params) {
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