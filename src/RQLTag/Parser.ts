import RQLTag from ".";
import { Boxes } from "../common/BoxRegistry";
import { Ref, RQLTagVariable } from "../common/types";
import {
  all, ASTNode, Call, Identifier,
  isASTNode, Literal, StringLiteral, Variable
} from "../nodes";
import Table from "../Table";
import Tokenizer, { Token, TokenType } from "./Tokenizer";

class Parser<Params, Output, Box extends Boxes> {
  str: string;
  variables: RQLTagVariable<Params, Output, Box>[];
  idx: number;
  tokenizer: Tokenizer;
  lookahead: Token;
  table: Table<Box>;

  constructor(str: string, variables: any[], table: Table<Box>) {
    this.str = str;
    this.variables = variables;
    this.idx = 0;
    this.tokenizer = new Tokenizer (str);
    this.table = table;
    this.lookahead = this.getNextToken ();
  }

  Identifier() {
    const name = this.eat ("IDENTIFIER").x;
    const [as, cast] = this.castAs ();

    return Identifier (name, as, cast);
  }

  All() {
    this.eat ("*").x;

    return all;
  }

  refer(tag: RQLTag<Params, Output, Box>, as?: string, single?: boolean) {
    if (tag.table.equals (this.table)) {
      return tag.nodes;
    }

    const refs: Ref<Box>[] = this.table.refs.filter (([t]) => {
      return t.equals (tag.table);
    });

    if (!refs.length) {
      throw new Error (
        `${this.table.name} has no ref defined for: ${tag.table.name}`
      );
    }

    return refs.map (ref => ref[1] (this.table, RQLTag (tag.table, tag.nodes), as, single));
  }

  Variable() {
    // this assignment must preceed `eat`
    // because it might get skipped `by getNextToken`
    const x = this.variables[this.idx];
    this.eat ("VARIABLE");

    const [as, cast, single] = this.castAs ();
    this.idx += 1;

    if (RQLTag.isRQLTag<Params, Output, Box> (x)) {
      return this.refer (x, as, single);
    }

    if (Table.isTable<Box> (x)) {
      return this.refer (x.empty (), as, single);
    }

    if (Array.isArray (x)) {
      if (
        !(x as ASTNode<Params, Output, Box>[]).reduce ((acc: boolean, m: ASTNode<Params, Output, Box>) => acc && isASTNode<Params, Output, Box> (m), true)
      ) {
        throw new Error ("Invalid dynamic members, expected Array of ASTNode");
      }

      return x;
    }

    if (isASTNode (x)) {
      return x;
    }

    // SQLTag or ValueType
    const variable = Variable (x, as, cast);

    return variable;
  }

  Call(identifier: Identifier<Params, Output, Box>) {
    return Call (identifier.name, this.arguments (), identifier.as, identifier.cast);
  }

  nodes(): ASTNode<Params, Output, Box>[] {
    const members = [];

    while (!this.isNext ("EOT")) {
      const member = this.Member ();

      if (this.isNext ("(")) {
        members.push (this.Call (member as unknown as Identifier<Params, Output, Box>));
      } else {
        members.push (member);
      }
    }

    this.eat ("EOT");

    return members.flat (1);
  }

  arguments() {
    this.eat ("(");
    const argumentList: ASTNode<Params, Output, Box>[] = [];

    if (!this.isNext (")")) {
      do {
        const argument = this.Argument ();

        if (this.isNext ("(")) {
          argumentList.push (this.Call (argument as unknown as Identifier<Params, Output, Box>));
        } else {
          argumentList.push (argument as ASTNode<Params, Output, Box>);
        }
      } while (this.hasArg ());
    }

    this.eat (")");

    return argumentList.flat (1);
  }

  hasArg() {
    return !this.isNext (")") && this.eat (",");
  }

  castAs(): [string | undefined, string | undefined, boolean | undefined] {
    let as, cast, single;

    if (this.isNext (":1")) {
      this.eat (":1");
      as = this.eat ("IDENTIFIER").x;
      single = true;
    }

    if (this.isNext (":")) {
      this.eat (":");
      as = this.eat ("IDENTIFIER").x;
    }

    if (this.isNext ("::")) {
      this.eat ("::");
      cast = this.eat ("IDENTIFIER").x;
    }

    return [as, cast, single];
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
        return this.Variable ();
    }

    throw new SyntaxError (`Unknown Argument Type: "${this.lookahead.type}"`);
  }

  Literal(): Literal<Params, Output, Box> {
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

  BooleanLiteral(x: boolean) {
    this.eat (x ? "true" : "false");
    const [as, cast] = this.castAs ();

    return Literal<Params, Output, Box> (x, as, cast);
  }

  NullLiteral() {
    this.eat ("null");
    const [as, cast] = this.castAs ();

    return Literal<Params, Output, Box> (null, as, cast);
  }

  StringLiteral() {
    const token = this.eat ("STRING");
    const x = token.x.slice (1, -1);
    const [as, cast] = this.castAs ();

    return StringLiteral<Params, Output, Box> (x, as, cast);
  }

  NumericLiteral() {
    const token = this.eat ("NUMBER");
    const [as, cast] = this.castAs ();

    return Literal<Params, Output, Box> (Number (token.x), as, cast);
  }

  getNextToken(): any {
    let lookahead = this.tokenizer.getNextToken ();
    // ignore comments
    while (lookahead.type === "COMMENT") {
      this.variables.splice (this.idx, lookahead.skipCount);
      lookahead = this.tokenizer.getNextToken ();
    }
    return lookahead;
  }

  eat(tokenType: TokenType) {
    const token = this.lookahead;

    if (token.type !== tokenType) {
      throw new SyntaxError (
        `Unexpected token: "${token.x}", expected: "${tokenType}"`
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