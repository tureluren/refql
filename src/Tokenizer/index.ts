import { Token, TokenType } from "../types";

const tokens: [RegExp, TokenType | null][] = [
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
  [/^\*/, "*"],
  [/^\w+\./, "SCHEMA"],
  [/^\w+/, "IDENTIFIER"],

  // Strings
  [/^"[^"]*"/, "STRING"],
  [/^'[^']*'/, "STRING"]
];

class Tokenizer {
  str: string;
  idx: number;

  constructor(str: string) {
    this.str = str;
    this.idx = 0;
  }

  hasMoreTokens() {
    return this.idx < this.str.length;
  }

  getNextToken(): Token {
    if (!this.hasMoreTokens ()) {
      return { type: "EOF", value: "EOF" };
    }

    const str = this.str.slice (this.idx);

    for (const [regexp, tokenType] of tokens) {
      const tokenValue = this.match (regexp, str);

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

    throw new SyntaxError (`Unexpected token: "${str[0]}"`);
  }

  match(regexp: RegExp, str: string) {
    const matched = regexp.exec (str);

    if (matched == null) {
      return null;
    }

    this.idx += matched[0].length;
    return matched[0];
  }

  static of(str: string) {
    return new Tokenizer (str);
  }
}

export default Tokenizer;