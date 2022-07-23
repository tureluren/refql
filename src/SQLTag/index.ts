import convertObject from "../more/convertObject";
import isRel from "../Rel/isRel";
import isSub from "../Sub/isSub";
import Table from "../Table";
import { CompiledQuery, RefQLConfig, RefsNew, Values } from "../types";
import compileSQLTag from "./compileSQLTag";
import isSQLTag from "./isSQLTag";

class SQLTag <Input, Output> {
  strings: TemplateStringsArray;
  keys: Values;

  constructor(strings: TemplateStringsArray, keys: Values) {
    this.strings = strings;
    this.keys = keys;
  }

  concat<Input2, Output2>(other: SQLTag<Input2, Output2>) {
    const keys = this.keys.concat (other.keys);
    const strings = this.strings.concat (other.strings);


    return new SQLTag<Input & Input2, Output> (
      strings as unknown as TemplateStringsArray, keys
    );
  }

  run(config: RefQLConfig, params: Input): Promise<Output[]> {

    const [query, values] = this.interpret ();
    console.log (query);


    return config.querier (query, values);
  }

  // include(snip: any) {
  //   if (isRel (snip)) {
  //     throw new Error ("You can't use a Rel inside SQL Tags");
  //   }

  //   if (isSub (snip)) {
  //     throw new Error ("You can't use a Subselect inside SQL Tags");
  //   }

  //   let nextStrings, nextKeys;

  //   if (isSQLTag (snip)) {
  //     const tag1Strings = Array.from (this.strings);
  //     const lastEl = tag1Strings.pop ();

  //     const tag2Strings = Array.from (snip.strings);
  //     const firstEl = tag2Strings.shift ();

  //     nextStrings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
  //     nextKeys = this.keys.concat (snip.keys);
  //   } else {
  //     nextStrings = this.strings.concat ("");
  //     nextKeys = this.keys.concat (snip);
  //   }

  //   return new SQLTag (nextStrings as any, nextKeys);
  // }

  interpret() {
    return compileSQLTag<Input, Output> (this, 0);
  }

  compile(_config: RefQLConfig): CompiledQuery {
    // const [query, values] = this.interpret ();
    // return { query, values, next: [], table: {} as Table };
    return {} as CompiledQuery;
  }

  // static transform<T>(config: RefQLConfig, rows: T[]) {
  //   return rows.map (r => convertObject (config.caseTypeJS, r));
  // }
}

export default SQLTag;