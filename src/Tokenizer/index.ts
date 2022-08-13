import { Spec, Token } from "../types";

const spec: Spec = [
  // Whitespace
  [/^\s+/, null],

  // Cast
  [/^::/, "::"],

  // Symbols, delimiters
  [/^:/, ":"],
  [/^\{/, "{"],
  [/^\}/, "}"],
  [/^\(/, "("],
  [/^\)/, ")"],
  [/^,/, ","],

  // Variables
  [/^\$/, "VARIABLE"],

  // Booleans
  [/^\btrue\b/, "true"],
  [/^\bfalse\b/, "false"],

  // Null
  [/^\bnull\b/, "null"],

  // Numbers
  [/^\d+/, "NUMBER"],

  // Reference symbols
  [/^</, "<"],
  [/^-/, "-"],
  [/^x\b/, "x"],

  // Identifiers
  [/^\w+/, "IDENTIFIER"],

  // Strings
  [/^"[^"]*"/, "STRING"],
  [/^'[^']*'/, "STRING"]
];

class Tokenizer {
  string!: string;
  cursor!: number;

  init(string: string) {
    this.string = string;
    this.cursor = 0;
  }

  hasMoreTokens() {
    return this.cursor < this.string.length;
  }

  getNextToken(): Token {
    if (!this.hasMoreTokens ()) {
      return { type: "EOF", value: "EOF" };
    }

    const string = this.string.slice (this.cursor);

    for (const [regexp, tokenType] of spec) {
      const tokenValue = this.match (regexp, string);

      // no match
      if (tokenValue == null) {
        continue;
      }

      // skip whitespace
      if (tokenType == null) {
        return this.getNextToken ();
      }

      return {
        type: tokenType,
        value: tokenValue
      };
    }

    throw new SyntaxError (`Unexpected token: "${string[0]}"`);
  }

  match(regexp: RegExp, string: string) {
    const matched = regexp.exec (string);

    if (matched == null) {
      return null;
    }

    this.cursor += matched[0].length;
    return matched[0];
  }

}
export default Tokenizer;