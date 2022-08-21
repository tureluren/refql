import Tokenizer from "../Tokenizer";
import {
  AstNode, Keywords, Literal,
  RQLValue, Token, TokenType
} from "../types";
import {
  All, BelongsTo, BooleanLiteral, Call,
  HasMany, Identifier, ManyToMany, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "./Node";
import identifierToTable from "./identifierToTable";
import Table from "../Table";

class Parser<Params> {
  str: string;
  values: RQLValue<Params>[];
  idx: number;
  tokenizer: Tokenizer;
  lookahead: Token;

  constructor(str: string, values: RQLValue<Params>[]) {
    this.str = str;
    this.values = values;
    this.idx = 0;
    this.tokenizer = Tokenizer.of (str);
    this.lookahead = this.tokenizer.getNextToken ();
  }

  Root() {
    const { table, members, keywords } = this.Table ();

    return Root.of (table, members, keywords);
  }

  HasMany() {
    this.eat ("<");
    const { table, members, keywords } = this.Table ();

    return new HasMany (table, members, keywords);
  }

  BelongsTo() {
    this.eat ("-");
    const { table, members, keywords } = this.Table ();

    return new BelongsTo (table, members, keywords);
  }

  ManyToMany() {
    this.eat ("x");
    const { table, members, keywords } = this.Table ();

    return new ManyToMany (table, members, keywords);
  }

  Identifier() {
    const name = this.eat ("IDENTIFIER").value;
    const [as, cast] = this.castAs ();

    return Identifier.of (name, as, cast);
  }

  Table() {
    let table;

    if (this.isNext ("VARIABLE")) {
      const variable = this.spliceKey ();

      if (variable instanceof Table) {
        table = variable;
      } else {
        throw new Error ("expecte table");
      }

    } else {
      table = identifierToTable (this.Schema (), this.Identifier ());
    }

    let keywords: Keywords<Params> = {};

    if (this.isNext ("(")) {
      this.eat ("(");

      do {
        let value;
        const identifier = this.eat ("IDENTIFIER").value as keyof Keywords<Params>;

        this.eat (":");

        if (this.isNextLiteral ()) {
          value = this.Literal ().value;

        } else if (this.isNext ("VARIABLE")) {
          value = this.spliceKey ();

        } else {
          throw new SyntaxError (
            `Only Literals or Variables are allowed as parameters, not: "${this.lookahead.type}"`
          );
        }

        keywords[identifier] = value;

      } while (this.hasArg ());

      this.eat (")");
    }

    return { table, members: this.members (), keywords };
  }

  All() {
    const sign = this.eat ("*").value;

    return new All (sign);
  }

  Schema() {
    if (this.isNext ("SCHEMA")) {
      return this.eat ("SCHEMA").value.slice (0, -1);
    }
  }

  castAs() {
    let as, cast;

    if (this.isNext (":")) {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    if (this.isNext ("::")) {
      this.eat ("::");
      cast = this.eat ("IDENTIFIER").value;
    }

    return [as, cast];
  }

  spliceKey() {
    const key = this.values[this.idx];
    this.values.splice (this.idx, 1);
    this.eat ("VARIABLE");

    return key;
  }

  Variable() {
    this.eat ("VARIABLE");
    const key = this.values[this.idx];
    const [as, cast] = this.castAs ();
    const variable = new Variable (key, as, cast);
    this.idx += 1;

    return variable;
  }

  Call(identifier: Identifier<Params>) {
    return new Call (identifier.name, this.Arguments (), identifier.as, identifier.cast);
  }

  members() {
    this.eat ("{");

    if (this.isNext ("}")) {
      throw new SyntaxError ("A table block should have at least one AstNode");
    }

    const members: AstNode<Params>[] = [];

    do {
      const AstNode = this.AstNode ();

      if (this.isNext ("(")) {
        members.push (this.Call (AstNode as Identifier<Params>));
      } else {
        members.push (AstNode);
      }

    } while (!this.isNext ("}"));

    this.eat ("}");

    return members;
  }

  Arguments() {
    this.eat ("(");
    const argumentList: AstNode<Params>[] = [];

    if (!this.isNext (")")) {
      do {
        const argument = this.Argument ();

        if (this.isNext ("(")) {
          argumentList.push (this.Call (argument as Identifier<Params>));
        } else {
          argumentList.push (argument);
        }
      } while (this.hasArg ());
    }

    this.eat (")");

    return argumentList;
  }

  hasArg() {
    return this.isNext (",") && this.eat (",") && !this.isNext (")");
  }

  AstNode(): AstNode<Params> {
    if (this.isNextLiteral ()) {
      return this.Literal ();
    }
    switch (this.lookahead.type) {
      case "*":
        return this.All ();
      case "IDENTIFIER":
        return this.Identifier ();
      case "<":
        return this.HasMany ();
      case "-":
        return this.BelongsTo ();
      case "x":
        return this.ManyToMany ();
      case "VARIABLE":
        return this.Variable ();
    }

    throw new SyntaxError (`Unknown AstNode Type: "${this.lookahead.type}"`);
  }

  Argument(): AstNode<Params> {
    if (this.isNextLiteral ()) {
      return this.Literal ();
    }
    switch (this.lookahead.type) {
      case "IDENTIFIER":
        return this.Identifier ();
      case "VARIABLE":
        return this.Variable ();
    }

    throw new SyntaxError (`Invalid Argument Type: "${this.lookahead.type}"`);
  }

  Literal(): Literal<Params> {
    switch (this.lookahead.type) {
      case "NUMBER": return this.NumericLiteral ();
      case "STRING": return this.StringLiteral ();
      case "true": return this.BooleanLiteral (true);
      case "false": return this.BooleanLiteral (false);
      case "null": return this.NullLiteral ();
      default:
        throw new SyntaxError (`Unknown Literal: "${this.lookahead.type}"`);
    }
  }

  BooleanLiteral(value: boolean) {
    this.eat (value ? "true" : "false");
    const [as, cast] = this.castAs ();

    return new BooleanLiteral (value, as, cast);
  }

  NullLiteral() {
    this.eat ("null");
    const [as, cast] = this.castAs ();

    return new NullLiteral (null, as, cast);
  }

  StringLiteral() {
    const token = this.eat ("STRING");
    const value = token.value.slice (1, -1);
    const [as, cast] = this.castAs ();

    return new StringLiteral (value, as, cast);
  }

  NumericLiteral() {
    const token = this.eat ("NUMBER");
    const [as, cast] = this.castAs ();

    return new NumericLiteral (Number (token.value), as, cast);
  }

  eat(tokenType: TokenType) {
    const token = this.lookahead;

    if (token.type === "EOF") {
      throw new SyntaxError (
        `Unexpected end of input, expected: "${tokenType}"`
      );
    }

    if (token.type !== tokenType) {
      throw new SyntaxError (
        `Unexpected token: "${token.value}", expected: "${tokenType}"`
      );
    }

    this.lookahead = this.tokenizer.getNextToken ();

    return token;
  }

  isNext(tokenType: TokenType) {
    return this.lookahead.type === tokenType;
  }

  isNextLiteral() {
    const { type } = this.lookahead;

    return type === "NUMBER"
      || type === "STRING"
      || type === "true"
      || type === "false"
      || type === "null";
  }

  static of<Params>(str: string, values: RQLValue<Params>[]) {
    return new Parser (str, values);
  }

}

export default Parser;