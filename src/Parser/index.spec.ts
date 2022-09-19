import Parser from ".";
import {
  All, BelongsTo, BooleanLiteral, Call,
  HasMany, Identifier, ManyToMany, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "../nodes";
import Raw from "../Raw";
import rql from "../RQLTag/rql";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Tokenizer, { TokenType } from "../Tokenizer";

describe ("Parser type", () => {
  test ("create Parser", () => {
    const player = Table ("player");
    const str = "$ { * }";
    const parser = new Parser (str, [player]);
    const tokenizer = new Tokenizer (str);
    const lookahead = tokenizer.getNextToken ();

    expect (parser.str).toBe (str);
    expect (parser.idx).toBe (0);
    expect (parser.values).toEqual ([player]);
    expect (parser.tokenizer).toEqual (tokenizer);
    expect (parser.lookahead).toEqual (lookahead);
  });

  test ("references", () => {
    const position = Table ("position");
    const spaceRaw = Raw ("' '");

    const tag = rql`
      player (id: 1) { 
        id:identifier::text 
        birthday
        concat:full_name (upper (last_name), " ", ${spaceRaw}, first_name)
        < goal:goals (limit: 5, offset: 0) {
          minute
        }
        - public.team { 
          name:team_name
          < ${rql`
            player:players {
              last_name
              - ${position} {
                *
              }
            }
          `}
        }
        x game:games ${[All ("*")]}
      }
    `;

    const player = Table ("player");
    const identifier = Identifier ("id", "identifier", "text");
    const birthday = Identifier ("birthday");

    const lastName = Identifier ("last_name");
    const upperLastName = Call ("upper", [lastName]);
    const firstName = Identifier ("first_name");
    const space = StringLiteral (" ");
    const spaceVariable = Variable (spaceRaw);
    const fullName = Call ("concat", [upperLastName, space, spaceVariable, firstName], "full_name");

    const goals = Table ("goal", "goals");
    const minute = Identifier ("minute");
    const goalsAst = HasMany (goals, [minute], { limit: 5, offset: 0 });

    const team = Table ("team", undefined, "public");
    const name = Identifier ("name", "team_name");
    const players = Table ("player", "players");
    const allPositionFields = All ("*");
    const positionAst = BelongsTo (position, [allPositionFields], {});
    const playersAst = HasMany (players, [lastName, positionAst], {});
    const teamAst = BelongsTo (team, [name, playersAst], {});

    const games = Table ("game", "games");
    const result = Identifier ("result");
    const gamesAst = ManyToMany (games, [All ("*")], {});

    const expected = Root (
      player,
      [identifier, birthday, fullName, goalsAst, teamAst, gamesAst],
      { id: 1 }
    );

    expect (tag.node).toEqual (expected);
  });

  test ("variables", () => {
    const orderBySQL = sql`order by player.last_name`;
    type Params = { limit: number; offset: number };

    const getLimit = (p: Params) => p.limit;
    const getOffset = (p: Params) => p.offset;

    const tag = rql<Params>`
      player (id: ${1}, limit: ${getLimit}, offset: ${getOffset}) { 
        id 
        last_name
        ${orderBySQL}
      }
    `;

    const player = Table ("player");
    const id = Identifier ("id");
    const lastName = Identifier ("last_name");
    const orderBy = Variable (orderBySQL);

    const expected = Root<Params> (
      player,
      [id, lastName, orderBy],
      { id: 1, limit: getLimit, offset: getOffset }
    );

    expect (tag.node).toEqual (expected);
  });

  test ("literals", () => {
    const tag = rql`
      player {
        "1":one::int
        2:two::text
        true:t::text
        false:f::text
        null:n::text
      }
    `;

    const player = Table ("player");
    const one = StringLiteral ("1", "one", "int");
    const two = NumericLiteral (2, "two", "text");
    const t = BooleanLiteral (true, "t", "text");
    const f = BooleanLiteral (false, "f", "text");
    const n = NullLiteral (null, "n", "text");

    const expected = Root (
      player,
      [one, two, t, f, n],
      {}
    );

    expect (tag.node).toEqual (expected);
  });

  test ("syntax errors", () => {
    expect (() => rql`${"player"} { id }`)
      .toThrowError (new SyntaxError ("Invalid dynamic RQLTag/Table, expected instance of RQLTag/Table"));

    expect (() => rql`player (id: *) { id }`)
      .toThrowError (new SyntaxError ('Only Literals or Variables are allowed as keywords, not: "*"'));

    expect (() => rql`player { }`)
      .toThrowError (new SyntaxError ("A table block should have at least one member"));

    expect (() => rql`player { id, last_name }`)
      .toThrowError (new SyntaxError ('Unknown Member Type: ","'));

    expect (() => rql`player { concat(*) }`)
      .toThrowError (new SyntaxError ('Unknown Argument Type: "*"'));

    expect (() => rql``)
      .toThrowError (new SyntaxError ('Unexpected end of input, expected: "IDENTIFIER"'));

    expect (() => rql`"player" {}`)
      .toThrowError (new SyntaxError ('Unexpected token: "\"player"\", expected: "IDENTIFIER"'));

    expect (() => rql`player ${{}}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode"));

    expect (() => rql`player ${[]}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode"));

    expect (() => rql`player ${["name"]}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode"));

    const parser = new Parser ("player { * }", []);
    parser.lookahead = { type: "DOUBLE" as TokenType, value: "3.14" };

    expect (() => parser.Literal ())
      .toThrowError (new SyntaxError ('Unknown Literal: "DOUBLE"'));
  });
});