import Parser from ".";
import { player, team } from "../test/tables";
import Tokenizer from "../Tokenizer";

describe ("Parser type", () => {
  test ("create Parser", () => {
    const str = "* $";
    const parser = new Parser (str, [team], player);
    const tokenizer = new Tokenizer (str);
    const lookahead = tokenizer.getNextToken ();

    expect (parser.str).toBe (str);
    expect (parser.idx).toBe (0);
    expect (parser.values).toEqual ([team]);
    expect (parser.tokenizer).toEqual (tokenizer);
    expect (parser.lookahead).toEqual (lookahead);
  });

});