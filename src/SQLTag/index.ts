import convertObject from "../more/convertObject";
import isRel from "../Rel/isRel";
import isSub from "../Sub/isSub";
import { RefQLConfig, TableType, Values } from "../types";
import compileSQLTag from "./compileSQLTag";
import isSQLTag from "./isSQLTag";

// const prototype: Omit<SQLTag, "strings" | "keys"> = {
//   // @ts-ignore
//   constructor: SQLTag,
//   "@@rql/type": "SQLTag",
//   include,
//   interpret,
//   compile
// };

class SQLTag {
  strings: TemplateStringsArray;
  keys: Values;

  constructor(strings: TemplateStringsArray, keys: Values) {
    this.strings = strings;
    this.keys = keys;
  }

  include(snip) {
    if (isRel (snip)) {
      throw new Error ("You can't use a Rel inside SQL Tags");
    }

    if (isSub (snip)) {
      throw new Error ("You can't use a Subselect inside SQL Tags");
    }

    let nextStrings, nextKeys;

    if (isSQLTag (snip)) {
      const tag1Strings = Array.from (this.strings);
      const lastEl = tag1Strings.pop ();

      const tag2Strings = Array.from (snip.strings);
      const firstEl = tag2Strings.shift ();

      nextStrings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
      nextKeys = this.keys.concat (snip.keys);
    } else {
      nextStrings = this.strings.concat ("");
      nextKeys = this.keys.concat (snip);
    }

    return new SQLTag (nextStrings, nextKeys);
  };

  interpret(): [string, Values] {
    return compileSQLTag (this, 0);
  };

  compile(_config): [string, Values, TableType?] {
    return this.interpret ();
  };

  static transform = function<T> (config: RefQLConfig, rows: T[]) {
    return rows.map (r => convertObject (config.caseTypeJS, r));
  };
}

export default SQLTag;