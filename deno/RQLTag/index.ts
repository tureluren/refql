import JBOInterpreter from "../JBOInterpreter/index.ts";
import Parser from "../Parser/index.ts";
import isRel from "../Rel/isRel.ts";
import isSub from "../Sub/isSub.ts";
import {
  AST, JsonBuildObject,
  RefQLConfig, RQLValue, Values
} from "../types.ts";

class RQLTag {
  string: string;
  keys: RQLValue[];

  constructor(string: string, keys: RQLValue[]) {
    this.string = string;
    this.keys = keys;
  }

  include(snip: any) {
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

    return new RQLTag (nextString, nextKeys);
  }

  compile(config: RefQLConfig): [string, Values, AST] {
    const parser = new Parser (
      config.caseType,
      config.caseTypeJS,
      config.pluralize,
      config.plurals
    );
    const ast = parser.parse (this.string, this.keys);
    const interpreter = new JBOInterpreter (config.refs, config.useSmartAlias);

    // @ts-ignore
    const [query, values] = interpreter.interpret (ast);

    return [query, values, ast];
  }

  static transform<T>(_config: RefQLConfig, rows: JsonBuildObject<T>[]) {
    return rows.map (r => r.json_build_object);
  }
}

export default RQLTag;