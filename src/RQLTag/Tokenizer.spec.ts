import Tokenizer from "./Tokenizer";

describe ("Tokenizer type", () => {
  test ("create Tokenizer", () => {
    const tokenizer = new Tokenizer ("id first_name");
    expect (tokenizer.str).toBe ("id first_name");
    expect (tokenizer.idx).toBe (0);
  });

  test ("whitespace", () => {
    const tokenizer = new Tokenizer ("  ");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "EOT", value: "EOT" });
  });

  test ("cast", () => {
    const tokenizer = new Tokenizer ("::");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "::", value: "::" });
  });

  test ("symbols, delimiters", () => {
    const tokenizer = new Tokenizer (": ( ) ,");
    expect (tokenizer.getNextToken ()).toEqual ({ type: ":", value: ":" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "(", value: "(" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: ")", value: ")" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: ",", value: "," });
  });

  test ("variables", () => {
    const tokenizer = new Tokenizer ("$");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "VARIABLE", value: "$" });
  });

  test ("booleans", () => {
    const tokenizer = new Tokenizer ("true false");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "true", value: "true" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "false", value: "false" });
  });

  test ("identifiers", () => {
    const tokenizer = new Tokenizer ("* public.player");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "*", value: "*" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "SCHEMA", value: "public." });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "IDENTIFIER", value: "player" });
  });

  test ("strings", () => {
    const tokenizer = new Tokenizer (`"foo" 'bar'`);
    expect (tokenizer.getNextToken ()).toEqual ({ type: "STRING", value: '"foo"' });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "STRING", value: "'bar'" });
  });

  test ("unexpected token", () => {
    const tokenizer = new Tokenizer ("&");
    expect (() => tokenizer.getNextToken ())
      .toThrowError (new SyntaxError ('Unexpected token: "&"'));
  });
});