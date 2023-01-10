import Tokenizer from "./Tokenizer";

describe ("Tokenizer type", () => {
  test ("create Tokenizer", () => {
    const tokenizer = new Tokenizer ("id first_name");
    expect (tokenizer.str).toBe ("id first_name");
    expect (tokenizer.idx).toBe (0);
  });

  test ("whitespace", () => {
    const tokenizer = new Tokenizer ("  ");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "EOT", x: "EOT" });
  });

  test ("cast", () => {
    const tokenizer = new Tokenizer ("::");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "::", x: "::" });
  });

  test ("symbols, delimiters", () => {
    const tokenizer = new Tokenizer (": ( ) ,");
    expect (tokenizer.getNextToken ()).toEqual ({ type: ":", x: ":" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "(", x: "(" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: ")", x: ")" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: ",", x: "," });
  });

  test ("variables", () => {
    const tokenizer = new Tokenizer ("$");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "VARIABLE", x: "$" });
  });

  test ("booleans", () => {
    const tokenizer = new Tokenizer ("true false");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "true", x: "true" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "false", x: "false" });
  });

  test ("identifiers", () => {
    const tokenizer = new Tokenizer ("* id first_name");
    expect (tokenizer.getNextToken ()).toEqual ({ type: "*", x: "*" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "IDENTIFIER", x: "id" });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "IDENTIFIER", x: "first_name" });
  });

  test ("strings", () => {
    const tokenizer = new Tokenizer (`"foo" 'bar'`);
    expect (tokenizer.getNextToken ()).toEqual ({ type: "STRING", x: '"foo"' });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "STRING", x: "'bar'" });
  });

  test ("comments", () => {
    const tokenizer = new Tokenizer (`
      //
      // $
      // $ $
    `);
    expect (tokenizer.getNextToken ()).toEqual ({ type: "COMMENT", x: "//", skipCount: 0 });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "COMMENT", x: "//", skipCount: 1 });
    expect (tokenizer.getNextToken ()).toEqual ({ type: "COMMENT", x: "//", skipCount: 2 });
  });

  test ("unexpected token", () => {
    const tokenizer = new Tokenizer ("&");
    expect (() => tokenizer.getNextToken ())
      .toThrowError (new SyntaxError ('Unexpected token: "&"'));
  });
});