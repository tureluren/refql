import Tokenizer from ".";

describe ("Tokenizer type", () => {
  test ("init Tokenizer", () => {
    const tokenizer = new Tokenizer ();

    tokenizer.init ("select id");

    expect (tokenizer.string).toBe ("select id");
    expect (tokenizer.cursor).toBe (0);
  });

  test ("match whitespace", () => {
    const tokenizer = new Tokenizer ();

    tokenizer.init ("  ");

    const string = tokenizer.string.slice (tokenizer.cursor);

    expect (tokenizer.match (/^\s+/, string)).toBe ("  ");
  });

  test ("match cast", () => {
    const tokenizer = new Tokenizer ();

    expect (tokenizer.match (/^::/, "::")).toBe ("::");
  });

  test ("match symbols, delimiters", () => {
    const tokenizer = new Tokenizer ();
    const symbols: [RegExp, string][] = [
      [/^:/, ":"],
      [/^\{/, "{"],
      [/^\}/, "}"],
      [/^\(/, "("],
      [/^\)/, ")"],
      [/^,/, ","]
    ];

    symbols.forEach (symbol => {
      expect (tokenizer.match (symbol[0], symbol[1])).toBe (symbol[1]);
    });
  });

  test ("match variable", () => {
    const tokenizer = new Tokenizer ();

    expect (tokenizer.match (/^\$/, "$")).toBe ("$");
  });

  test ("match booleans", () => {
    const tokenizer = new Tokenizer ();
    const symbols: [RegExp, string][] = [
      [/^\btrue\b/, "true"],
      [/^\bfalse\b/, "false"]
    ];

    symbols.forEach (symbol => {
      expect (tokenizer.match (symbol[0], symbol[1])).toBe (symbol[1]);
    });
  });

  test ("match null", () => {
    const tokenizer = new Tokenizer ();

    expect (tokenizer.match (/^\bnull\b/, "null")).toBe ("null");
  });

  test ("match numbers", () => {
    const tokenizer = new Tokenizer ();

    expect (tokenizer.match (/^\d+/, "1")).toBe ("1");
    expect (tokenizer.match (/^\d+/, "10")).toBe ("10");
    expect (tokenizer.match (/^\d+/, "100")).toBe ("100");
    expect (tokenizer.match (/^\d+/, "5")).toBe ("5");
    expect (tokenizer.match (/^\d+/, "55")).toBe ("55");
    expect (tokenizer.match (/^\d+/, "555")).toBe ("555");
  });

  test ("match reference symbols", () => {
    const tokenizer = new Tokenizer ();
    const symbols: [RegExp, string][] = [
      [/^</, "<"],
      [/^-/, "-"],
      [/^x/, "x"],
      [/^&/, "&"]
    ];

    symbols.forEach (symbol => {
      expect (tokenizer.match (symbol[0], symbol[1])).toBe (symbol[1]);
    });
  });

  test ("match SQL keywords", () => {
    const tokenizer = new Tokenizer ();

    const keywords = [
      "and", "AND", "as", "As", "from", "or",
      "order by", "ORDER BY", "select", "where"
    ];

    keywords.forEach (keyword => {
      expect (
        tokenizer.match (/^\b(and|as|from|or|order\s+by|select|where)\b/i, keyword)
      ).toBe (keyword);
    });

  });

  test ("match identifier", () => {
    const tokenizer = new Tokenizer ();

    expect (tokenizer.match (/^\w+/, "player")).toBe ("player");
  });

  test ("match strings", () => {
    const tokenizer = new Tokenizer ();

    expect (tokenizer.match (/^"[^"]*"/, '"id"')).toBe ('"id"');
    expect (tokenizer.match (/^'[^']*'/, "'id'")).toBe ("'id'");
  });

  test ("`getNextToken` returns next token", () => {
    const tokenizer = new Tokenizer ();
    tokenizer.init ("id firstName lastName");

    let lookahead = tokenizer.getNextToken ();
    expect (lookahead).toEqual ({ type: "IDENTIFIER", value: "id" });

    lookahead = tokenizer.getNextToken ();
    expect (lookahead).toEqual ({ type: "IDENTIFIER", value: "firstName" });

    lookahead = tokenizer.getNextToken ();
    expect (lookahead).toEqual ({ type: "IDENTIFIER", value: "lastName" });

    lookahead = tokenizer.getNextToken ();
    expect (lookahead).toEqual ({ type: "EOF", value: "EOF" });
  });

  test ("`getNextToken` skips spaces", () => {
    const tokenizer = new Tokenizer ();
    tokenizer.init ("  ");

    const lookahead = tokenizer.getNextToken ();
    expect (lookahead).toEqual ({ type: "EOF", value: "EOF" });
  });

  test ("`getNextToken` throws Error when unmatched token occurs", () => {
    const tokenizer = new Tokenizer ();
    tokenizer.init ("%");

    expect (
      () => tokenizer.getNextToken ()
    ).toThrowError (new SyntaxError ('Unexpected token: "%"'));
  });

  test ("`hasMoreTokens` returns true if there are more tokens", () => {
    const tokenizer = new Tokenizer ();
    // identifier
    tokenizer.init ("id");
    expect (tokenizer.hasMoreTokens ()).toBe (true);
    tokenizer.getNextToken ();
    expect (tokenizer.hasMoreTokens ()).toBe (false);
  });
});