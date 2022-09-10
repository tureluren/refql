import Tokenizer from "../Tokenizer";
import {
  Keywords, Literal, RefQLValue, Token, TokenType
} from "../types";
import identifierToTable from "./identifierToTable";
import {
  All, ASTNode, BelongsTo, BooleanLiteral, Call,
  HasMany, Identifier, ManyToMany, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "./nodes";
import Table from "../Table";
import RQLTag from "../RQLTag";

class Parser<Params> {
  str: string;
  values: RefQLValue<Params>[];
  idx: number;
  tokenizer: Tokenizer;
  lookahead: Token;

  constructor(str: string, values: RefQLValue<Params>[]) {
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

    return HasMany.of (table, members, keywords);
  }

  BelongsTo() {
    this.eat ("-");
    const { table, members, keywords } = this.Table ();

    return BelongsTo.of (table, members, keywords);
  }

  ManyToMany() {
    this.eat ("x");
    const { table, members, keywords } = this.Table ();

    return ManyToMany.of (table, members, keywords);
  }

  Identifier() {
    const name = this.eat ("IDENTIFIER").value;
    const [as, cast] = this.castAs ();

    return Identifier.of (name, as, cast);
  }

  Table() {
    let table;

    if (this.isNext ("VARIABLE")) {
      let value = this.spliceValue ();

      if (value instanceof RQLTag) {
        return value.node;
      } else if (Table.isTable (value)) {
        table = value;
      } else {
        throw new SyntaxError ("Invalid dynamic RQLTag/Table, expected instance of RQLTag/Table");
      }

    } else {
      table = identifierToTable (this.Schema (), this.Identifier ());
    }

    let keywords: Keywords<Params> = {};

    if (this.isNext ("(")) {
      this.eat ("(");

      do {
        let value;
        const keyword = this.eat ("IDENTIFIER").value as keyof Keywords<Params>;
        this.eat (":");

        if (this.isNextLiteral ()) {
          value = this.Literal ().value;
        } else if (this.isNext ("VARIABLE")) {
          value = this.spliceValue ();
        } else {
          throw new SyntaxError (
            `Only Literals or Variables are allowed as keywords, not: "${this.lookahead.type}"`
          );
        }

        keywords[keyword] = value;

      } while (this.hasArg ());

      this.eat (")");
    }

    return { table, members: this.members (), keywords };
  }

  All() {
    const sign = this.eat ("*").value;

    return All.of (sign);
  }

  Schema() {
    if (this.isNext ("SCHEMA")) {
      return this.eat ("SCHEMA").value.slice (0, -1);
    }
  }

  Variable() {
    this.eat ("VARIABLE");
    const key = this.values[this.idx];
    const [as, cast] = this.castAs ();
    const variable = Variable.of (key, as, cast);
    this.idx += 1;

    return variable;
  }

  Call(identifier: Identifier<Params>) {
    return Call.of (identifier.name, this.arguments (), identifier.as, identifier.cast);
  }

  members() {
    if (this.isNext ("VARIABLE")) {
      const members = this.spliceValue ();
      if (
        !Array.isArray (members) ||
        !members.length ||
        !members.reduce ((acc, m) => acc && m instanceof ASTNode, true)
      ) {
        throw new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode");
      }

      return members;
    }

    this.eat ("{");

    if (this.isNext ("}")) {
      throw new SyntaxError ("A table block should have at least one member");
    }

    const members: ASTNode<Params>[] = [];

    do {
      const member = this.Member ();

      if (this.isNext ("(")) {
        members.push (this.Call (member as Identifier<Params>));
      } else {
        members.push (member);
      }

    } while (!this.isNext ("}"));

    this.eat ("}");

    return members;
  }

  arguments() {
    this.eat ("(");
    const argumentList: ASTNode<Params>[] = [];

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

  spliceValue() {
    const value = this.values[this.idx];
    this.values.splice (this.idx, 1);
    this.eat ("VARIABLE");

    return value;
  }

  Member(): ASTNode<Params> {
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

    throw new SyntaxError (`Unknown Member Type: "${this.lookahead.type}"`);
  }

  Argument(): ASTNode<Params> {
    if (this.isNextLiteral ()) {
      return this.Literal ();
    }
    switch (this.lookahead.type) {
      case "IDENTIFIER":
        return this.Identifier ();
      case "VARIABLE":
        return this.Variable ();
    }

    throw new SyntaxError (`Unknown Argument Type: "${this.lookahead.type}"`);
  }

  Literal(): Literal<Params> {
    switch (this.lookahead.type) {
      case "NUMBER":
        return this.NumericLiteral ();
      case "STRING":
        return this.StringLiteral ();
      case "true":
        return this.BooleanLiteral (true);
      case "false":
        return this.BooleanLiteral (false);
      case "null":
        return this.NullLiteral ();
    }

    throw new SyntaxError (`Unknown Literal: "${this.lookahead.type}"`);
  }

  BooleanLiteral(value: boolean) {
    this.eat (value ? "true" : "false");
    const [as, cast] = this.castAs ();

    return BooleanLiteral.of (value, as, cast);
  }

  NullLiteral() {
    this.eat ("null");
    const [as, cast] = this.castAs ();

    return NullLiteral.of (null, as, cast);
  }

  StringLiteral() {
    const token = this.eat ("STRING");
    const value = token.value.slice (1, -1);
    const [as, cast] = this.castAs ();

    return StringLiteral.of (value, as, cast);
  }

  NumericLiteral() {
    const token = this.eat ("NUMBER");
    const [as, cast] = this.castAs ();

    return NumericLiteral.of (Number (token.value), as, cast);
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
}

export default Parser;