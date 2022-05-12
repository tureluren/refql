import toPlural from "pluralize";
import isEmpty from "../predicate/isEmpty";
import isLiteral from "../predicate/isLiteral";
import isObject from "../predicate/isObject";
import convertLinks from "../refs/convertLinks";
import convertRefs from "../refs/convertRefs";
import Tokenizer from "../Tokenizer";
import validateKeywords from "./validateKeywords";
import convertCase from "../more/convertCase";
import {
  AST, ASTType, BelongsTo, BooleanLiteral,
  Call, CaseType, HasMany, Identifier, Keywords,
  Literal, ManyToMany, NullLiteral, NumericLiteral,
  OptCaseType, Plurals, RQLValue, StringLiteral,
  Subselect, Token, Variable
} from "../types";

class Parser {
  caseTypeDB?: CaseType;
  caseTypeJS?: CaseType;
  pluralize: boolean;
  plurals: Plurals;
  tokenizer: Tokenizer;
  string: string;
  keys: RQLValue[];
  keyIdx: number;
  lookahead!: Token;

  constructor(caseTypeDB: OptCaseType, caseTypeJS: OptCaseType, pluralize: boolean, plurals: Plurals) {
    this.caseTypeDB = caseTypeDB;
    this.caseTypeJS = caseTypeJS;
    this.pluralize = pluralize;
    this.plurals = plurals;
    this.tokenizer = new Tokenizer ();
    this.string = "";
    this.keys = [];
    this.keyIdx = 0;
  }

  parse(string: string, keys: RQLValue[]): AST {
    this.string = string;
    this.keys = keys;
    this.keyIdx = 0;
    this.tokenizer.init (string);
    this.lookahead = this.tokenizer.getNextToken ();

    return this.AST ();
  };

  AST(pluralizable = false) {
    let table = <AST><unknown> this.Identifier (pluralizable);

    if (this.lookahead.type === "(") {
      this.eat ("(");
      let keywords: Keywords = {};

      // @ts-ignore
      if (this.lookahead.type === "VARIABLE") {
        keywords = <Keywords> this.grabVariable ();

        if (!isObject (keywords)) {
          throw new TypeError (`${table.name} + (${"${}"}) should be of type Object`);
        }

      // @ts-ignore
      } else if (this.lookahead.type !== ")") {

        do {
          const identifier = this.eat ("IDENTIFIER").value;
          this.eat (":");
          let value;

          if (isLiteral (this.lookahead.type)) {
            value = this.Literal ().value;

          // @ts-ignore
          } else if (this.lookahead.type === "VARIABLE") {
            value = this.grabVariable ();

          } else {
            throw new SyntaxError (
              `Only Literals or Variables are allowed as parameters, not: "${this.lookahead.type}"`
            );
          }

          keywords[identifier] = value;

        // @ts-ignore
        } while (this.lookahead.type === "," && this.eat (",") && this.lookahead.type !== ")");
      }

      if (!isEmpty (keywords)) {
        // `keywords.orderBy` is validated by the interpreter
        validateKeywords (keywords);

        // keys from keywords will overwrite identifier props
        // null, undefined or ""
        if (keywords.as) {
          table.as = keywords.as;
        }

        if (keywords.id) {
          table.id = keywords.id;
        }

        if (keywords.limit) {
          table.limit = keywords.limit;
        }

        if (keywords.offset) {
          table.offset = keywords.offset;
        }

        if (keywords.orderBy) {
          table.orderBy = keywords.orderBy;
        }

        if (keywords.links) {
          table.links = convertLinks (this.caseTypeDB, keywords.links);
        }

        if (keywords.refs) {
          table.refs = convertRefs (this.caseTypeDB, keywords.refs);
        }

        if (keywords.xTable) {
          table.xTable = convertCase (this.caseTypeDB, keywords.xTable);
        }
      }

      this.eat (")");
    }

    table.type = "AST";
    table.members = this.Members ();

    return table;
  };

  grabVariable() {
    const variable = this.keys[this.keyIdx];

    this.keys.splice (this.keyIdx, 1);
    this.eat ("VARIABLE");

    return variable;
  }

  HasMany(): HasMany {
    this.eat ("<");
    return {
      type: "HasMany",
      include: this.AST (true)
    };
  };

  BelongsTo(): BelongsTo {
    this.eat ("-");
    return {
      type: "BelongsTo",
      include: this.AST ()
    };
  };

  ManyToMany(): ManyToMany {
    this.eat ("x");
    return {
      type: "ManyToMany",
      include: this.AST (true)
    };
  };

  Subselect(): Subselect {
    this.eat ("&");

    const subselect = <Subselect><unknown> this.Identifier ();

    // the interpreter will check if this variable is
    // a SQLTag or a function that returns a SQLTag
    subselect.tag = this.Variable ().value;

    subselect.type = "Subselect";

    return subselect;
  };

  Identifier(pluralizable = false) {
    let name, as;
    name = as = this.eat ("IDENTIFIER").value;

    // can only be handled here
    // to give the user the possibility to overwrite `as`
    name = convertCase (this.caseTypeDB, name);
    as = convertCase (this.caseTypeJS, as);

    if (pluralizable) {
      const selfProvided = this.plurals[as];

      if (selfProvided) {
        as = selfProvided;
      } else if (this.pluralize) {
        as = toPlural (as);
      }
    }

    let identifier: Identifier = {
      type: "Identifier",
      name,
      as
    };

    // overwrite if `as` is specified
    if (this.lookahead.type === ":") {
      this.eat (":");
      identifier.as = this.eat ("IDENTIFIER").value;
    }

    if (this.lookahead.type === "::") {
      this.eat ("::");
      identifier.cast = this.eat ("IDENTIFIER").value;
    }

    return identifier;
  };

  Variable() {
    this.eat ("VARIABLE");

    const key = this.keys[this.keyIdx];

    let variable: Variable = {
      type: "Variable",
      idx: this.keyIdx,
      value: key
    };

    this.keyIdx += 1;

    if (this.lookahead.type === "::") {
      this.eat ("::");
      variable.cast = this.eat ("IDENTIFIER").value;
    }

    return variable;
  };

  Call(callee: Identifier): Call {
    return {
      ...callee,
      type: "Call",
      args: this.Arguments ()
    };
  };

  Members() {
    this.eat ("{");

    if (this.lookahead.type === "}") {
      throw new SyntaxError ("A table block should have at least one member");
    }

    const members: ASTType[] = [];

    do {
      const member = this.Member ();

      if (this.lookahead.type === "(") {
        // can only be an identifier
        members.push (this.Call (<Identifier>member));
      } else {
        members.push (member);
      }

    } while (this.lookahead.type !== "}");

    this.eat ("}");

    return members;
  };

  Arguments() {
    this.eat ("(");

    const argumentList: ASTType[] = [];

    if (this.lookahead.type !== ")") {

      do {
        const argument = this.Argument ();

        if (this.lookahead.type === "(") {
          // can only be an identifier
          argumentList.push (this.Call (<Identifier>argument));
        } else {
          argumentList.push (argument);
        }
      // @ts-ignore
      } while (this.lookahead.type === "," && this.eat (",") && this.lookahead.type !== ")");
    }

    this.eat (")");

    return argumentList;
  };

  Member(): ASTType {
    if (isLiteral (this.lookahead.type)) {
      return this.Literal ();
    }
    switch (this.lookahead.type) {
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
      case "&":
        return this.Subselect ();
    }

    throw new SyntaxError (`Unknown Member Type: "${this.lookahead.type}"`);
  };

  Argument(): ASTType {
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
  };

  Literal(): Literal {
    switch (this.lookahead.type) {
      case "NUMBER": return this.NumericLiteral ();
      case "STRING": return this.StringLiteral ();
      case "true": return this.BooleanLiteral (true);
      case "false": return this.BooleanLiteral (false);
      case "null": return this.NullLiteral ();
      default:
        throw new SyntaxError (`Unknown Literal: "${this.lookahead.type}"`);
    }
  };

  BooleanLiteral(value: boolean): BooleanLiteral {
    let as = value ? "true" : "false";
    this.eat (as);

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    return {
      type: "BooleanLiteral",
      value,
      as
    };
  };

  NullLiteral(): NullLiteral {
    this.eat ("null");
    let as = "null";

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    return {
      type: "NullLiteral",
      value: null,
      as
    };
  };

  StringLiteral(): StringLiteral {
    let value, as;
    const token = this.eat ("STRING");
    value = as = token.value.slice (1, -1);

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    return {
      type: "StringLiteral",
      value,
      as
    };
  };

  NumericLiteral(): NumericLiteral {
    const token = this.eat ("NUMBER");

    // `as` should be a string
    let as = token.value;

    if (this.lookahead.type === ":") {
      this.eat (":");
      as = this.eat ("IDENTIFIER").value;
    }

    return {
      type: "NumericLiteral",
      value: Number (token.value),
      as
    };
  };

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
  };
}

export default Parser;