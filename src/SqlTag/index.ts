import convertObject from "../more/convertObject";
import isRel from "../Rel/isRel";
import isSub from "../Sub/isSub";
import Table from "../Table";
import { Querier, Rec, RefQLConfig, Refs, RQLValue } from "../types";
import compileSqlTag from "./compileSqlTag";
import isSqlTag from "./isSqlTag";

class SqlTag <Input > {
  strings: TemplateStringsArray;
  keys: RQLValue<Input>[];

  constructor(strings: TemplateStringsArray, keys: RQLValue<Input>[]) {
    this.strings = strings;
    this.keys = keys;
  }

  concat<Input2 >(other: SqlTag<Input2>) {
    const tag1Strings = Array.from (this.strings);
    const lastEl = tag1Strings.pop ();

    const tag2Strings = Array.from (other.strings);
    const firstEl = tag2Strings.shift ();

    const nextStrings = tag1Strings.concat (lastEl + " " + firstEl).concat (tag2Strings);
    const nextKeys: RQLValue<Input & Input2>[] = (<RQLValue<Input & Input2>[]> this.keys).concat (other.keys);

    return new SqlTag<Input & Input2> (
      nextStrings as unknown as TemplateStringsArray, nextKeys
    );
  }

  run<Output>(_config: RefQLConfig, querier: Querier<Output>, params: Input): Promise<Output[]> {

    const [query, values] = this.interpret (params);
    console.log (query);

    return querier (query, values);
  }

  // include(snip: any) {
  //   if (isRel (snip)) {
  //     throw new Error ("You can't use a Rel inside SQL Tags");
  //   }

  //   if (isSub (snip)) {
  //     throw new Error ("You can't use a Subselect inside SQL Tags");
  //   }

  //   let nextStrings, nextKeys;

  //   if (isSqlTag (snip)) {
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

  //   return new SqlTag (nextStrings as any, nextKeys);
  // }

  interpret(params: Input) {
    return compileSqlTag<Input> (this, 0, params, {} as Table);
  }

  compile(_config: RefQLConfig): Rec<Input> {
    // const [query, values] = this.interpret ();
    // return { query, values, next: [], table: {} as Table };
    return {} as Rec<Input>;
  }

  // static transform<T>(config: RefQLConfig, rows: T[]) {
  //   return rows.map (r => convertObject (config.caseTypeJS, r));
  // }
}

export default SqlTag;