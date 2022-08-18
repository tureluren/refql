import isLiteral from "../predicate/isLiteral";
import Tokenizer from "../Tokenizer";
import {
  AstNode, Keywords, Literal,
  RQLValue, Token
} from "../types";
import {
  All, BelongsTo, BooleanLiteral,
  Call, HasMany, Identifier,
  ManyToMany, NullLiteral, NumericLiteral,
  Root, StringLiteral, Variable
} from "./Node";
import identifierToTable from "./identifierToTable";
import Table from "../Table";

const isVariable = (value: any) =>
  value === "VARIABLE";

class Parser<Params> {
  tokenizer: Tokenizer;
  string: string;
  keys: RQLValue<Params>[];
  keyIdx: number;
  lookahead!: Token;

  constructor() {
    this.tokenizer = new Tokenizer ();
    this.string = "";
    this.keys = [];
    this.keyIdx = 0;
  }

  parse(string: string, keys: RQLValue<Params>[]) {
    this.string = string;
    this.keys = keys;
    this.keyIdx = 0;
    this.tokenizer.init (string);
    this.lookahead = this.tokenizer.getNextToken ();

    const { table, members, keywords } = this.Table ();
    return new Root (table, members, keywords);
  }

  Table() {
    let table;

    if (isVariable (this.lookahead.type)) {
      const variable = this.grabVariable ();

      if (variable instanceof Table) {
        table = variable;

      } else {
        throw new Error ("expecte table");
      }

    } else {

      table = identifierToTable (this.Schema (), this.Identifier ());
    }
    let keywords: Keywords<Params> = {};

    if (this.lookahead.type === "(") {
      this.eat ("(");

      do {
        const identifier = this.eat ("IDENTIFIER").value as keyof Keywords<Params>;
        this.eat (":");
        let value;

        if (isLiteral (this.lookahead.type)) {
          value = this.Literal ().value;

        } else if (isVariable (this.lookahead.type)) {
          value = this.grabVariable ();

        } else {
          throw new SyntaxError (
            `Only Literals or Variables are allowed as parameters, not: "${this.lookahead.type}"`
          );
        }

        // @ts-ignore
        keywords[identifier] = value;

        // @ts-ignore
      } while (this.lookahead.type === "," && this.eat (",") && this.lookahead.type !== ")");

      this.eat (")");
    }

    return { table, members: this.members (), keywords };
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

  All() {
    const sign = this.eat ("*").value;
    return new All (sign);
  }

  Schema() {
    if (this.lookahead.type === "SCHEMA") {
      return this.eat ("SCHEMA").value.slice (0, -1);
    }
  }

  Identifier() {
    const name = this.eat ("IDENTIFIER").value;

    let identifier = new Identifier (name);

    if (this.lookahead.type === ":") {
      this.eat (":");
      identifier.as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      identifier.cast = this.eat ("IDENTIFIER").value;
    }

    return identifier;
  }

  grabVariable() {
    const key = this.keys[this.keyIdx];

    this.keys.splice (this.keyIdx, 1);
    this.eat ("VARIABLE");

    return key;
  }

  Variable() {
    this.eat ("VARIABLE");

    const key = this.keys[this.keyIdx];

    const variable = new Variable (key);

    this.keyIdx += 1;

    if (this.lookahead.type === ":") {
      this.eat (":");
      variable.as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      variable.cast = this.eat ("IDENTIFIER").value;
    }

    return variable;
  }

  Call(callee: Identifier<Params>) {
    return new Call (callee.name, this.Arguments (), callee.as, callee.cast);
  }

  members() {
    this.eat ("{");

    if (this.lookahead.type === "}") {
      throw new SyntaxError ("A table block should have at least one AstNode");
    }

    const members: AstNode<Params>[] = [];

    do {
      const AstNode = this.AstNode ();

      if (this.lookahead.type === "(") {
        // can only be an identifier
        members.push (this.Call (AstNode as Identifier<Params>));
      } else {
        members.push (AstNode);
      }

    } while (this.lookahead.type !== "}");

    this.eat ("}");

    return members;
  }

  Arguments() {
    this.eat ("(");

    const argumentList: AstNode<Params>[] = [];

    if (this.lookahead.type !== ")") {

      do {
        const argument = this.Argument ();

        if (this.lookahead.type === "(") {
          // can only be an identifier
          argumentList.push (this.Call (argument as Identifier<Params>));
        } else {
          argumentList.push (argument);
        }
      // @ts-ignore
      } while (this.lookahead.type === "," && this.eat (",") && this.lookahead.type !== ")");
    }

    this.eat (")");

    return argumentList;
  }

  AstNode(): AstNode<Params> {
    if (isLiteral (this.lookahead.type)) {
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
    if (isLiteral (this.lookahead.type)) {
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
    let as, cast;

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      cast = this.eat ("IDENTIFIER").value;
    }

    return new BooleanLiteral (value, as, cast);
  }

  NullLiteral() {
    this.eat ("null");
    let as, cast;

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      cast = this.eat ("IDENTIFIER").value;
    }

    return new NullLiteral (null, as, cast);
  }

  StringLiteral() {
    let value, cast, as;
    const token = this.eat ("STRING");
    value = token.value.slice (1, -1);

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      cast = this.eat ("IDENTIFIER").value;
    }

    return new StringLiteral (value, as, cast);
  }

  NumericLiteral() {
    const token = this.eat ("NUMBER");

    // `as` should be a string
    let as, cast;

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      cast = this.eat ("IDENTIFIER").value;
    }

    return new NumericLiteral (Number (token.value), as, cast);
  }

  eat(tokenType: string) {
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
}

export default Parser;