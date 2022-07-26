import convertObject from "../more/convertObject";
import isRel from "../Rel/isRel";
import isSub from "../Sub/isSub";
import Table from "../Table";
import { CompiledQuery, RefQLConfig, RefsNew, Values } from "../types";
import compileSQLTag from "./compileSQLTag";
import isSQLTag from "./isSQLTag";

class SQLTag <Input> {
  strings: TemplateStringsArray;
  keys: Values;

  constructor(strings: TemplateStringsArray, keys: Values) {
    this.strings = strings;
    this.keys = keys;
  }

  concat<Input2>(other: SQLTag<Input2>) {
    const tag1Strings = Array.from (this.strings);
    const lastEl = tag1Strings.pop ();

    const tag2Strings = Array.from (other.strings);
    const firstEl = tag2Strings.shift ();

    const nextStrings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
    const nextKeys = this.keys.concat (other.keys);

    return new SQLTag<Input & Input2> (
      nextStrings as unknown as TemplateStringsArray, nextKeys
    );
  }

  run<Output>(config: RefQLConfig, params: Input): Promise<Output[]> {

    const [query, values] = this.interpret (params);
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

  interpret(params: Input) {
    return compileSQLTag<Input> (this, 0, params);
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