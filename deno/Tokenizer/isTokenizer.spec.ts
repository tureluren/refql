import Tokenizer from ".";
import isTokenizer from "./isTokenizer";

describe ("Tokenizer `isTokenizer` - detects if a given value is a Tokenizer", () => {
  test ("Tokenizer detected", () => {
    const tokenizer = new Tokenizer ();

    expect (isTokenizer (tokenizer)).toBe (true);
  });
});