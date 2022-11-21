import {
  All, ASTNode, BooleanLiteral, Call,
  Identifier, Literal, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "../nodes";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Tokenizer, { Token, TokenType } from "../Tokenizer";

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
    this.lookahead = this.tokenizer.getNextToken ();
    this.table = table;
  }

  Root() {
    const members = this.members ();
    return Root (this.table, members.length ? members : [All ("*")]);
  }

  Identifier() {
    const name = this.eat ("IDENTIFIER").value;
    const [as, cast] = this.castAs ();

    return Identifier (name, as, cast);
  }

  All() {
    const sign = this.eat ("*").value;

    return All (sign);
  }

  Variable() {
    /**
     * if RQLTag
     * geef parser current table
     * filter current table refs where hasMany of belongsTo.table == this.table, maak equals method`
     * laat variable ook array retourneren indien meerdere matches ?
     * if empty throw error
     * voeg rqlTag zijn members toe aan de gevonden hasMany tag en return deze
     * set as
     * splice variable
     */

    this.eat ("VARIABLE");
    const value = this.values[this.idx];
    const [as, cast] = this.castAs ();

    if (RQLTag.isRQLTag (value)) {
      this.values.splice (this.idx, 1);
      const { members, table } = value.node;

      const ref = this.table.refs.find (([t]) => {
        return t.equals (table);
      });

      if (!ref) {
        throw new Error (
          `${this.table.name} has no ref defined for: ${table.name}`
        );
      }

      return ref[1] (this.table, members, as);
    }
    const variable = Variable (value, as, cast);
    this.idx += 1;

    return variable;
  }

  Call(identifier: Identifier) {
    return Call (identifier.name, this.arguments (), identifier.as, identifier.cast);
  }

  members(): ASTNode<unknown>[] {
    if (this.isNext ("VARIABLE") && Array.isArray (this.values[this.idx])) {
      const members = this.spliceValue ();
      if (
        !members.reduce ((acc: Boolean, m: ASTNode<unknown>) => acc && m.isASTNode, true)
      ) {
        throw new SyntaxError ("Invalid dynamic members, expected Array of ASTNode");
      }

      this.eat ("EOT");

      return members;
    }

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

    return members;
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

    return BooleanLiteral (value, as, cast);
  }

  NullLiteral() {
    this.eat ("null");
    const [as, cast] = this.castAs ();

    return NullLiteral (null, as, cast);
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

    return NumericLiteral (Number (token.value), as, cast);
  }

  eat(tokenType: TokenType) {
    const token = this.lookahead;

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