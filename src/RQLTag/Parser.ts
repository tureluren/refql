import RQLTag from ".";
import {
  all, ASTNode, Call, Identifier,
  isASTNode, Literal, StringLiteral, Variable
} from "../nodes";
import Table from "../Table";
import Tokenizer, { Token, TokenType } from "./Tokenizer";

class Parser {
  str: string;
  values: any[];
  idx: number;
  tokenizer: Tokenizer;
  lookahead: Token;
  table: Table;

  constructor(str: string, values: any[], table: Table) {
    this.str = str;
    this.values = values;
    this.idx = 0;
    this.tokenizer = new Tokenizer (str);
    this.table = table;
    this.lookahead = this.getNextToken ();
  }

  Identifier() {
    const name = this.eat ("IDENTIFIER").value;
    const [as, cast] = this.castAs ();

    return Identifier (name, as, cast);
  }

  All() {
    this.eat ("*").value;

    return all;
  }

  refer(tag: RQLTag<unknown>, as?: string) {
    if (tag.table.equals (this.table)) {
      return tag.nodes;
    }

    const ref = this.table.refs.find (([t]) => {
      return t.equals (tag.table);
    });

    if (!ref) {
      throw new Error (
        `${this.table.name} has no ref defined for: ${tag.table.name}`
      );
    }

    return ref[1] (this.table, tag, as);
  }

  Variable() {
    this.eat ("VARIABLE");
    const value = this.values[this.idx];
    const [as, cast] = this.castAs ();
    this.idx += 1;

    if (RQLTag.isRQLTag (value)) {
      return this.refer (value, as);
    }

    if (Table.isTable (value)) {
      return this.refer (value.empty (), as);
    }

    if (Array.isArray (value)) {
      if (
        !value.reduce ((acc: Boolean, m: ASTNode<unknown>) => acc && isASTNode (m), true)
      ) {
        throw new Error ("Invalid dynamic members, expected Array of ASTNode");
      }

      return value;
    }

    if (isASTNode (value)) {
      return value;
    }

    // SQLTag or ValueType
    const variable = Variable (value, as, cast);

    return variable;
  }

  Call(identifier: Identifier) {
    return Call (identifier.name, this.arguments (), identifier.as, identifier.cast);
  }

  nodes(): ASTNode<unknown>[] {
    const members = [];

    while (!this.isNext ("EOT")) {
      const member = this.Member ();

      if (this.isNext ("(")) {
        members.push (this.Call (member as Identifier));
      } else {
        members.push (member);
      }
    }

    this.eat ("EOT");

    return members.flat (1);
  }

  arguments() {
    this.eat ("(");
    const argumentList: ASTNode<unknown>[] = [];

    if (!this.isNext (")")) {
      do {
        const argument = this.Argument ();

        if (this.isNext ("(")) {
          argumentList.push (this.Call (argument as Identifier));
        } else {
          argumentList.push (argument);
        }
      } while (this.hasArg ());
    }

    this.eat (")");

    return argumentList.flat (1);
  }

  hasArg() {
    return !this.isNext (")") && this.eat (",");
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

  Member() {
    if (this.isNextLiteral ()) {
      return this.Literal ();
    }
    switch (this.lookahead.type) {
      case "*":
        return this.All ();
      case "IDENTIFIER":
        return this.Identifier ();
      case "VARIABLE":
        return this.Variable ();
    }

    throw new SyntaxError (`Unknown Member Type: "${this.lookahead.type}"`);
  }

  Argument() {
    if (this.isNextLiteral ()) {
      return this.Literal ();
    }
    switch (this.lookahead.type) {
      case "IDENTIFIER":
        return this.Identifier ();
      case "VARIABLE":
        return this.Variable () as Variable<unknown>;
    }

    throw new SyntaxError (`Unknown Argument Type: "${this.lookahead.type}"`);
  }

  Literal(): Literal {
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

    return Literal (value, as, cast);
  }

  NullLiteral() {
    this.eat ("null");
    const [as, cast] = this.castAs ();

    return Literal (null, as, cast);
  }

  StringLiteral() {
    const token = this.eat ("STRING");
    const value = token.value.slice (1, -1);
    const [as, cast] = this.castAs ();

    return StringLiteral (value, as, cast);
  }

  NumericLiteral() {
    const token = this.eat ("NUMBER");
    const [as, cast] = this.castAs ();

    return Literal (Number (token.value), as, cast);
  }

  getNextToken(): any {
    let lookahead = this.tokenizer.getNextToken ();
    // ignore comments
    while (lookahead.type === "COMMENT") {
      this.values.splice (this.idx, lookahead.skipCount);
      lookahead = this.tokenizer.getNextToken ();
    }
    return lookahead;
  }

  eat(tokenType: TokenType) {
    const token = this.lookahead;

    if (token.type !== tokenType) {
      throw new SyntaxError (
        `Unexpected token: "${token.value}", expected: "${tokenType}"`
      );
    }

    this.lookahead = this.getNextToken ();

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