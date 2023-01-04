export type TokenType =
  | "::" | ":" | "(" | ")" | "," | "COMMENT" | "VARIABLE"
  | "true" | "false" | "null" | "NUMBER"
  | "*" | "IDENTIFIER" | "STRING" | "EOT";

export type Token = {
  type: TokenType | null;
  value: string;
  skipCount?: number;
};

const tokens: [RegExp, TokenType | null][] = [
  // Whitespace
  [/^\s+/, null],

  // Cast
  [/^::/, "::"],

  // Symbols, delimiters
  [/^:/, ":"],
  [/^\(/, "("],
  [/^\)/, ")"],
  [/^,/, ","],

  // Comment
  [/^\/\//, "COMMENT"],

  // Variables
  [/^\$/, "VARIABLE"],

  // Booleans
  [/^\btrue\b/, "true"],
  [/^\bfalse\b/, "false"],

  // Null
  [/^\bnull\b/, "null"],

  // Numbers
  [/^\d+/, "NUMBER"],

  // Identifiers
  [/^\*/, "*"],
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
      return { type: "EOT", value: "EOT" };
    }

    const str = this.str.slice (this.idx);

    for (const [regexp, tokenType] of tokens) {
      const tokenValue = this.match (regexp, str);
      let skipCount;

      // no match
      if (tokenValue == null) {
        continue;
      }

      // skip whitespace
      if (tokenType == null) {
        return this.getNextToken ();
      }

      // comment out line
      if (tokenType === "COMMENT") {
        let newlineIdx = str.indexOf ("\n");
        if (newlineIdx < 0) {
          newlineIdx = str.length;
        }
        skipCount = (str.slice (0, newlineIdx).match (/\$/g) || []).length;
        this.idx += newlineIdx - 1;
      }

      return {
        type: tokenType,
        value: tokenValue,
        skipCount
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
}

export default Tokenizer;