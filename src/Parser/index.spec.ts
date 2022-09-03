import Parser from ".";
import Raw from "../Raw";
import rql from "../RqlTag/rql";
import sql from "../SqlTag/sql";
import Table from "../Table";
import Tokenizer from "../Tokenizer";
import { TokenType } from "../types";
import {
  All, BelongsTo, BooleanLiteral, Call,
  HasMany, Identifier, ManyToMany, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "./nodes";

describe ("Parser type", () => {
  test ("create Parser", () => {
    const player = Table.of ("player");
    const str = "$ { * }";
    const parser = Parser.of (str, [player]);
    const tokenizer = Tokenizer.of (str);
    const lookahead = tokenizer.getNextToken ();

    expect (parser.str).toBe (str);
    expect (parser.idx).toBe (0);
    expect (parser.values).toEqual ([player]);
    expect (parser.tokenizer).toEqual (tokenizer);
    expect (parser.lookahead).toEqual (lookahead);
  });

  test ("references", () => {
    const position = Table.of ("position");
    const spaceRaw = Raw.of ("' '");

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
        x game:games { result }
      }
    `;

    const player = Table.of ("player");
    const identifier = Identifier.of ("id", "identifier", "text");
    const birthday = Identifier.of ("birthday");

    const lastName = Identifier.of ("last_name");
    const upperLastName = Call.of ("upper", [lastName]);
    const firstName = Identifier.of ("first_name");
    const space = StringLiteral.of (" ");
    const spaceVariable = Variable.of (spaceRaw);
    const fullName = Call.of ("concat", [upperLastName, space, spaceVariable, firstName], "full_name");

    const goals = Table.of ("goal", "goals");
    const minute = Identifier.of ("minute");
    const goalsAst = HasMany.of (goals, [minute], { limit: 5, offset: 0 });

    const team = Table.of ("team", undefined, "public");
    const name = Identifier.of ("name", "team_name");
    const players = Table.of ("player", "players");
    const allPositionFields = All.of ("*");
    const positionAst = BelongsTo.of (position, [allPositionFields], {});
    const playersAst = HasMany.of (players, [lastName, positionAst], {});
    const teamAst = BelongsTo.of (team, [name, playersAst], {});

    const games = Table.of ("game", "games");
    const result = Identifier.of ("result");
    const gamesAst = ManyToMany.of (games, [result], {});

    const expected = Root.of (
      player,
      [identifier, birthday, fullName, goalsAst, teamAst, gamesAst],
      { id: 1 }
    );

    expect (tag.node).toEqual (expected);
  });

  test ("variables", () => {
    const orderBySql = sql`order by player.last_name`;
    type Params = { limit: number; offset: number };

    const getLimit = (p: Params) => p.limit;
    const getOffset = (p: Params) => p.offset;

    const tag = rql<Params>`
      player (id: ${1}, limit: ${getLimit}, offset: ${getOffset}) { 
        id 
        last_name
        ${orderBySql}
      }
    `;

    const player = Table.of ("player");
    const id = Identifier.of ("id");
    const lastName = Identifier.of ("last_name");
    const orderBy = Variable.of (orderBySql);

    const expected = Root.of<Params> (
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

    const player = Table.of ("player");
    const one = StringLiteral.of ("1", "one", "int");
    const two = NumericLiteral.of (2, "two", "text");
    const t = BooleanLiteral.of (true, "t", "text");
    const f = BooleanLiteral.of (false, "f", "text");
    const n = NullLiteral.of (null, "n", "text");

    const expected = Root.of (
      player,
      [one, two, t, f, n],
      {}
    );

    expect (tag.node).toEqual (expected);
  });

  test ("syntax errors", () => {
    expect (() => rql`${"player"} { id }`)
      .toThrowError (new SyntaxError ("Invalid dynamic RqlTag/Table, expected instance of RqlTag/Table"));

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

    const parser = Parser.of ("player { * }", []);
    parser.lookahead = { type: "DOUBLE" as TokenType, value: "3.14" };

    expect (() => parser.Literal ())
      .toThrowError (new SyntaxError ('Unknown Literal: "DOUBLE"'));
  });
});