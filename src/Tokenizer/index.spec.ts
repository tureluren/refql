import Tokenizer from ".";

describe ("Tokenizer type", () => {
  test ("create Tokenizer", () => {
    const tokenizer = Tokenizer.of ("player { }");
    expect (tokenizer.str).toBe ("player { }");
    expect (tokenizer.idx).toBe (0);
  });

  test ("whitespace", () => {
    const tokenizer = Tokenizer.of ("  ");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "EOF", value: "EOF" });
  });

  test ("cast", () => {
    const tokenizer = Tokenizer.of ("::");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "::", value: "::" });
  });

  test ("symbols, delimiters", () => {
    const tokenizer = Tokenizer.of (": { } ( ) ,");
    expect (tokenizer.getNextToken ()).toEqual ({ type: ":", value: ":" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "{", value: "{" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "}", value: "}" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "(", value: "(" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: ")", value: ")" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: ",", value: "," });
  });

  test ("variables", () => {
    const tokenizer = Tokenizer.of ("$");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "VARIABLE", value: "$" });
  });

  test ("booleans", () => {
    const tokenizer = Tokenizer.of ("true false");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "true", value: "true" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "false", value: "false" });
  });

  test ("references", () => {
    const tokenizer = Tokenizer.of ("< - x");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "<", value: "<" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "-", value: "-" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "x", value: "x" });
  });

  test ("identifiers", () => {
    const tokenizer = Tokenizer.of ("* public.player");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "*", value: "*" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "SCHEMA", value: "public." });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "IDENTIFIER", value: "player" });
  });

  test ("strings", () => {
    const tokenizer = Tokenizer.of (`"foo" 'bar'`);
    expect (tokenizer.getNextToken ()).toEqual ({ type: "STRING", value: '"foo"' });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "STRING", value: "'bar'" });
  });

  test ("unexpected token", () => {
    const tokenizer = Tokenizer.of ("&");
    expect (() => tokenizer.getNextToken ())
      .toThrowError (new SyntaxError ('Unexpected token: "&"'));
  });
});