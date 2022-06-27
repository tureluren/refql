import JBOInterpreter from "../JBOInterpreter";
import Interpreter from "../Interpreter";
import Parser from "../Parser";
import isRel from "../Rel/isRel";
import isSub from "../Sub/isSub";
import {
  AST, CompiledQuery, EnvRecord, JsonBuildObject,
  RefQLConfig, RQLValue, Values
} from "../types";

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

  compile(config: RefQLConfig): CompiledQuery {
    const parser = new Parser (
      config.caseTypeDB,
      config.caseTypeJS,
      config.pluralize,
      config.plurals
    );
    const ast = parser.parse (this.string, this.keys);
    // const interpreter = new JBOInterpreter (config.refs, config.useSmartAlias);
    const interpreter = new Interpreter (config.refs, config.useSmartAlias);

    // @ts-ignore
    const interpreted: EnvRecord = interpreter.interpret (ast);

    console.log (interpreted);

    // return [query, values, ast];
    return {
      query: interpreted.query || "",
      values: interpreted.values || [],
      next: interpreted.next
    };
  }

  static transform<T>(_config: RefQLConfig, rows: JsonBuildObject<T>[]) {
    // return rows.map (r => r.json_build_object);
    return rows;
  }
}

export default RQLTag;