import JBOInterpreter from "../JBOInterpreter";
import Parser from "../Parser";
import isRel from "../Rel/isRel";
import isSub from "../Sub/isSub";
import { JsonBuildObject, RefQLConfig, RQLTag, RQLValue, TableType, Values } from "../types";

const prototype: Omit<RQLTag, "string" | "keys"> = {
  // @ts-ignore
  constructor: RQLTag,
  "@@rql/type": "RQLTag",
  include,
  compile
};

function RQLTag(string: string, keys: RQLValue[]): RQLTag {
  const rqlTag = Object.create (prototype);
  rqlTag.string = string;
  rqlTag.keys = keys;
  return rqlTag;
}

function include(this: RQLTag, snip) {
  let nextString, nextKeys;

  if (isRel (snip)) {
    nextString = this.string
      .trim ()
      // replace last "}" to include the snippet, and insert }
      .replace (/\}$/, snip.symbol + " " + snip.tag.string.trim () + "}");

    nextKeys = this.keys.concat (snip.tag.keys);
  } else if (isSub (snip)) {
    nextString = this.string
      .trim ()
      .replace (/\}$/, "& " + snip.as + "$ }");

    nextKeys = this.keys.concat (snip.tag);
  } else {
    nextString = this.string.trim ().replace (/\}$/, "$}");
    nextKeys = this.keys.concat (snip);
  }

  return RQLTag (nextString, nextKeys);
};

function compile(this: RQLTag, config: RefQLConfig): [string, Values, TableType] {
  const parser = Parser (
    config.caseTypeDB,
    config.caseTypeJS,
    config.pluralize,
    config.plurals
  );
  const ast = parser.parse (this.string, this.keys);
  const interpreter = JBOInterpreter (config.refs, config.useSmartAlias);
  const [query, values] = interpreter.interpret (ast);

  return [query, values, ast];
};

// @ts-ignore
RQLTag.transform = function<T> (_config: RefQLConfig, rows: JsonBuildObject<T>[]) {
  return rows.map (r => r.json_build_object);
};

export default RQLTag;