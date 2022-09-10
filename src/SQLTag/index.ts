import { Querier, RefQLValue } from "../types";
import compileSQLTag from "./compileSQLTag";
import formatTLString from "./formatTLString";

// class SQLTagOld<Params> {
//   strings: string[];
//   values: RefQLValue<Params>[];

//   constructor(strings: string[], values: RefQLValue<Params>[]) {
//     this.strings = strings.map (formatTLString);
//     this.values = values;
//   }

//   concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2> {
//     const tag1Strings = Array.from (this.strings);
//     const lastEl = tag1Strings.pop ();

//     const tag2Strings = Array.from (other.strings);
//     const firstEl = tag2Strings.shift ();

//     const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
//     const values = (this.values as RefQLValue<Params & Params2>[]).concat (other.values);

//     return new SQLTag<Params & Params2> (
//       strings, values
//     );
//   }

//   map<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]) {
//     return new SQLTag<Params2> (this.strings, f (this.values));
//   }

//   ["fantasy-land/map"]<Params2>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2> {
//     return this.map (f);
//   }

//   mapLeft(f: (strings: string[]) => string[]) {
//     return new SQLTag<Params> (f (this.strings), this.values);
//   }

//   bimap<Params2>(g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]) {
//     return new SQLTag<Params2> (g (this.strings), f (this.values));
//   }

//   run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]> {
//     return new Promise ((res, rej) => {
//       let query, values;

//       try {
//         [query, values] = compileSQLTag<Params> (this, 0, params);
//       } catch (err: any) {
//         rej (err);
//         return;
//       }

//       querier (query, values).then (res).catch (rej);
//     });
//   }

//   static of<Params>(strings: string[], values: RefQLValue<Params>[]) {
//     return new SQLTag<Params> (strings, values);
//   }
// }



interface SQLTag<Params = {}> {
  strings: string[];
  values: RefQLValue<Params>[];
  concat<Params2 = {}>(other: SQLTag<Params2>): SQLTag<Params & Params2>;
  map<Params2 = {}>(f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  "fantasy-land/map": typeof map;
  mapLeft(f: (strings: string[]) => string[]): SQLTag<Params>;
  bimap<Params2 = {}>(g: (strings: string[]) => string[], f: (values: RefQLValue<Params>[]) => RefQLValue<Params2>[]): SQLTag<Params2>;
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
}

const prototype = {
  constructor: SQLTag,
  concat, map, "fantasy-land/map": map,
  mapLeft, bimap, run
};

function SQLTag<Params = {}>(strings: string[], values: RefQLValue<Params>[]) {
  let tag: SQLTag<Params> = Object.create (prototype);
  tag.strings = strings.map (formatTLString);
  tag.values = values;

  return tag;
}

function concat(this: SQLTag, other: SQLTag): SQLTag {
  const tag1Strings = Array.from (this.strings);
  const lastEl = tag1Strings.pop ();

  const tag2Strings = Array.from (other.strings);
  const firstEl = tag2Strings.shift ();

  const strings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
  const values = this.values.concat (other.values);

  return SQLTag (strings, values);
}

function map(this: SQLTag, f: (values: RefQLValue[]) => RefQLValue[]) {
  return SQLTag (this.strings, f (this.values));
}

function mapLeft(this: SQLTag, f: (strings: string[]) => string[]) {
  return SQLTag (f (this.strings), this.values);
}

function bimap(this: SQLTag, g: (strings: string[]) => string[], f: (values: RefQLValue[]) => RefQLValue[]) {
  return SQLTag (g (this.strings), f (this.values));
}

function run <Params>(this: SQLTag<Params>, querier: Querier, params: Params) {
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

SQLTag.isSQLTag = function <Params = {}> (value: any): value is SQLTag<Params> {
  return value.constructor == SQLTag;
};

export default SQLTag;