import {
  All, all, ASTNode, BooleanLiteral, Call,
  Identifier, isLiteral, Literal, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
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
    return Root (this.table, this.members ());
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

  refer(tag: RQLTag<unknown, unknown>, as?: string) {
    this.values.splice (this.idx, 1);

    if (tag.node.table.equals (this.table)) {
      return tag.node.members;
    }

    const ref = this.table.refs.find (([t]) => {
      return t.equals (tag.node.table);
    });

    if (!ref) {
      throw new Error (
        `${this.table.name} has no ref defined for: ${tag.node.table.name}`
      );
    }

    return ref[1] (tag, as);
  }

  Variable(inCall = false) {
    this.eat ("VARIABLE");
    const value = this.values[this.idx];
    const [as, cast] = this.castAs ();

    if (Table.isTable (value)) {
      if (!inCall) {
        return this.refer (value, [all], as);
      }
      throw new Error ("U can't use a Table as a function argument");
    }

    if (RQLTag.isRQLTag (value)) {
      if (!inCall) {
        return this.refer (value, as);
      }
      throw new Error ("U can't use a RQLTag as a function argument");
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
        !members.reduce ((acc: Boolean, m: ASTNode<unknown>) => acc && isASTNode (m), true)
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

    return members.flat ();
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
        return this.Variable (true) as Variable<unknown>;
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